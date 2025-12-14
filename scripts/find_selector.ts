
import fs from 'fs';

const html = fs.readFileSync('debug_html.html', 'utf-8');
const searchString = 'Invetir orden';
const index = html.indexOf(searchString);

if (index !== -1) {
  const start = Math.max(0, index - 500);
  const end = Math.min(html.length, index + 500);
  console.log('Context around "Invetir orden":');
  console.log(html.substring(start, end));
} else {
  console.log('String not found');
  // Try finding "Ver Todo"
  const index2 = html.indexOf('Ver Todo');
  if (index2 !== -1) {
      const start = Math.max(0, index2 - 500);
      const end = Math.min(html.length, index2 + 500);
      console.log('Context around "Ver Todo":');
      console.log(html.substring(start, end));
  } else {
      console.log('Neither string found');
  }
}
