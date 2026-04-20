const fs = require('fs');
const content = fs.readFileSync('public/js/app.js', 'utf8');
try {
  new Function(content);
} catch (e) {
  console.log('Function constructor parsing error:', e);
}
