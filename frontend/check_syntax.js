const parser = require('@babel/parser');
const fs = require('fs');

const fileList = fs.readFileSync('files_to_check.txt', 'utf8').split('\n').map(f => f.trim()).filter(f => f.length > 0);

fileList.forEach(f => {
  try {
    const code = fs.readFileSync(f, 'utf8');
    parser.parse(code, {
      sourceType: 'module',
      plugins: [
        'jsx', 
        'typescript', 
        'classProperties', 
        'objectRestSpread', 
        'exportDefaultFrom', 
        'exportNamespaceFrom',
        'decorators-legacy'
      ]
    });
    // console.log(f + ' is OK');
  } catch (e) {
    console.log(f + ' ERROR at ' + e.loc.line + ':' + e.loc.column + ' - ' + e.message);
  }
});
console.log('Done checking ' + fileList.length + ' files');
