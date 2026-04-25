const fs = require('fs');
const code = fs.readFileSync('js/canvas.js', 'utf8');
const lines = code.split('\n');

console.log(`Total lines: ${lines.length}`);
console.log(`File size: ${code.length} bytes`);
console.log('');

// Check for common syntax issues
lines.forEach((line, i) => {
  const trimmed = line.trim();
  
  // Skip empty lines and comments
  if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('*')) return;
  
  // Check paren balance per line (basic check)
  const opens = (trimmed.match(/\(/g) || []).length;
  const closes = (trimmed.match(/\)/g) || []).length;
  
  // Check bracket balance
  const bOpens = (trimmed.match(/\{/g) || []).length;
  const bCloses = (trimmed.match(/\}/g) || []).length;

  // Only flag significant mismatches on non-trivial lines
  if (trimmed.length > 10 && (Math.abs(opens - closes) > 2 || Math.abs(bOpens - bCloses) > 2)) {
    console.log(`Line ${i+1}: parens(${opens}/${closes}) braces(${bOpens}/${bCloses})`);
    console.log(`  ${trimmed.substring(0, 140)}`);
  }
});

// Also try to parse and catch the exact error
console.log('\n--- Parsing test ---');
try {
  // Write a temp file that wraps canvas code
  new Function(code);
  console.log('Parsed OK');
} catch(e) {
  console.log(`Parse error: ${e.message}`);
}
