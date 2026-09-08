const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update VincularForm interface
content = content.replace(
  "limite_credito: number;\n}",
  "limite_credito: number;\n  tipo_vinculo: string;\n}"
);

// Update initial state
content = content.replace(/\{ cliente_id: 0, cuenta_id: 0, limite_credito: 0 \}/g, "{ cliente_id: 0, cuenta_id: 0, limite_credito: 0, tipo_vinculo: 'CLIENTE_COMERCIAL' }");

// Include tipo_vinculo in create payload
content = content.replace(
  "limite_credito: vincForm.limite_credito,\n          total_debito: 0,",
  "limite_credito: vincForm.limite_credito,\n          tipo_vinculo: vincForm.tipo_vinculo,\n          total_debito: 0,"
);

// Add Tipo Vinculo column to DataTable
const newCol = `
      {
        key: 'tipo_vinculo',
        header: 'Tipo de Vínculo',
        render: r => (
          <span className={\`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium \${r.tipo_vinculo === 'EMPLEADO_NOMINA' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}\`}>
            {r.tipo_vinculo === 'EMPLEADO_NOMINA' ? 'Empleado (Nómina)' : 'Cliente (Tienda)'}
          </span>
        )
      },
`;
content = content.replace(
  /const vincColumns: Column<EmpresaCliente>\[\] = \[\s*\{/m,
  "const vincColumns: Column<EmpresaCliente>[] = [\n" + newCol + "      {"
);

// Add the selector to the Modal
const selectHTML = `
              <div className="mt-4">
                <label className="label-field">Tipo de Vínculo</label>
                <select
                  value={vincForm.tipo_vinculo}
                  onChange={e => setVincForm({ ...vincForm, tipo_vinculo: e.target.value })}
                  className="input-field"
                >
                  <option value="CLIENTE_COMERCIAL">Cliente de Tienda (Tarjeta Departamental)</option>
                  <option value="EMPLEADO_NOMINA">Empleado (Crédito de Nómina)</option>
                </select>
              </div>
`;

content = content.replace(
  /(\<label className="label-field"\>Límite de Crédito Permitido\<\/label\>[\s\S]*?\<\/div\>)/m,
  selectHTML + "\n              $1"
);

fs.writeFileSync(file, content, 'utf8');
