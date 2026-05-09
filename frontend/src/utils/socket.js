import { io } from 'socket.io-client'

const LOCAL_IPS = ['localhost', '127.0.0.1', '0.0.0.0']
const IS_LOCAL = LOCAL_IPS.includes(window.location.hostname)
const SOCKET_URL = IS_LOCAL ? 'http://localhost:4000' : window.location.origin

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true
})

export const joinRoom = (roomId) => {
  if (!socket.connected) socket.connect()
  socket.emit('join_consultation', roomId)
}

export const sendMessage = (roomId, message, sender) => {
  socket.emit('send_message', {
    roomId,
    message,
    sender,
    timestamp: new Date().toISOString()
  })
}
