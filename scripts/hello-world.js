#!/usr/bin/env node

/**
 * EXAMPLE EMBEDDED SCRIPT FROM scripts/ DIRECTORY
 * 
 * This script is embedded via the build plugin (see build.ts).
 * It's discovered at runtime using Bun.embeddedFiles and can be
 * extracted and executed separately.
 * 
 * See src/index.ts for how scripts are discovered and used.
 */

console.log("=".repeat(50));
console.log("  Hello from embedded script!");
console.log("=".repeat(50));
console.log(`  This script was bundled as a file asset.`);
console.log(`  It was discovered via Bun.embeddedFiles.`);
console.log(`  Timestamp: ${new Date().toISOString()}`);
console.log("=".repeat(50));
