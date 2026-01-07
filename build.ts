import type { BunPlugin } from "bun";
import { readdir } from "fs/promises";
import { join } from "path";

/**
 * BUILD CONFIGURATION FOR BUN SINGLE-FILE EXECUTABLE
 * 
 * This demonstrates four ways to embed files in a Bun executable:
 * 
 * METHOD 1: Using "with { type: 'file' }" import syntax (see src/index.ts)
 * METHOD 2: Using loader configuration for file extensions (e.g., .yml files)
 * METHOD 3: Using glob patterns in entrypoints (scripts/*.js)
 * METHOD 4: Using build plugins to bundle files from specific directories (docs/*.md)
 */

// METHOD 3: Plugin to handle scripts/*.js files when included as entrypoints
// This ensures they're bundled as file assets, not compiled as code
const scriptsFilesPlugin: BunPlugin = {
  name: "scripts-files-plugin",
  setup(build) {
    build.onLoad({ filter: /scripts\/.*\.js$/ }, async (args) => {
      return {
        contents: await Bun.file(args.path).bytes(),
        loader: "file" // "file" loader embeds the file as a raw asset
      };
    });
  },
};

// METHOD 4: Plugin that bundles all .md files from docs/ directory as file assets
// This allows files to be accessed at runtime via Bun.embeddedFiles
const markdownFilesPlugin: BunPlugin = {
  name: "markdown-files-plugin",
  setup(build) {
    build.onLoad({ filter: /docs\/.*\.md$/ }, async (args) => {
      return {
        contents: await Bun.file(args.path).bytes(),
        loader: "file" // "file" loader embeds the file as a raw asset
      };
    });
  },
};

// METHOD 3: Glob scripts directory to include all .js files as entrypoints
// When files are included as entrypoints, they're bundled as assets
// Using glob pattern directly in entrypoints
const glob = new Bun.Glob("scripts/*.js");
const scriptFiles: string[] = [];
for await (const file of glob.scan(".")) {
  scriptFiles.push(file);
}

console.log(`Found ${scriptFiles.length} script(s) to bundle via glob:`, scriptFiles);

// Build the single-file executable
const result = await Bun.build({
  entrypoints: [
    "./src/index.ts", // Main application entrypoint
    // METHOD 3: Include scripts via glob patterns as entrypoints
    // These will be bundled as file assets
    ...scriptFiles,
  ],
  compile: {
    outfile: "./dist/app", // Output single-file executable
    autoloadDotenv: false,
    autoloadBunfig: false,
  },
  bytecode: true, // Compile to bytecode for better performance
  
  // METHOD 2: Configure loader for file extensions
  // All .yml files will be bundled as file assets (not parsed/imported as code)
  // METHOD 3: Also configure loader for scripts/*.js so they're bundled as file assets
  loader: {
    ".yml": "file",
    // Note: For METHOD 3, scripts are included as entrypoints and need to be
    // handled by a plugin or loader. Since they're entrypoints, we use a plugin
    // approach similar to METHOD 4, but the key difference is they're explicitly
    // listed in entrypoints via glob, not discovered by the plugin.
  },
  
  // METHOD 3 & 4: Use plugins to bundle files from specific directories
  // METHOD 3: Scripts plugin handles scripts/*.js files (included as entrypoints)
  // METHOD 4: Markdown plugin handles docs/*.md files (discovered by plugin)
  plugins: [scriptsFilesPlugin, markdownFilesPlugin],
  
  // Prevent file name hashing so we can reference files by their original names
  naming: {
    asset: "[name].[ext]",
  },
});

if (result.success) {
  console.log("Build successful:", result.outputs[0].path);
} else {
  console.error("Build failed:", result.logs);
  process.exit(1);
}
