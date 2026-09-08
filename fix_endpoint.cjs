const fs = require('fs');
let code = fs.readFileSync('src/pages/tarjetas/EmitirTarjeta.tsx', 'utf8');

// Fix the corrupted API endpoint route
code = code.replace(/api\.post\('\/tarjetas\/generar[^']*'/, "api.post('/tarjetas/generar'");

fs.writeFileSync('src/pages/tarjetas/EmitirTarjeta.tsx', code, 'utf8');
