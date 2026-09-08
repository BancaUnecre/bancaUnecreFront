const fs = require('fs');

const path = "c:/discos/proyectos/banco/bancaUnecreFront/src/pages/operaciones/GeneradorVales.tsx";
let content = fs.readFileSync(path, 'utf8');

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

content = content.replace("const [monto, setMonto] = useState<number | ''>('');", `const [monto, setMonto] = useState<number | ''>('');\n  const [fechaExpiracion, setFechaExpiracion] = useState('${tomorrowStr}');`);

content = content.replace(
`          empresa_id_destino: parseInt(empresaId),
          requiere_autorizacion: requiereAutorizacion`,
`          empresa_id_destino: parseInt(empresaId),
          requiere_autorizacion: requiereAutorizacion,
          fecha_expiracion: fechaExpiracion`
);

const inputJsx = `            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Caducidad
              </label>
              <input
                type="date"
                value={fechaExpiracion}
                onChange={(e) => setFechaExpiracion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="flex items-center`;

content = content.replace(`            </div>\n\n            <div>\n              <label className="flex items-center`, inputJsx);

fs.writeFileSync(path, content);
console.log("GeneradorVales.tsx patched successfully");
