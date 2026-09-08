const fs = require('fs');
const file = 'C:/Users/gas29/.gemini/antigravity/brain/449e7eab-e802-4afe-9186-eb902230858d/task.md';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('- [ ] Modificar modelo Empresas.ts', '- [x] Modificar modelo Empresas.ts');
content = content.replace('- [ ] Modificar EmpresaDetalle.tsx (UI para Cashback)', '- [x] Modificar EmpresaDetalle.tsx (UI para Cashback)');

fs.writeFileSync(file, content, 'utf8');
