const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Backgrounds
  content = content.replace(/bg-slate-950/g, 'bg-brand-light');
  content = content.replace(/bg-slate-900(?!\/)/g, 'bg-brand-white');
  content = content.replace(/bg-slate-900\/(\d+)/g, 'bg-brand-white'); // removing opacity from old dark backgrounds
  content = content.replace(/bg-slate-800/g, 'bg-slate-100');
  
  // Texts
  content = content.replace(/text-slate-100/g, 'text-brand-dark');
  content = content.replace(/text-slate-200/g, 'text-brand-dark');
  content = content.replace(/text-slate-300/g, 'text-brand-dark');
  content = content.replace(/text-slate-400/g, 'text-brand-secondary');
  content = content.replace(/text-slate-500/g, 'text-brand-secondary');
  content = content.replace(/text-white(?!(\s|;))/g, 'text-brand-dark');
  
  // Borders
  content = content.replace(/border-slate-800/g, 'border-slate-200');
  content = content.replace(/border-slate-700/g, 'border-slate-300');
  
  // Accents & Colors
  content = content.replace(/orange-500/g, 'brand-accent');
  content = content.replace(/amber-500/g, 'brand-accent');
  content = content.replace(/amber-600/g, 'brand-accent');
  content = content.replace(/blue-500/g, 'brand-primary');
  content = content.replace(/emerald-500/g, 'green-600');
  content = content.replace(/rose-500/g, 'red-600');
  
  // Gradients - remove dark gradients and replace with clean solid colors or brand subtle gradients
  content = content.replace(/bg-gradient-to-[a-z]+\s+from-slate-[0-9]+\s+to-slate-[0-9]+/g, 'bg-brand-white');
  content = content.replace(/bg-gradient-to-[a-z]+\s+from-slate-[0-9]+\/?[0-9]*\s+to-slate-[0-9]+\/?[0-9]*/g, 'bg-brand-white');
  content = content.replace(/bg-gradient-to-[a-z]+\s+from-slate-[0-9]+\/?[0-9]*\s+via-slate-[0-9]+\/?[0-9]*\s+to-slate-[0-9]+\/?[0-9]*/g, 'bg-brand-white');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
  }
}

walkDir('./client/src', processFile);
