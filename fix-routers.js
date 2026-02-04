const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/routes/v1/api-keys.routes.ts',
  'src/routes/v1/docs.routes.ts',
  'src/routes/v1/health.routes.ts',
  'src/routes/v1/metrics.routes.ts',
  'src/routes/v1/monitoring.routes.ts',
  'src/routes/v1/pricing.routes.ts'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Match the import line and add IRouter if not present
    if (content.includes("from 'express'") && !content.includes('IRouter')) {
      content = content.replace(
        /import \{([^}]+)\} from 'express';/,
        (match, imports) => {
          // Clean up imports and add IRouter
          const cleanImports = imports.trim();
          return `import { ${cleanImports}, IRouter } from 'express';`;
        }
      );
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
  } else {
    console.log(`⚠️  Not found: ${filePath}`);
  }
});

console.log('\n✅ All files fixed! Run: npx tsc --noEmit');