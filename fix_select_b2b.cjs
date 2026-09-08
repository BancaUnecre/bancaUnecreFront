const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

const selectRegex = /\<div\>\s*\<label className="label-field"\>Tipo de Vínculo[\s\S]*?\<\/select\>\s*\<\/div\>/g;
const selectRegexCorrupted = /\<div\>\s*\<label className="label-field"\>Tipo de V[^\<]*nculo[\s\S]*?\<\/select\>\s*\<\/div\>/g;

const newHTML = `
            <div>
              <label className="label-field">Tipo de Relación (Producto)</label>
              <select
                value={vincForm.tipo_vinculo}
                onChange={e => setVincForm({ ...vincForm, tipo_vinculo: e.target.value })}
                className="input-field mb-4 bg-blue-50 border-blue-200"
              >
                <option value="CLIENTE_COMERCIAL">💳 B2C: Tarjeta Departamental (Cliente asume deuda)</option>
                <option value="EMPLEADO_NOMINA">💼 B2B: Crédito de Nómina (Descuento vía Patrón)</option>
                <option value="EMPLEADO_VIATICOS">🏢 B2B: Tarjeta Corporativa (Viáticos de Empresa)</option>
              </select>
            </div>
`;

if (content.match(selectRegexCorrupted)) {
  content = content.replace(selectRegexCorrupted, newHTML);
} else {
  content = content.replace(
      /(\<div\>\s*\<label className="label-field"\>L[^\<]*mite de Cr[^\<]*dito\<\/label\>)/i,
      newHTML + "\n            $1"
  );
}

fs.writeFileSync(file, content, 'utf8');
