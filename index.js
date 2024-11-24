const express = require("express");
const path = require("path");
const app = express();
require("dotenv").config();

const PORT = process.env.PORT || 3001;

app.use(express.json());
const server = require("http").createServer(app);
const io = require("socket.io")(server);

module.exports.io = io;

// Importar configuración de sockets
require("./src/services/sockets");

// Servir archivos estáticos
const publicPath = path.resolve(__dirname, "public");
app.use(express.static(publicPath));

// Iniciar servidor
server.listen(PORT, (err) => {
  if (err) throw new Error(err);
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
