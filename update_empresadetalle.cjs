const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update Tab type
content = content.replace(
  "type Tab = 'datos' | 'clientes';",
  "type Tab = 'datos' | 'clientes' | 'creditos';"
);

// 2. Add Tab button
content = content.replace(
  /<button\s+onClick=\{\(\) => setActiveTab\('clientes'\)\}.*?>[\s\S]*?Clientes[\s\S]*?<\/button>/m,
  `$&
          <button
            onClick={() => setActiveTab('creditos')}
            className={\`pb-4 px-2 border-b-2 font-medium text-sm transition-colors \${
              activeTab === 'creditos'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }\`}
          >
            <Building2 size={18} className="inline mr-2" />
            Créditos y Tasas
          </button>`
);

// 3. Add Tab Content
const creditosTabContent = `
        {activeTab === 'creditos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-medium text-gray-900">Configuración de Plazos y Tasas</h3>
              <p className="text-sm text-gray-500">Define los plazos habilitados y la tasa de interés aplicable para esta empresa.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 max-w-4xl">
              {[
                { key: '15', label: '15 Días' },
                { key: '30', label: '30 Días' },
                { key: '60', label: '60 Días' },
                { key: '90', label: '90 Días' },
                { key: 'custom', label: 'Días Personalizados' }
              ].map(plazo => (
                <div key={plazo.key} className="flex items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex-1">
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" className="sr-only" {...register(\`permitir_credito_\${plazo.key}\` as any)} />
                        <div className={\`block w-14 h-8 rounded-full transition-colors \${watch(\`permitir_credito_\${plazo.key}\` as any) ? 'bg-primary-500' : 'bg-gray-300'}\`}></div>
                        <div className={\`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform \${watch(\`permitir_credito_\${plazo.key}\` as any) ? 'transform translate-x-6' : ''}\`}></div>
                      </div>
                      <div className="ml-3 text-gray-900 font-medium">
                        Permitir Crédito a {plazo.label}
                      </div>
                    </label>
                  </div>
                  
                  {watch(\`permitir_credito_\${plazo.key}\` as any) && (
                    <div className="w-1/3 flex items-center gap-3">
                      <span className="text-sm text-gray-500 font-medium">Tasa de interés:</span>
                      <div className="relative flex-1">
                        <input 
                          type="number" 
                          step="0.01" 
                          {...register(\`tasa_\${plazo.key}\` as any)} 
                          className="input-field pr-8 text-right font-semibold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
`;

content = content.replace(
  /\{activeTab === 'clientes' && \([\s\S]*?\}\)[\s\S]*?<\/form>/m,
  `$&\n${creditosTabContent}`
);

fs.writeFileSync(file, content, 'utf8');
