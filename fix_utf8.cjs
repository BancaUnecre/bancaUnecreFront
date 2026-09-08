const fs = require('fs');
let code = fs.readFileSync('src/pages/tarjetas/EmitirTarjeta.tsx', 'utf8');

code = code.replace(/Emisi\ufffdn/g, "Emisión");
code = code.replace(/Autorizaci\ufffdn/g, "Autorización");
code = code.replace(/Se generar\ufffd un n\ufffdmero de 16 d\ufffdgitos y un token din\ufffdmico/g, "Se generará un número de 16 dígitos y un token dinámico");
code = code.replace(/Generar QR de Autorizaci\ufffdn/g, "Generar QR de Autorización");

fs.writeFileSync('src/pages/tarjetas/EmitirTarjeta.tsx', code, 'utf8');
