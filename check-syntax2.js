const fs = require('fs');
const code = fs.readFileSync('js/canvas.js', 'utf8');

// Binary search for the syntax error location
let lo = 0, hi = code.length;
let errorPos = -1;

while (lo < hi) {
  const mid = Math.floor((lo + hi + 1) / 2);
  const truncated = code.substring(0, mid);
  
  // Pad with something to close any open expressions
  try {
    new Function(truncated);
    lo = mid;  // This part parsed OK, error is after
  } catch(e) {
    hi = mid;  // Error is in this part
    errorPos = mid;
  }
}

console.log(`Error is around position: ${errorPos}`);
const start = Math.max(0, errorPos - 100);
const end = Math.min(code.length, errorPos + 50);
console.log('\nContext:');
console.log(code.substring(start, end));
console.log(' '.repeat(errorPos - start) + '^');

// Show line number
const lineNum = code.substring(0, errorPos).split('\n').length;
console.log(`\nApproximate line: ${lineNum}`);
