let scoreboard = document.querySelector('.scoreboard')
let scores = document.querySelectorAll('.score')

for (let score of scores) {
    score.children[0].addEventListener('click', e => {changeScore(e.target.parentNode, 100)})
    score.children[1].addEventListener('click', e => {changeScore(e.target.parentNode, -100)})
}

changeScore = (element, difference) => {
    let userID = element.dataset.id
    let scoreLabel = element.children[1]
    let newScore = parseInt(scoreLabel.innerText.substring(1)) + difference
    scoreLabel.innerText = `$${newScore}`
    fetch(`/api/change-score/${userID}/${difference}`)
}

let yesButton = document.querySelector('button.yes')
let noButton = document.querySelector('button.no')

yesButton.addEventListener('click', async e => {
    let questionValue = valueDropdown.value
    let userID = e.target.parentNode.parentNode.dataset.id
    await fetch(`/api/change-score/${userID}/${questionValue}`)
    for (let score of scores) {
        if (score.dataset.id == userID) {
            let scoreLabel = score.children[1]
            let newScore = parseInt(scoreLabel.innerText.substring(1)) + parseInt(questionValue)
            scoreLabel.innerText = `$${newScore}`
        }
    }
    clearName()
    updateName()
})

noButton.addEventListener('click', async e => {
    let questionValue = valueDropdown.value
    let userID = e.target.parentNode.parentNode.dataset.id
    await fetch(`/api/change-score/${userID}/-${questionValue}`)
    for (let score of scores) {
        if (score.dataset.id == userID) {
            let scoreLabel = score.children[1]
            let newScore = parseInt(scoreLabel.innerText.substring(1)) - parseInt(questionValue)
            scoreLabel.innerText = `$${newScore}`
        }
    }
    clearName()
    updateName()
})