let socket = io()

socket.on('show question to board', msg => {
    location.assign('/question')
})

socket.on('show board to board', msg => {
    location.reload()
})