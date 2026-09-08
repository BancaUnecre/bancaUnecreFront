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
              </select>
            </div>
`;

const lines = content.split('\n');
const out = [];
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('className="label-field">L') && lines[i].includes('Cr')) {
        if (!content.includes('Tipo de Vínculo')) {
            out.push(selectHTML);
        }
    }
    out.push(lines[i]);
}

fs.writeFileSync(file, out.join('\n'), 'utf8');
