import { join } from "path";
import { mkdir, chmod } from "fs/promises";
import { existsSync } from "fs";

/**
 * BUN SINGLE-FILE EXECUTABLE DEMONSTRATION
 * 
 * This demonstrates four methods for embedding files in a Bun executable:
 * 
 * METHOD 1: Using "with { type: 'file' }" import syntax
 *   - Allows you to import a specific file as a file asset
 *   - The file path is available at runtime, and you can read it with Bun.file()
 */
// @ts-ignore - setup.js is bundled as a file asset (not parsed as code)
import setupScript from "../setup.js" with { type: "file" };

/**
 * METHOD 2: Using loader configuration (see build.ts)
 *   - All files with .yml extension are automatically bundled as file assets
 *   - The file path is available at runtime, and you can read it with Bun.file()
 */
// @ts-ignore - config.yml is bundled as a file asset via loader config
import config from "../configs/config.yml";

/**
 * METHOD 3: Using glob patterns in entrypoints (see build.ts)
 *   - Files from scripts/ directory are included as entrypoints via glob
 *   - These files are accessible via Bun.embeddedFiles at runtime
 * 
 * METHOD 4: Using build plugins (see build.ts)
 *   - Files from docs/ directory are bundled as file assets via plugin
 *   - These files are also accessible via Bun.embeddedFiles at runtime
 */

interface Config {
  app: { name: string; version: string };
  greeting: { message: string; recipient: string };
  settings: { debug: boolean; max_retries: number; timeout_ms: number };
}

const TMP_DIR = "/tmp/bun-bundle-demo";
const TMP_SCRIPTS_DIR = join(TMP_DIR, "scripts");
const TMP_DOCS_DIR = join(TMP_DIR, "docs");

/**
 * Extract embedded files to the filesystem
 * 
 * Demonstrates how to read embedded file assets and write them to disk.
 * This is useful when you need to execute scripts or access files that
 * require filesystem paths.
 */
async function extractEmbeddedFiles(): Promise<void> {
  await mkdir(TMP_DIR, { recursive: true });

  const configDest = join(TMP_DIR, "config.yml");
  const setupScriptDest = join(TMP_DIR, "setup.js");

  // Read embedded files using Bun.file() with the imported path
  // METHOD 1 & 2: Files imported with "with { type: 'file' }" or via loader
  const configContent = await Bun.file(config).text();
  const setupScriptContent = await Bun.file(setupScript).text();

  // Write files to disk
  await Bun.write(configDest, configContent);
  await Bun.write(setupScriptDest, setupScriptContent);
  await chmod(setupScriptDest, 0o755); // Make script executable

  console.log(`   ✅ Extracted config to: ${configDest}`);
  console.log(`   ✅ Extracted setup script to: ${setupScriptDest}`);
}

/**
 * Discover and extract scripts from Bun.embeddedFiles
 * 
 * Demonstrates METHOD 3: Accessing files bundled via glob patterns in entrypoints.
 * Scripts from scripts/ directory are included as entrypoints and accessible
 * via Bun.embeddedFiles at runtime.
 */
async function extractScriptsFromEmbeddedFiles(): Promise<void> {
  await mkdir(TMP_SCRIPTS_DIR, { recursive: true });

  if (!Bun.embeddedFiles) {
    console.log("   ⚠️  No embedded files found.");
    return;
  }

  let scriptsFound = 0;

  // Iterate through all embedded files
  for (const file of Bun.embeddedFiles) {
    const name = (file as any).name || (file as any).path || "";

    // Find scripts from the scripts/ directory (bundled via METHOD 3 - glob)
    // Scripts may have paths like "scripts/hello-world.js" or just "hello-world.js"
    // Exclude setup.js which is bundled via METHOD 1
    // Also exclude index.ts and other source files
    const isScriptFile = 
      name.endsWith(".js") && 
      name !== "setup.js" &&
      !name.includes("setup.js") &&
      !name.includes("index.ts") &&
      !name.includes("build.ts") &&
      (name.includes("scripts/") || name.includes("hello-world") || name.includes("scripts"));

    if (isScriptFile) {
      const fileName = name.split("/").pop() || name.split("\\").pop() || name;
      const destPath = join(TMP_SCRIPTS_DIR, fileName);

      // Read file content (embedded files can be Blobs or file paths)
      const content = file instanceof Blob
        ? await file.text()
        : await Bun.file(file as any).text();

      // Write to disk and make executable
      await Bun.write(destPath, content);
      await chmod(destPath, 0o755);
      console.log(`   ✅ Extracted ${fileName} to ${destPath}`);
      scriptsFound++;
    }
  }

  if (scriptsFound === 0) {
    console.log("   ⚠️  No scripts found in embedded files.");
  }
}

/**
 * Discover and extract markdown files from Bun.embeddedFiles
 * 
 * Demonstrates METHOD 4: Accessing files bundled via build plugins.
 * Markdown files from docs/ directory are bundled via plugin and accessible
 * via Bun.embeddedFiles at runtime.
 */
async function extractDocsFromEmbeddedFiles(): Promise<void> {
  await mkdir(TMP_DOCS_DIR, { recursive: true });

  if (!Bun.embeddedFiles) {
    return;
  }

  let docsFound = 0;

  // Iterate through all embedded files
  for (const file of Bun.embeddedFiles) {
    const name = (file as any).name || (file as any).path || "";

    // Find markdown files from the docs/ directory (bundled via METHOD 4 - plugin)
    // Markdown files may have paths like "docs/example.md" or just "example.md"
    const isDocFile = 
      name.endsWith(".md") && 
      (name.includes("docs/") || name.includes("example.md") || name.includes("docs"));

    if (isDocFile) {
      const fileName = name.split("/").pop() || name.split("\\").pop() || name;
      const destPath = join(TMP_DOCS_DIR, fileName);

      // Read file content
      const content = file instanceof Blob
        ? await file.text()
        : await Bun.file(file as any).text();

      // Write to disk
      await Bun.write(destPath, content);
      console.log(`   ✅ Extracted ${fileName} to ${destPath}`);
      docsFound++;
    }
  }

  if (docsFound === 0) {
    console.log("   ⚠️  No markdown files found in embedded files.");
  }
}

/**
 * Load and parse YAML config file
 * 
 * Demonstrates reading and parsing an embedded file asset.
 */
async function loadConfig(configPath: string): Promise<Config> {
  const content = await Bun.file(configPath).text();
  return Bun.YAML.parse(content) as Config;
}

/**
 * Execute an extracted script
 * 
 * Demonstrates that embedded scripts can be extracted and executed
 * as separate processes.
 */
async function runScript(scriptPath: string): Promise<void> {
  console.log("\n📜 Running extracted script...\n");
  await Bun.spawn(["bun", scriptPath], {
    stdout: "inherit",
    stderr: "inherit",
  }).exited;
}

/**
 * Display information about embedded files
 * 
 * Shows what files are embedded and how they were bundled.
 */
async function displayEmbeddedFilesInfo(): Promise<void> {
  console.log("\n📦 Embedded Files Information:");
  console.log(`   Config (METHOD 2 - loader): ${config}`);
  console.log(`   Setup script (METHOD 1 - import with): ${setupScript}`);

  if (Bun.embeddedFiles) {
    console.log("\n📁 Files from Bun.embeddedFiles:");
    console.log("   (Includes files from METHOD 3 - glob and METHOD 4 - plugin)");
    for (const file of Bun.embeddedFiles) {
      const size = file instanceof Blob ? file.size : (file as any).size || 0;
      const name = (file as any).name || (file as any).path || "unknown";
      // Determine method based on file characteristics
      let method = "unknown";
      if (name.includes("docs/") || (name.endsWith(".md") && name !== "README.md")) {
        method = "METHOD 4 (plugin)";
      } else if ((name.includes("scripts/") || name.includes("hello-world")) && name.endsWith(".js") && name !== "setup.js") {
        method = "METHOD 3 (glob)";
      } else if (name === "setup.js") {
        method = "METHOD 1 (also in embeddedFiles)";
      } else if (name.endsWith(".yml")) {
        method = "METHOD 2 (also in embeddedFiles)";
      }
      console.log(`   - ${name} (${size} bytes) [${method}]`);
    }
  }
}

/**
 * Main demonstration function
 */
async function main(): Promise<void> {
  console.log("🚀 Bun Single-File Executable Demo");
  console.log("===================================\n");
  console.log("This demo shows four ways to embed files in a Bun executable:\n");
  console.log("  METHOD 1: Import with 'with { type: \"file\" }' syntax");
  console.log("  METHOD 2: Configure loader for file extensions (.yml)");
  console.log("  METHOD 3: Use glob patterns in entrypoints (scripts/*.js)");
  console.log("  METHOD 4: Use build plugins to bundle directories (docs/*.md)\n");

  // Show what files are embedded
  await displayEmbeddedFilesInfo();

  // Extract embedded files to demonstrate they can be accessed
  const configDest = join(TMP_DIR, "config.yml");
  const setupScriptDest = join(TMP_DIR, "setup.js");

  if (!existsSync(configDest)) {
    console.log(`\n📂 Extracting embedded files to ${TMP_DIR}...`);
    await extractEmbeddedFiles();
  } else {
    console.log(`\n✅ Files already extracted in ${TMP_DIR}.`);
  }

  // Extract scripts discovered via Bun.embeddedFiles (METHOD 3)
  console.log(`\n📜 Extracting scripts from Bun.embeddedFiles (METHOD 3 - glob)...`);
  await extractScriptsFromEmbeddedFiles();

  // Extract markdown files discovered via Bun.embeddedFiles (METHOD 4)
  console.log(`\n📄 Extracting markdown files from Bun.embeddedFiles (METHOD 4 - plugin)...`);
  await extractDocsFromEmbeddedFiles();

  // Demonstrate reading and using embedded config
  console.log("\n📖 Reading embedded YAML config...");
  const configData = await loadConfig(configDest);
  console.log(`   App: ${configData.app.name} v${configData.app.version}`);
  console.log(`   Message: ${configData.greeting.message}`);
  console.log(`   Debug mode: ${configData.settings.debug}`);

  // Execute extracted script
  await runScript(setupScriptDest);

  console.log("\n✨ Demo complete!");
  console.log(`   Check ${TMP_DIR} to see the extracted files.`);
}

main();
