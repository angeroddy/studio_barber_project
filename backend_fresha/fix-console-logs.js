const fs = require('fs');
const path = require('path');

const files = [
  'src/controllers/auth.controller.ts',
  'src/controllers/clientAuth.controller.ts',
  'src/controllers/salon.controller.ts',
  'src/controllers/booking.controller.ts',
  'src/controllers/clientBooking.controller.ts',
  'src/controllers/client.controller.ts',
  'src/controllers/schedule.controller.ts',
  'src/controllers/closedDay.controller.ts',
];

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  console.log(`Processing ${filePath}...`);

  let content = fs.readFileSync(fullPath, 'utf8');

  // Ajouter l'import du logger si absent
  if (!content.includes("import logger from '../config/logger'")) {
    // Trouver la dernière ligne d'import
    const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
    if (importLines.length > 0) {
      const lastImport = importLines[importLines.length - 1];
      content = content.replace(lastImport, lastImport + "\nimport logger from '../config/logger'");
    }
  }

  // Remplacer console.error par logger.error
  content = content.replace(/console\.error\((.*?),\s*error\)/g, (match, p1) => {
    return `logger.error(${p1}, { error: error.message, stack: error.stack })`;
  });

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✓ ${filePath} fixed`);
});

console.log('\n✅ All files processed!');
