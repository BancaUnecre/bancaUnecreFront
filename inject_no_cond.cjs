const fs = require('fs');
let code = fs.readFileSync('src/pages/clientes/ClienteForm.tsx', 'utf8');

const importOld = "import { ArrowLeft, Save, User, MapPin, Phone, Briefcase, Shield, FileText, Loader2, AlertCircle } from 'lucide-react';";
const importNew = "import { ArrowLeft, Save, User, MapPin, Phone, Briefcase, Shield, FileText, Loader2, AlertCircle, CreditCard } from 'lucide-react';";
code = code.replace(importOld, importNew);

const submitOld = `<button type="submit" disabled={saving} className="btn-success">`;
const buttonJSX = `
              <button
                type="button"
                onClick={() => navigate(\`/tarjetas/emitir?cliente=\${id}\`)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm mr-4"
              >
                <CreditCard size={18} />
                Emitir Tarjeta
              </button>
            <button type="submit" disabled={saving} className="btn-success">`;

code = code.replace(submitOld, buttonJSX);

fs.writeFileSync('src/pages/clientes/ClienteForm.tsx', code, 'utf8');
