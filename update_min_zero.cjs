const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace step="0.01" with min="0" step="0.01" for all rate and cashback inputs
content = content.replace(/type="number" step="0\.01"/g, 'type="number" min="0" step="0.01"');

fs.writeFileSync(file, content, 'utf8');
