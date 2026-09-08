const fs = require('fs');
let code = fs.readFileSync('src/pages/tarjetas/EmitirTarjeta.tsx', 'utf8');
code = code.replace(/Emisi.n de Tarjeta/g, "Emisión de Tarjeta");
code = code.replace(/\(Autorizaci.n Dual\)/g, "(Autorización Dual)");
code = code.replace(/2\. Confirmar Emisi.n/g, "2. Confirmar Emisión");
code = code.replace(/Se generar. un n.mero de 16 d.gitos y un token din.mico/g, "Se generará un número de 16 dígitos y un token dinámico");
code = code.replace(/Generar QR de Autorizaci.n/g, "Generar QR de Autorización");
fs.writeFileSync('src/pages/tarjetas/EmitirTarjeta.tsx', code, 'utf8');
