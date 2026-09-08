const fs = require('fs');
let code = fs.readFileSync('src/pages/tarjetas/EmitirTarjeta.tsx', 'latin1');
code = code.replace(/Emisin/g, "Emisión");
code = code.replace(/Autorizacin/g, "Autorización");
code = code.replace(/Se generar un nmero de 16 dgitos y un token dinmico/g, "Se generará un número de 16 dígitos y un token dinámico");
code = code.replace(/Generar QR de Autorizacin/g, "Generar QR de Autorización");
fs.writeFileSync('src/pages/tarjetas/EmitirTarjeta.tsx', code, 'utf8');
