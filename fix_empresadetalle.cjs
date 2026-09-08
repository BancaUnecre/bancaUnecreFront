const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

// The earlier replace put it after </form>. We want it inside the form, before </form>.
content = content.replace(
  /<\/form>\s*\{activeTab === 'creditos'/m,
  `{activeTab === 'creditos'`
);

// We should also add </form> at the end of the replaced block where it should be.
content = content.replace(
  /(\{\s*activeTab === 'creditos'[\s\S]*?\)\s*\})\s*<\/div>/m,
  `$1\n        </form>\n      </div>`
);

fs.writeFileSync(file, content, 'utf8');
