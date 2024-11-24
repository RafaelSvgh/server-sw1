const crypto = require("crypto");

// Almacenar los códigos generados previamente
const generatedCodes = new Set();

// Método para generar un código único
function generateUniqueCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  while (true) {
    // Generar un código de 4 caracteres
    let code = Array.from({ length: 4 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");

    // Verificar si el código es único
    if (!generatedCodes.has(code)) {
      generatedCodes.add(code);
      return code;
    }
  }
}

module.exports = generateUniqueCode;