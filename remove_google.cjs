const fs = require('fs');
let code = fs.readFileSync('src/components/Auth.tsx', 'utf8');

const regex = /<button[\s\S]*?handleGoogleAuth[\s\S]*?<\/button>\s*<div className="relative my-5">[\s\S]*?<\/div>\s*<\/div>/g;
code = code.replace(regex, '');

fs.writeFileSync('src/components/Auth.tsx', code);
