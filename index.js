const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const bodyParser = require('body-parser')

const path = require('path')
const fs = require('fs')
const os = require('os')
const qr = require('qr-image')

const ejs = require('ejs')

// Get Local IP address
const ip = os.networkInterfaces().en0.filter(address => address.family === 'IPv4')[0].address
const port = 8000

let currentRound = 0
let currentCategory = ''
let currentValue = 0

// Add static public path
app.use('/public', express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json())

// Score Routes
app.get('/api/get-scores', (req, res) => {
    res.send(getScores())
})

app.get('/api/change-score/:name/:change', async (req, res) => {
    await updateScores(req.params.name, req.params.change)
    res.send(200, 'OK')
})

// Category routes
app.get('/api/rounds/number', (req, res) => {
    res.send(200, getQuestions().length)
})

app.get('/api/rounds/:number/get-categories', (req, res) => {
    let categories = Object.keys(getQuestions()[req.params.number])
    res.send(200, categories)
})

// Questions Routes
app.get('/api/rounds/:round/:category/question-:value', (req, res) => {
    let catQuestions = getQuestions()[req.params.round][req.params.category]
    for (let question of catQuestions) {
        if (question.value == req.params.value) {
            res.send(200, question)
            break
        }
    }
    res.send(404, "Question Not Found")
})

app.get('/api/update-question/:round/:category/question-:value/:newDisplay', async (req, res) => {
    await updateQuestionDisplay(req.params.round, req.params.category, req.params.value, req.params.newDisplay == 'true')
    res.send(200, 'OK')
})

// Users Routes
app.get('/api/user/:id', (req, res) => {
    res.send(200, getUser(req.params.id))
})

// Buzzer Routes
io.on('connection', socket => {
    let user
    socket.on('buzz', person => {
        io.emit('buzz', person)
    })
    socket.on('login', person => {
        user = person
        updateScores(user, 0)
        io.emit('login', person)
    })
    socket.on('disconnect', person => {
        if (user) {
            removeScore(user)
            io.emit('unlogin', user)
        }
    })
    socket.on('buzz to server', person => {
        io.emit('buzz to controller', person)
    })
    socket.on('show question to server', question => {
        let values = question.split('\\')
        currentRound = values[0]
        currentCategory = values[1]
        currentValue = values[2]
        io.emit('show question to board', '')
    })
    socket.on('show board to server', round => {
        currentRound = parseInt(round)
        io.emit('show board to board', '')
    })
})

// Client Routes

app.get('/', (req, res)  => {
    res.sendFile(__dirname + '/pages/home.html')
})

app.get('/board', (req, res) => {
    let data = {
        questions: getQuestions()[currentRound],
        scores: getScores(),
        users: getUsers()
    }
    ejs.renderFile(__dirname + '/pages/board.ejs', data, (err, str) => {
        if (err) throw err

        res.send(str)
    })
})

app.get('/question', (req, res) => {
    let data = {
        question: getQuestions()[currentRound][currentCategory].filter(item => item.value == currentValue)[0].answer
    }

    ejs.renderFile(__dirname + '/pages/question.ejs', data, (err, str) => {
        if (err) throw err

        res.send(str)
    })
})

// QR Code Route
app.get('/qr', (req, res) => {
    const joinURL = `http://${ip}:${port}/buzzer`
    const qrImage = qr.imageSync(joinURL, {type: 'png', ec_level: 'H', size: 10, margin: 0})
    res.write(Buffer.from(qrImage))
    res.end()
})

// Buzzer Login Route
app.get('/buzzer', (req, res) => {
    res.sendFile(__dirname + '/pages/join.html')
})
// Join Route
app.post('/join', (req, res) => {
    let imageData = req.body.data
    let userID = addUser(imageData, req.connection.remoteAddress)
    res.send(200, JSON.stringify({id: userID}))
})

// Main Buzzer Route
app.get('/buzzer/:id', (req, res) => {
    let data = {
        id: req.params.id
    }
    ejs.renderFile(__dirname + '/pages/buzzer.ejs', data, (err, str) => {
        if (err) throw err

        res.send(str)
    })
})

// Controller Route
app.get('/controller', (req, res) => {
    let data = {
        users: getUsers(),
        scores: getScores(),
        questions: JSON.stringify(getQuestions()),
        id: '::1'
    }
    ejs.renderFile(__dirname + '/pages/controller.ejs', data, (err, str) => {
        if (err) throw err

        res.send(str)
    })
})

http.listen(port, () => {
    console.log(`Listening on http://${ip}:${port}`)
})

// Score Helper Functions
getScores = () => JSON.parse(fs.readFileSync(__dirname + '/data/scores.json', 'utf8'))

updateScores = async (name, change) => {
    await fs.readFile(__dirname + '/data/scores.json', 'utf8', (err, data) => {
        if (err) throw err

        let scores = JSON.parse(data)
        if (name in scores) {
            scores[name].score += parseInt(change)
            scores[name].online = true
        } else {
            scores[name] = {
                score: parseInt(change),
                online: true
            }
        }

        fs.writeFileSync(__dirname + '/data/scores.json', JSON.stringify(scores, null, 2), 'utf8')
        return true
    })
    return true
}

removeScore = async (userID) => {
    await fs.readFile(__dirname + '/data/scores.json', 'utf8', (err, data) => {
        if (err) throw err

        let scores = JSON.parse(data)
        scores[userID].online = false

        fs.writeFileSync(__dirname + '/data/scores.json', JSON.stringify(scores, null, 2), 'utf8')
        return true
    })
    return true
}

// Question Helper Functions
getQuestions = () => JSON.parse(fs.readFileSync(__dirname + '/data/questions.json', 'utf8'))

updateQuestionDisplay = async (round, category, value, newDisplayValue) => {
    await fs.readFile(__dirname + '/data/questions.json', 'utf8', (err, data) => {
        if (err) throw err

        let questions = JSON.parse(data)
        for (let question of questions[round][category]) {
           if (question.value == value) {
               question.display = newDisplayValue
           }
        }

        fs.writeFileSync(__dirname + '/data/questions.json', JSON.stringify(questions, null, 2), 'utf8')
        return true
    })
    return true
}

// User helper functions

getUser = (user) => {
    let users = JSON.parse(fs.readFileSync(__dirname + '/data/users.json', 'utf8'))
    return users[user]
}

getUsers = () => JSON.parse(fs.readFileSync(__dirname + '/data/users.json', 'utf8'))

addUser = (nameImage, clientIp) => {
    let users = JSON.parse(fs.readFileSync(__dirname + '/data/users.json', 'utf8'))
    let user = clientIp
    users[user] = nameImage

    fs.writeFileSync(__dirname + '/data/users.json', JSON.stringify(users), 'utf8')
    return user
}