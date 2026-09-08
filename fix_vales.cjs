const fs = require('fs');
const file = './src/pages/operaciones/GeneradorVales.tsx';
let content = fs.readFileSync(file, 'utf8');

const newFunctions = `
  const copyQRImageToClipboard = () => {
    const svg = document.getElementById('qr-code-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width + 40;
        canvas.height = img.height + 40;
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 20, 20);
          canvas.toBlob((blob) => {
            if (blob) {
              const item = new window.ClipboardItem({ 'image/png': blob });
              navigator.clipboard.write([item]).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }).catch(err => {
                alert('Error al copiar imagen: ' + err);
              });
            }
          }, 'image/png');
        }
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  };
`;

content = content.replace("const downloadQR = () => {", newFunctions + "\n  const downloadQR = () => {");

const newButtons = `
                <div className="flex gap-2 w-full mt-4">
                  <button onClick={shareWhatsApp} className="flex-1 py-2 flex justify-center items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors">
                    <MessageCircle size={16} /> WA
                  </button>
                  <button onClick={copyQRImageToClipboard} className="btn-secondary flex-1 py-2 flex justify-center items-center gap-2">
                    {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />} 
                    {copied ? 'Copiado' : 'QR al portapapeles'}
                  </button>
                </div>
                <div className="flex gap-2 w-full mt-2">
                  <button onClick={downloadQR} className="btn-secondary flex-1 py-2 flex justify-center items-center gap-2">
                    <Download size={16} /> Descargar Imagen
                  </button>
                  <button onClick={copyToClipboard} className="btn-secondary flex-1 py-2 flex justify-center items-center gap-2">
                    <Copy size={16} /> Copiar Token
                  </button>
                </div>
`;

const searchButtons = `<div className="flex gap-2 w-full mt-4">
                  <button onClick={shareWhatsApp} className="flex-1 py-2 flex justify-center items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors">
                    <MessageCircle size={16} /> Enviar por WA
                  </button>
                  <button onClick={copyToClipboard} className="btn-secondary flex-1 py-2 flex justify-center items-center gap-2">
                    {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />} 
                    {copied ? 'Copiado' : 'Copiar Token'}
                  </button>
                </div>`;

// Replace ignoring some whitespace
const regexBtn = /<div className="flex gap-2 w-full mt-4">[\s\S]*?Copiar Token'\}[\s\S]*?<\/button>[\s\S]*?<\/div>/;
content = content.replace(regexBtn, newButtons);

fs.writeFileSync(file, content, 'utf8');
