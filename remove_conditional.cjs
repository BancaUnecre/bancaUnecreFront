const fs = require('fs');
let code = fs.readFileSync('src/pages/clientes/ClienteForm.tsx', 'utf8');

const regex = /\{\s*isEdit\s*&&\s*\(([\s\S]*?)\)\s*\}/;
const match = code.match(regex);
if (match) {
    code = code.replace(regex, match[1]); // Just output the button directly without the conditional
    fs.writeFileSync('src/pages/clientes/ClienteForm.tsx', code, 'utf8');
}
