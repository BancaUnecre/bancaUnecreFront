const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("Trash2, Link2, CheckCircle2, XCircle, Search, Loader2, AlertCircle,", "Trash2, Link2, CheckCircle2, XCircle, Search, Loader2, AlertCircle, Download,");

fs.writeFileSync(file, content, 'utf8');
