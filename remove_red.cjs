const fs = require('fs');
let code = fs.readFileSync('src/pages/clientes/ClienteForm.tsx', 'utf8');

// Remove red button
const redButtonRegex = /<button[\s\S]*?EMITIR TARJETA \(AQUI ESTOY!!\)[\s\S]*?<\/button>/;
code = code.replace(redButtonRegex, "");

// Remove the isEdit && isAdmin condition from the blue button
code = code.replace("{isEdit && isAdmin && (", "");
code = code.replace("Emitir Tarjeta\n              </button>\n            )}", "Emitir Tarjeta\n              </button>");

fs.writeFileSync('src/pages/clientes/ClienteForm.tsx', code, 'utf8');
