const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

console.log('Checking <style> tags...');
const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
let match;
let styleCount = 0;
while ((match = styleRegex.exec(html)) !== null) {
  styleCount++;
  const css = match[1];
  let open = (css.match(/\{/g) || []).length;
  let close = (css.match(/\}/g) || []).length;
  if (open !== close) {
    const linesBefore = html.substring(0, match.index).split('\n').length;
    console.log('Mismatch in <style> block #' + styleCount + ' starting at line ' + linesBefore + ': { = ' + open + ', } = ' + close);
  }
}
console.log('Checked ' + styleCount + ' styles.');

console.log('Checking <script> tags...');
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let scriptCount = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  scriptCount++;
  const js = match[1];
  const linesBefore = html.substring(0, match.index).split('\n').length;
  let cleanedJs = js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/('([^'\\]|\\.)*')|(\"([^\"\\]|\\.)*\")/g, '').replace(/`([^`\\]|\\.)*`/g, '');
  let open = (cleanedJs.match(/\{/g) || []).length;
  let close = (cleanedJs.match(/\}/g) || []).length;
  if (open !== close) {
    console.log('Mismatch in <script> block #' + scriptCount + ' starting at line ' + linesBefore + ': { = ' + open + ', } = ' + close);
  }
}
console.log('Checked ' + scriptCount + ' scripts.');
