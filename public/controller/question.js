let questionButton = document.querySelector('.question-button')
let roundButton = document.querySelector('.round-button')
let showQuestion = document.querySelector('.show-question')
let showAnswer = document.querySelector('.show-answer')

let nameImage = document.querySelector('.name > img')

let buzzerEnabled = document.querySelector('#buzzer-enabled')
let buzzerEnabledText = document.querySelector('span.buzzer-enabled')

let backgroundMusic = document.querySelector('#background-music')

buzzerEnabledText.addEventListener('click', e => {
    let audioElements = document.getElementsByTagName('audio').length
    buzzerEnabled.checked = !buzzerEnabled.checked
    if (buzzerEnabled.checked && audioElements == 1) {
        backgroundMusic.play()
    } else {
        backgroundMusic.pause()
        backgroundMusic.currentTime = 0
    }
})
buzzerEnabled.addEventListener('change', e => {
    let audioElements = document.getElementsByTagName('audio').length
    if (buzzerEnabled.checked && audioElements == 1) {
        backgroundMusic.play()
    } else {
        backgroundMusic.pause()
        backgroundMusic.currentTime = 0
    }
})

let removeQuestion = document.querySelector('#remove-question')

let buzzQueue = []
let name = ''

let socket = io()

questionButton.addEventListener('click', e => {
    let question = questions[roundDropdown.value][categoryDropdown.value].filter(question => question.value == valueDropdown.value)[0]
    showQuestion.innerHTML = question.answer
    showAnswer.innerHTML = question.question
    fetch(`/api/update-question/${roundDropdown.value}/${categoryDropdown.value}/question-${valueDropdown.value}/${!removeQuestion.checked}`)
    socket.emit('show question to server', `${roundDropdown.value}\\${categoryDropdown.value}\\${valueDropdown.value}`)

    buzzerEnabled.checked = false
    backgroundMusic.pause()
    backgroundMusic.currentTime = 0
})

roundButton.addEventListener('click', e => {
    socket.emit('show board to server', roundDropdown.value)
})

nameImage.addEventListener('click', e => {
    clearName()
    updateName()
})

updateName = () => {
    if (buzzQueue.length <= 0) {
        name = ''
    } else if (name.length === 0) {
        name = buzzQueue[0]
        nameImage.src = users[buzzQueue[0]]
        nameImage.parentNode.parentNode.dataset.id = buzzQueue[0]
        buzzQueue.splice(0, 1)
    }
}

clearName = () => {
    nameImage.src = ''
    nameImage.parentNode.parentNode.dataset.id = ''
    name = ''
}

socket.on('buzz to controller', person => {
    if (buzzQueue.indexOf(person) < 0 && name != person && buzzerEnabled.checked) {
        buzzQueue.push(person)
        updateName()
    }
})