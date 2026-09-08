const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

const selectHTML = `
            <div>
              <label className="label-field">Tipo de Vínculo</label>
              <select
                value={vincForm.tipo_vinculo}
                onChange={e => setVincForm({ ...vincForm, tipo_vinculo: e.target.value })}
                className="input-field mb-4"
              >
                <option value="CLIENTE_COMERCIAL">Cliente de Tienda (Tarjeta Departamental)</option>
                <option value="EMPLEADO_NOMINA">Empleado (Crédito de Nómina)</option>
                <option value="EMPLEADO_VIATICOS">Empleado (Viáticos / Corporativa)</option>
              </select>
            </div>
`;

content = content.replace(
    /(\<div\>\s*\<label className="label-field"\>L[^\<]*mite de Cr[^\<]*dito\<\/label\>)/i,
    selectHTML + "\n            $1"
);

fs.writeFileSync(file, content, 'utf8');
