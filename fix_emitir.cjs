const fs = require('fs');
let code = fs.readFileSync('src/pages/tarjetas/EmitirTarjeta.tsx', 'utf8');

// Fix the nested data issue
code = code.replace(
  "setSelectedCliente(res.data);",
  "setSelectedCliente(res.data.data ? res.data.data : res.data);"
);

// Hide step 1 if we already have a selected client
const step1Old = `<h2 className="text-lg font-semibold text-gray-800 mb-4">1. Seleccionar Cliente</h2>`;
const step1New = `{!selectedCliente && <><h2 className="text-lg font-semibold text-gray-800 mb-4">1. Seleccionar Cliente</h2>`;

const formEndOld = `</form>`;
const formEndNew = `</form></>}`;

if (code.includes(step1Old) && code.includes(formEndOld)) {
    code = code.replace(step1Old, step1New);
    code = code.replace(formEndOld, formEndNew);
}

fs.writeFileSync('src/pages/tarjetas/EmitirTarjeta.tsx', code, 'utf8');
