const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("ArrowLeft, Save, Building2, Users, Upload, X, Plus,", "ArrowLeft, Save, Building2, Users, Upload, X, Plus, Download,");

fs.writeFileSync(file, content, 'utf8');
