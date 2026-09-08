const fs = require('fs');
let code = fs.readFileSync('src/components/Layout/Sidebar.tsx', 'utf8');

if (!code.includes('useAuth')) {
    code = code.replace("import { NavLink, useLocation } from 'react-router-dom';", "import { NavLink, useLocation } from 'react-router-dom';\nimport { useAuth } from '../../context/AuthContext';");
}

if (!code.includes('const { user } = useAuth();')) {
    code = code.replace("const location = useLocation();", "const { user } = useAuth();\n  const location = useLocation();");
}

if (!code.includes('const isAdmin =')) {
    code = code.replace("const navLinkClass", "const isAdmin = user?.rol === 'ADMINISTRADOR' || user?.rol === 'ADMIN' || user?.rol === 'GERENTE';\n\n  const navLinkClass");
}

// Find the start of the configuration block
const configIndex = code.indexOf('{/* Separator */}\n          <div className="pt-3 pb-1">\n            <p className="text-primary-500 text-xs font-semibold uppercase tracking-widest px-3">Configuraci');

if (configIndex !== -1 && !code.includes('{isAdmin && (')) {
    const beforeConfig = code.substring(0, configIndex);
    let afterConfig = code.substring(configIndex);
    
    // Find the end of the sidebar items before the footer
    const footerIndex = afterConfig.indexOf('<div className="p-3 border-t border-primary-800">');
    
    if (footerIndex !== -1) {
        const adminSection = afterConfig.substring(0, footerIndex);
        const footer = afterConfig.substring(footerIndex);
        
        const newAdminSection = `{isAdmin && (\n            <>\n              ` + adminSection.replace(/\n/g, '\n              ') + `\n            </>\n          )}\n\n          `;
        code = beforeConfig + newAdminSection + footer;
    }
}

fs.writeFileSync('src/components/Layout/Sidebar.tsx', code, 'utf8');
