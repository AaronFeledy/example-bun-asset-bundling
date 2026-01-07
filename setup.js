#!/usr/bin/env node

/**
 * EXAMPLE EMBEDDED SCRIPT
 * 
 * This script is embedded in the executable using "with { type: 'file' }" syntax.
 * It demonstrates that embedded files can be extracted and executed at runtime.
 * 
 * See src/index.ts for how this file is imported and used.
 */

console.log('📦 Running embedded setup script...');
console.log('   This script was bundled as a file asset in the executable.');
console.log('   It was extracted to /tmp and is now executing separately.\n');

console.log('✅ Setup script completed successfully!');
