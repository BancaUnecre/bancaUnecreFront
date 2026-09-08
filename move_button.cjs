const fs = require('fs');
let code = fs.readFileSync('src/pages/clientes/ClienteForm.tsx', 'utf8');

// Move button to the bottom, next to 'Actualizar Cliente'
const buttonJSX = `
        {isEdit && isAdmin && (
          <button
            type="button"
            onClick={() => navigate(\`/tarjetas/emitir?cliente=\${id}\`)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <CreditCard size={18} />
            Emitir Tarjeta
          </button>
        )}
`;

// Remove from top
code = code.replace(buttonJSX.trim(), "");

// Add to bottom
const bottomOld = `<div className="flex items-center justify-between pt-6 border-t border-gray-100">`;
const bottomNew = `<div className="flex items-center justify-between pt-6 border-t border-gray-100">\n          ` + buttonJSX.trim();
code = code.replace(bottomOld, bottomNew);

// If the first replace failed for some reason, let's just make sure it's at the bottom
if (!code.includes(bottomNew)) {
    // try finding the submit button
    const submitOld = `<button type="submit" disabled={saving} className="btn-primary">`;
    const submitNew = buttonJSX.trim() + `\n          <button type="submit" disabled={saving} className="btn-primary">`;
    code = code.replace(submitOld, submitNew);
}

fs.writeFileSync('src/pages/clientes/ClienteForm.tsx', code, 'utf8');
