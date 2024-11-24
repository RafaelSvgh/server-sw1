const { io } = require("../../index");
const generateUniqueCode = require("../utils/generate_code");

const rooms = {};

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  // Desconexión del cliente
  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
    for (const room in rooms) {
      // Verificar si el socket está en alguna sala
      const userIndex = rooms[room].users.indexOf(socket.id);

      if (userIndex !== -1) {
        // Eliminar el socket ID de la lista de users
        rooms[room].users.splice(userIndex, 1);

        // Eliminar también los detalles del usuario de la lista userDetails
        rooms[room].userDetails = rooms[room].userDetails.filter(
          (user) => user.id !== socket.id
        );

        // Eliminar la sala si no hay más usuarios
        if (rooms[room].users.length === 0) {
          delete rooms[room];
        }
        console.log(`Cliente ${socket.id} eliminado de la sala ${room}`);
      }
    }
  });

  // Crear una nueva sala
  socket.on("crear-sala", (payload) => {
    const roomCode = generateUniqueCode();
    const { musicList, userDetails } = payload;
    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        users: [socket.id], // Solo el ID del socket en la lista users
        userDetails: userDetails || [], // Lista de detalles de los usuarios
        musicList: musicList || [],
      };
      socket.join(roomCode);
      socket.emit('nombre-de-sala', roomCode);
      console.log(`Sala ${roomCode} creada por ${socket.id}`);
      console.log(rooms);
    } else {
      console.log(`Sala ${roomCode} ya existe`);
    }
  });

  // Reconectar a una sala
  socket.on("reconectar-a-sala", (roomCode) => {
    if (rooms[roomCode]) {
      socket.join(roomCode);
      if (!rooms[roomCode].users.includes(socket.id)) {
        rooms[roomCode].users.push(socket.id);
      }
      console.log(`Usuario ${socket.id} reconectado a la sala ${roomCode}`);
      // Enviar la lista de música y usuarios actuales
      socket.emit("actualizar-lista-musica", rooms[roomCode].musicList);
      socket.emit("actualizar-usuarios", rooms[roomCode].userDetails);
    } else {
      console.log(`Sala ${roomCode} no encontrada para reconectar`);
    }
  });

  // Unirse a una sala existente
  socket.on("unirse-a-sala", (payload) => {
    const { roomCode, userDetail } = payload; // userDetail contiene los detalles del usuario
    if (rooms[roomCode]) {
      socket.join(roomCode);
      if (!rooms[roomCode].users.includes(socket.id)) {
        rooms[roomCode].users.push(socket.id);
        rooms[roomCode].userDetails.push(userDetail); // Añadir detalles del usuario
      }
      console.log(`Usuario ${socket.id} se unió a la sala ${roomCode}`);
      // Enviar la lista de música y usuarios actuales
      socket.emit("actualizar-lista-musica", rooms[roomCode].musicList);
      socket.emit("actualizar-usuarios", rooms[roomCode].userDetails);
    } else {
      console.log(`Sala ${roomCode} no encontrada`);
    }
  });

  // Agregar música a la lista de la sala
  socket.on("agregar-musica", ({ roomCode, song }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].musicList.push(song);
      console.log(`Canción añadida a la sala ${roomCode}:`, song);
      // Notificar a todos los usuarios de la sala la lista actualizada
      io.to(roomCode).emit(
        "actualizar-lista-musica",
        rooms[roomCode].musicList
      );
    } else {
      console.log(`Sala ${roomCode} no encontrada para agregar música`);
    }
  });

  // Eliminar música de la lista de la sala
  socket.on("eliminar-musica", ({ roomCode, song }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].musicList = rooms[roomCode].musicList.filter(
        (item) => item !== song
      );
      console.log(`Canción eliminada de la sala ${roomCode}:`, song);
      // Notificar a todos los usuarios de la sala la lista actualizada
      io.to(roomCode).emit(
        "actualizar-lista-musica",
        rooms[roomCode].musicList
      );
    } else {
      console.log(`Sala ${roomCode} no encontrada para eliminar música`);
    }
  });
});
