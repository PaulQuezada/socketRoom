import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
const app = express();
const http = require('http').createServer(app);


//Conexion DB Local
/* const uri = 'mongodb://localhost:27017/myapp'; */
//hola
//Conexion DB nubr

// Middleware
app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
/* app.get('/', (req, res) => {
  res.send('Hello World!');
}); */




// Middleware para Vue.js router modo history
const history = require('connect-history-api-fallback');
app.use(history());
app.use(express.static(path.join(__dirname, 'public')));
const io = require('socket.io')(http, {
  allowEIO3: true,
  cors: {
    origin: true,
    credentials: true,
  },
});

var customIds = {};
io.on('connection', (socket) => {
  let room = null;
  // Me devuelve todos los usuarios en una room
  function getUsersInRoom(roomId) {
    const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
    const usersInRoom = [];
  
    if (socketsInRoom) {
      for (const socketId of socketsInRoom) {
        const customId = customIds[socketId];
        if (customId) {
          usersInRoom.push(customId);
        }
      }
    }
  
    return usersInRoom;
  }

  socket.on('set id', (id) => {
    console.log('User : ', socket.id, ' set id: ', id);
    customIds[socket.id] = id;
  });

  socket.on('join room', (roomId) => {
    console.log('User : ', socket.id, ' join room: ', roomId);
    socket.join(roomId);
    room = roomId;

    const usersInRoom = getUsersInRoom(roomId);
    io.to(roomId).emit('usuariosActualizado', usersInRoom);
  });
  socket.on('enviarCoordenadas',(roomId,coordenadas)=>{
    console.log("Enviado coordenadas: "+coordenadas +" a la room: "+roomId)
    io.to(roomId).emit('recibirCoordenadas', coordenadas);
  })
  
  socket.on('iniciarViaje',(roomId)=>{
    io.to(roomId).emit('RecibirInicio');
  })


  socket.on('chat:enviar', (roomId, msg) => {
    const customId = customIds[socket.id];
    console.log('User : ', customId, ' send message: ', msg, ' to room: ', roomId);
    io.to(roomId).emit('chat:recibir', msg);
  });


  socket.on('obtener usuarios sala', (roomId, callback) => {
    const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
    const usersInRoom = [];
  
    if (socketsInRoom) {
      for (const socketId of socketsInRoom) {
        const customId = customIds[socketId];
        if (customId) {
          usersInRoom.push(customId);
        }
      }
    }
  
    callback(usersInRoom);
  });
  
  socket.on('disconnect', () => {
    if (room !== null) {
      socket.leave(room);
      console.log('User Disconnect: ', socket.id, ' room: ', room);
  
      // Notifica a todos los usuarios en la sala que alguien se ha desconectado
      const usersInRoom = getUsersInRoom(room);
      io.to(room).emit('usuariosActualizado', usersInRoom);
  
      room = null;
    }
    delete customIds[socket.id];
  });
});
//Puerto de socket
// Cerramos por completo el servidor para desconectar a los usuarios q esten dentro

var portsocket = process.env.PORT || 5050;

http.listen(portsocket, () => {
  console.log('listening on :', portsocket);
});
