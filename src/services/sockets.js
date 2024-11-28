const { io } = require("../../index");
const generateUniqueCode = require("../utils/generate_code");

const rooms = {};

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  // Desconexión del cliente
  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
    for (const room in rooms) {
      const userIndex = rooms[room].users.indexOf(socket.id);

      if (userIndex !== -1) {
        rooms[room].users.splice(userIndex, 1);
        rooms[room].userDetails = rooms[room].userDetails.filter(
          (user) => user.id !== socket.id
        );

        if (rooms[room].users.length === 0) {
          delete rooms[room];
        } else {
          // Notificar a los usuarios restantes que un miembro se desconectó
          io.to(room).emit("actualizar-usuarios", rooms[room].userDetails);
        }

        console.log(`Cliente ${socket.id} eliminado de la sala ${room}`);
        break;
      }
    }
  });

  // Crear una nueva sala
  socket.on("crear-sala", (payload) => {
    const roomCode = generateUniqueCode(); // Generar código único para la sala
    const { userDetail } = payload; // Detalles del usuario que crea la sala

    // Verificar si la sala no existe antes de crearla
    if (!rooms[roomCode]) {
      // Crear la sala con un único usuario (el dueño)
      rooms[roomCode] = {
        users: [socket.id], // El socket id del dueño se agrega a la lista de usuarios
        userDetails: [userDetail], // Los detalles del dueño se agregan en userDetails
        musicList: [], // Lista general de canciones
        musicQueue: [], // Cola de reproducción
        musicReserved: [],
      };

      socket.join(roomCode); // El usuario se une a la sala recién creada
      console.log(rooms[roomCode]);  
      // Emitir el código de la sala al cliente que la creó
      socket.emit("nombre-de-sala", roomCode);
      io.to(roomCode).emit(
        "actualizar-usuarios",
        rooms[roomCode].userDetails
      );
      console.log(`Sala ${roomCode} creada por ${socket.id}`);
    } else {
      // Si la sala ya existe (esto no debería pasar con tu lógica de generar código único)
      socket.emit("error", "Error al crear la sala: la sala ya existe.");
    }
  });

  // Unirse a una sala existente
  socket.on("unirse-a-sala", (payload) => {
    const { roomCode, userDetail } = payload;

    // Validamos si la sala existe
    if (rooms[roomCode]) {
      // Si la sala existe, unimos al socket a la sala
      socket.join(roomCode);

      // Verificamos si el usuario ya está en la lista de usuarios de la sala
      if (!rooms[roomCode].users.includes(socket.id)) {
        rooms[roomCode].users.push(socket.id);
        rooms[roomCode].userDetails.push(userDetail);
      } 

      // Emitimos los cambios a todos los usuarios en la sala
      io.to(roomCode).emit("actualizar-usuarios", rooms[roomCode].userDetails);
      socket.emit("actualizar-lista-musica", rooms[roomCode].musicList);
      socket.emit("actualizar-cola-musica", rooms[roomCode].musicQueue);
      socket.emit("actualizar-reserva-musica", rooms[roomCode].musicReserved);
      // Emitimos que la sala existe con un valor booleano true
      socket.emit("sala-existe", true);
    } else {
      // Si la sala no existe, enviamos un valor booleano false
      socket.emit("sala-existe", false);
    }
  });

  // Agregar música a la lista general (musicList)
  socket.on("agregar-musica", ({ roomCode, song }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].musicList.push(song);
      console.log(
        `Canción añadida a musicList en la sala ${roomCode}:`,
        song.name
      );

      // Notificar a todos los usuarios de la sala
      io.to(roomCode).emit(
        "actualizar-lista-musica",
        rooms[roomCode].musicList
      );
    }
  });

  socket.on("agregar-reserva", ({ roomCode, song }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].musicReserved.push(song);
      console.log(
        `Canción añadida a musicReserved en la sala ${roomCode}:`,
        song.name
      );

      // Notificar a todos los usuarios de la sala
      io.to(roomCode).emit(
        "actualizar-reserva-musica",
        rooms[roomCode].musicReserved
      );
    }
  });

  // Agregar música a la cola de reproducción (musicQueue)
  socket.on("agregar-a-cola", ({ roomCode, song }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].musicQueue.push(song);
      console.log(
        `Canción añadida a musicQueue en la sala ${roomCode}:`,
        song.name
      );

      // Notificar a todos los usuarios de la sala
      io.to(roomCode).emit(
        "actualizar-cola-musica",
        rooms[roomCode].musicQueue
      );
    }
  });

  // Eliminar la primera música de la cola de reproducción (musicQueue)
  socket.on("eliminar-primera-musica-queue", (roomCode) => {
    if (rooms[roomCode]) {
      if (rooms[roomCode].musicQueue.length > 0) {
        const removedSong = rooms[roomCode].musicQueue.shift();
        console.log(
          `Primera canción eliminada de musicQueue en la sala ${roomCode}:`,
          removedSong.name
        );

        // Notificar a todos los usuarios de la sala
        io.to(roomCode).emit(
          "actualizar-cola-musica",
          rooms[roomCode].musicQueue
        );
      } else {
        console.log(
          `No hay canciones en musicQueue en la sala ${roomCode} para eliminar`
        );
      }
    }
  });

  socket.on("eliminar-primera-musica-reserved", (roomCode) => {
    if (rooms[roomCode]) {
      if (rooms[roomCode].musicReserved.length > 0) {
        const removedSong = rooms[roomCode].musicReserved.shift();
        console.log(
          `Primera canción eliminada de musicReserved en la sala ${roomCode}:`,
          removedSong.name
        );

        // Notificar a todos los usuarios de la sala
        io.to(roomCode).emit(
          "actualizar-reserva-musica",
          rooms[roomCode].musicReserved
        );
      } else {
        console.log(
          `No hay canciones en musicReserved en la sala ${roomCode} para eliminar`
        );
      }
    }
  });

  socket.on("eliminar-primera-musica-list", (roomCode) => {
    if (rooms[roomCode]) {
      if (rooms[roomCode].musicList.length > 0) {
        const removedSong = rooms[roomCode].musicList.shift();
        console.log(
          `Primera canción eliminada de musicList en la sala ${roomCode}:`,
          removedSong.name
        );

        // Notificar a todos los usuarios de la sala
        io.to(roomCode).emit(
          "actualizar-lista-musica",
          rooms[roomCode].musicList
        );
      } else {
        console.log(
          `No hay canciones en musicQueue en la sala ${roomCode} para eliminar`
        );
      }
    }
  });

  // Eliminar música de la lista general (musicList)
  socket.on("eliminar-de-lista", ({ roomCode, song }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].musicList = rooms[roomCode].musicList.filter(
        (item) => item !== song
      );
      console.log(
        `Canción eliminada de musicList en la sala ${roomCode}:`,
        song.name
      );

      // Notificar a todos los usuarios de la   sala
      io.to(roomCode).emit(
        "actualizar-lista-musica",
        rooms[roomCode].musicList
      );
    }
  });

  socket.on("actualizar-votos", ({ roomCode, song }) => {
    if (rooms[roomCode]) {
      // Buscar la canción en la lista
      const songIndex = rooms[roomCode].musicQueue.findIndex(
        (item) => item.name === song.name
      );

      if (songIndex !== -1) {
        // Actualizar los votos de la canción
        rooms[roomCode].musicQueue[songIndex].votos = song.votos;

        // Emitir la lista actualizada de música a todos los usuarios de la sala
        io.to(roomCode).emit(
          "actualizar-cola-musica",
          rooms[roomCode].musicQueue
        );
      }
    }
  });
});
