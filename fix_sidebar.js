const fs = require('fs');
const file = './src/components/Layout/Sidebar.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/Tipo Identificacin/g, 'Tipo Identificación');
content = content.replace(/Abonos a Crditos/g, 'Abonos a Créditos');
content = content.replace(/Catǭlogos/g, 'Catálogos');
content = content.replace(/Configuraciǭn/g, 'Configuración'); // Just in case
content = content.replace(/CONFIGURACIǭN/g, 'CONFIGURACIÓN'); // Just in case
content = content.replace(/CONFIGURACI.*?N/g, 'CONFIGURACIÓN'); // If it's malformed
content = content.replace(/Cat.*?logos/g, 'Catálogos');
content = content.replace(/Tipo Identificaci.*?n/g, 'Tipo Identificación');
content = content.replace(/Abonos a Cr.*?ditos/g, 'Abonos a Créditos');

fs.writeFileSync(file, content, 'utf8');
