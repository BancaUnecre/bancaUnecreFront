const fs = require('fs');
let code = fs.readFileSync('src/pages/clientes/ClienteForm.tsx', 'utf8');

const buttonJSX = `
              <button
                type="button"
                onClick={() => window.location.href = \`/tarjetas/emitir?cliente=\${id}\`}
                style={{ backgroundColor: 'red', color: 'white', padding: '20px', fontSize: '24px', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}
              >
                EMITIR TARJETA (AQUI ESTOY!!)
              </button>
`;

code = code.replace("            {isEdit && isAdmin && (", buttonJSX + "            {isEdit && isAdmin && (");

fs.writeFileSync('src/pages/clientes/ClienteForm.tsx', code, 'utf8');
