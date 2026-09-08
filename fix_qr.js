const fs = require('fs');
const file = './src/pages/operaciones/GeneradorVales.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const text = Hola[^;]+;/g, "const text = `Hola, te comparto mi vale de pago.\\n*Token / Código:* ${qrCodeData}\\nPresenta este código o el token en la terminal para realizar el cobro.`;");

fs.writeFileSync(file, content, 'utf8');
console.log("Fixed backticks and variable interpolation.");
