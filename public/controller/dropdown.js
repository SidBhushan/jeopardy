let roundDropdown = document.querySelector('body > div.wrapper > div.question > div:nth-child(2) > select')
let categoryDropdown = document.querySelector('body > div.wrapper > div.question > div:nth-child(4) > select')
let valueDropdown = document.querySelector('body > div.wrapper > div.question > div:nth-child(6) > select')

roundDropdown.addEventListener('change', e => {
    updateCategories()
})

categoryDropdown.addEventListener('change', e => {
    updateValues()
})

updateCategories = () => {
    let categories = Object.keys(questions[roundDropdown.value])
    categoryDropdown.innerHTML = ''
    for (let category of categories) {
        let optionElement = document.createElement('option')
        let optionText = document.createTextNode(category)
        optionElement.value = category
        optionElement.appendChild(optionText)
        categoryDropdown.appendChild(optionElement)
    }
}

updateValues = () => {
    let values = questions[roundDropdown.value][categoryDropdown.value].map(obj => obj.value)
    valueDropdown.innerHTML = ''
    for (let value of values) {
        let optionElement = document.createElement('option')
        let optionText = document.createTextNode(value)
        optionElement.value = value
        optionElement.appendChild(optionText)
        valueDropdown.appendChild(optionElement)
    }
}

updateCategories()
updateValues()