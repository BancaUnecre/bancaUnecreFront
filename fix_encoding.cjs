const fs = require('fs');

let code = fs.readFileSync('src/pages/tarjetas/EmitirTarjeta.tsx', 'utf8');

const replacements = {
  "Emisin": "Emisión",
  "Autorizacin": "Autorización",
  "Se generar un nmero de 16 dgitos y un token dinmico.": "Se generará un número de 16 dígitos y un token dinámico.",
  "1. Seleccionar": "1. Seleccionar", // Just in case
  "Generar QR de Autorizacin": "Generar QR de Autorización"
};

for (const [bad, good] of Object.entries(replacements)) {
  code = code.split(bad).join(good);
}

// Just to be exhaustive, fix any remaining  using a regex if we know what they should be.
// "Emisin" -> "Emisión"
code = code.replace(/Emisin/g, "Emisión");
code = code.replace(/Autorizacin/g, "Autorización");
code = code.replace(/generar/g, "generará");
code = code.replace(/nmero/g, "número");
code = code.replace(/dgitos/g, "dígitos");
code = code.replace(/dinmico/g, "dinámico");

fs.writeFileSync('src/pages/tarjetas/EmitirTarjeta.tsx', code, 'utf8');
