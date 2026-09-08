const fs = require('fs');
let code = fs.readFileSync('src/pages/tarjetas/EmitirTarjeta.tsx', 'utf8');

// Normalize multiple weird bytes back to standard characters
// Just replace the whole lines!

code = code.replace(/<h1.*?>[\s\S]*?<\/h1>/g, `<h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">\n            <CreditCard className="text-indigo-600" />\n            Emisi?n de Tarjeta (Autorizaci?n Dual)\n          </h1>`);

code = code.replace(/<h2.*?>2\. Confirmar.*?<\/h2>/g, `<h2 className="text-lg font-semibold text-gray-800 mb-4">2. Confirmar Emisi?n</h2>`);

code = code.replace(/<div className="text-indigo-600 text-sm mt-1">[\s\S]*?<\/div>/g, `<div className="text-indigo-600 text-sm mt-1">\n                      Se generar? un n?mero de 16 d?gitos y un token din?mico.\n                    </div>`);

code = code.replace(/<button[\s\S]*?Generar QR de.*?<\/button>/g, `<button\n                      onClick={handleEmitir}\n                      disabled={generating}\n                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"\n                    >\n                      {generating ? <Loader2 className="animate-spin" size={20} /> : <QrCode size={20} />}\n                      Generar QR de Autorizaci?n\n                    </button>`);

fs.writeFileSync('src/pages/tarjetas/EmitirTarjeta.tsx', code, 'utf8');
