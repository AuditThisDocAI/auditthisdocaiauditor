const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('src/**/*.{ts,tsx}');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  content = content.replace(/Dr\. Aria/g, 'FOR-AI');
  content = content.replace(/Dr\. Aria's/g, "FOR-AI's");
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});

let serverContent = fs.readFileSync('server.ts', 'utf8');
let originalServerContent = serverContent;
serverContent = serverContent.replace(/Dr\. Aria/g, 'FOR-AI');
serverContent = serverContent.replace(/Dr\. Aria's/g, "FOR-AI's");
if (serverContent !== originalServerContent) {
  fs.writeFileSync('server.ts', serverContent);
  console.log(`Updated server.ts`);
}
