const fs = require('fs');
let code = fs.readFileSync('src/pages/clientes/ClienteForm.tsx', 'utf8');

// Add CreditCard import
code = code.replace("ArrowLeft, Save, User, MapPin, Phone, Briefcase, Shield, FileText, Loader2, AlertCircle", "ArrowLeft, Save, User, MapPin, Phone, Briefcase, Shield, FileText, Loader2, AlertCircle, CreditCard");

// Add button
const headerOld = `<div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate('/clientes')} className="btn-secondary">
          <ArrowLeft size={16} />Volver
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</h1>
          <p className="text-gray-500 text-sm">Complete todos los campos requeridos</p>
        </div>
      </div>`;

const headerNew = `<div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/clientes')} className="btn-secondary">
            <ArrowLeft size={16} />Volver
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</h1>
            <p className="text-gray-500 text-sm">Complete todos los campos requeridos</p>
          </div>
        </div>
        {isEdit && (
          <button
            type="button"
            onClick={() => navigate(\`/tarjetas/emitir?cliente=\${id}\`)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <CreditCard size={18} />
            Emitir Tarjeta
          </button>
        )}
      </div>`;

code = code.replace(headerOld, headerNew);
fs.writeFileSync('src/pages/clientes/ClienteForm.tsx', code, 'utf8');
