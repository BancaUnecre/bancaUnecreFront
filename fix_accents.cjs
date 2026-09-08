const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/CrǸdito/g, 'Crédito');
content = content.replace(/interǸs/g, 'interés');
content = content.replace(/Das/g, 'Días');
content = content.replace(/nǧmero/g, 'número');
content = content.replace(/TelǸfono/g, 'Teléfono');
content = content.replace(/DǸbito/g, 'Débito');
content = content.replace(/dgitos/g, 'dígitos');

fs.writeFileSync(file, content, 'utf8');
