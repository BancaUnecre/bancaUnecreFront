const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

const regexType = /tipo_vinculo: string;/;
const newType = `modalidades: {
    CLIENTE_COMERCIAL: { selected: boolean; limite: number };
    EMPLEADO_NOMINA: { selected: boolean; limite: number };
    EMPLEADO_VIATICOS: { selected: boolean; limite: number };
  };`;
content = content.replace(regexType, newType);
// Remove limite_credito from VincularForm interface
content = content.replace(/limite_credito: number;\s*/, "");

const initialState = `{ cliente_id: 0, cuenta_id: 0, modalidades: {
        CLIENTE_COMERCIAL: { selected: true, limite: 0 },
        EMPLEADO_NOMINA: { selected: false, limite: 0 },
        EMPLEADO_VIATICOS: { selected: false, limite: 0 }
      } }`;

// Replace all setVincForm initializations
content = content.replace(/\{ cliente_id: 0, cuenta_id: 0, limite_credito: 0, tipo_vinculo: 'CLIENTE_COMERCIAL' \}/g, initialState);

// Update save logic
const saveLogic = `
      setSavingVinc(true);
      try {
        const mods = Object.entries(vincForm.modalidades).filter(([_, v]) => v.selected);
        if(mods.length === 0) throw new Error('Debe seleccionar al menos una modalidad.');
        
        await Promise.all(mods.map(([tipo, val]) => 
          empresaClientesService.create({
            empresa_id: empresaId,
            cliente_id: vincForm.cliente_id,
            cuenta_id: vincForm.cuenta_id,
            limite_credito: val.limite,
            tipo_vinculo: tipo,
            total_debito: 0,
            activo: true,
          })
        ));

        await loadVinculaciones();
        setVincularOpen(false);
        setSelectedCliente(null);
        setClienteSearch('');
`;

content = content.replace(/setSavingVinc\(true\);\s*try \{\s*await empresaClientesService\.create\(\{[\s\S]*?activo: true,\s*\}\);\s*await loadVinculaciones\(\);\s*setVincularOpen\(false\);\s*setSelectedCliente\(null\);\s*setClienteSearch\(''\);/, saveLogic);

// Update HTML
const newHTML = `
            <div className="space-y-4">
              <label className="label-field block mb-2">Modalidades de Vinculación y Límites de Crédito</label>
              
              <div className="p-3 border border-gray-200 rounded-lg flex items-center gap-4 bg-gray-50">
                <input type="checkbox" checked={vincForm.modalidades.CLIENTE_COMERCIAL.selected} onChange={e => setVincForm(f => ({ ...f, modalidades: { ...f.modalidades, CLIENTE_COMERCIAL: { ...f.modalidades.CLIENTE_COMERCIAL, selected: e.target.checked } } }))} className="w-4 h-4 accent-primary-600" />
                <div className="flex-1 text-sm font-medium text-gray-800">💳 Cliente Comercial (B2C)</div>
                {vincForm.modalidades.CLIENTE_COMERCIAL.selected && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">$</span>
                    <input type="number" min="0" value={vincForm.modalidades.CLIENTE_COMERCIAL.limite} onChange={e => setVincForm(f => ({ ...f, modalidades: { ...f.modalidades, CLIENTE_COMERCIAL: { ...f.modalidades.CLIENTE_COMERCIAL, limite: Number(e.target.value) } } }))} className="input-field py-1 w-24 text-right" />
                  </div>
                )}
              </div>

              <div className="p-3 border border-blue-200 rounded-lg flex items-center gap-4 bg-blue-50">
                <input type="checkbox" checked={vincForm.modalidades.EMPLEADO_NOMINA.selected} onChange={e => setVincForm(f => ({ ...f, modalidades: { ...f.modalidades, EMPLEADO_NOMINA: { ...f.modalidades.EMPLEADO_NOMINA, selected: e.target.checked } } }))} className="w-4 h-4 accent-blue-600" />
                <div className="flex-1 text-sm font-medium text-blue-900">💼 Crédito de Nómina (B2B)</div>
                {vincForm.modalidades.EMPLEADO_NOMINA.selected && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">$</span>
                    <input type="number" min="0" value={vincForm.modalidades.EMPLEADO_NOMINA.limite} onChange={e => setVincForm(f => ({ ...f, modalidades: { ...f.modalidades, EMPLEADO_NOMINA: { ...f.modalidades.EMPLEADO_NOMINA, limite: Number(e.target.value) } } }))} className="input-field py-1 w-24 border-blue-300 text-right" />
                  </div>
                )}
              </div>

              <div className="p-3 border border-amber-200 rounded-lg flex items-center gap-4 bg-amber-50">
                <input type="checkbox" checked={vincForm.modalidades.EMPLEADO_VIATICOS.selected} onChange={e => setVincForm(f => ({ ...f, modalidades: { ...f.modalidades, EMPLEADO_VIATICOS: { ...f.modalidades.EMPLEADO_VIATICOS, selected: e.target.checked } } }))} className="w-4 h-4 accent-amber-600" />
                <div className="flex-1 text-sm font-medium text-amber-900">🏢 Tarjeta Corporativa / Viáticos (B2B)</div>
                {vincForm.modalidades.EMPLEADO_VIATICOS.selected && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">$</span>
                    <input type="number" min="0" value={vincForm.modalidades.EMPLEADO_VIATICOS.limite} onChange={e => setVincForm(f => ({ ...f, modalidades: { ...f.modalidades, EMPLEADO_VIATICOS: { ...f.modalidades.EMPLEADO_VIATICOS, limite: Number(e.target.value) } } }))} className="input-field py-1 w-24 border-amber-300 text-right" />
                  </div>
                )}
              </div>
            </div>
`;

content = content.replace(
    /\<div\>\s*\<label className="label-field"\>Tipo de Relación[\s\S]*?placeholder="0\.00"\s*\/\>\s*\<\/div\>\s*\{vincErrors\.limite \&\& \<p className="text-red-500 text-xs mt-1"\>\{vincErrors\.limite\}\<\/p\>\}\s*\<\/div\>/,
    newHTML
);

fs.writeFileSync(file, content, 'utf8');
