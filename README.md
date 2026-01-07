# Bun Single-File Executable File Embedding Demo

This project demonstrates four different methods for embedding files in a Bun single-file executable. It's designed as an educational example to help understand how Bun can bundle and work with files in a compiled executable.

## Overview

When building a single-file executable with Bun, you may need to embed configuration files, scripts, or other assets. This demo shows four approaches:

1. **Import with `with { type: "file" }` syntax** - Import specific files as file assets
2. **Loader configuration** - Automatically bundle files by extension (e.g., `.yml`)
3. **Glob patterns in entrypoints** - Include files via glob patterns as entrypoints
4. **Build plugins** - Bundle files from specific directories using custom plugins

## Project Structure

```
.
├── build.ts              # Build configuration demonstrating all four methods
├── src/
│   └── index.ts          # Main demo application
├── setup.js              # Example file for METHOD 1
├── configs/
│   └── config.yml        # Example file for METHOD 2
├── scripts/
│   └── hello-world.js    # Example file for METHOD 3
└── docs/
    └── example.md        # Example file for METHOD 4
```

## The Four Methods

### METHOD 1: Import with `with { type: "file" }`

Import a specific file as a file asset:

```typescript
import setupScript from "../setup.js" with { type: "file" };
```

The file path is available at runtime, and you can read it with `Bun.file()`:

```typescript
const content = await Bun.file(setupScript).text();
```

**Example:** `setup.js` is embedded using this method.

### METHOD 2: Loader Configuration

Configure Bun to bundle all files with a specific extension as file assets:

```typescript
// In build.ts
loader: {
  ".yml": "file",
}
```

Then import normally (TypeScript will need `@ts-ignore`):

```typescript
// @ts-ignore
import config from "../configs/config.yml";
```

**Example:** `config.yml` is embedded using this method.

### METHOD 3: Glob Patterns in Entrypoints

Include files via glob patterns as entrypoints. Files included as entrypoints are bundled as assets:

```typescript
// In build.ts
const glob = new Bun.Glob("scripts/*.js");
const scriptFiles: string[] = [];
for await (const file of glob.scan(".")) {
  scriptFiles.push(file);
}

const result = await Bun.build({
  entrypoints: [
    "./src/index.ts",
    ...scriptFiles, // Include globbed files as entrypoints
  ],
  // ...
});
```

Access these files at runtime via `Bun.embeddedFiles`:

```typescript
for (const file of Bun.embeddedFiles) {
  const name = (file as any).name || "";
  if (name.includes("scripts/")) {
    // Process embedded script files...
  }
}
```

**Example:** Files in the `scripts/` directory are embedded using this method.

### METHOD 4: Build Plugins

Create a build plugin to bundle files from specific directories:

```typescript
const markdownFilesPlugin: BunPlugin = {
  name: "markdown-files-plugin",
  setup(build) {
    build.onLoad({ filter: /docs\/.*\.md$/ }, async (args) => {
      return {
        contents: await Bun.file(args.path).bytes(),
        loader: "file"
      };
    });
  },
};
```

Access these files at runtime via `Bun.embeddedFiles`:

```typescript
for (const file of Bun.embeddedFiles) {
  const name = (file as any).name || "";
  if (name.includes("docs/")) {
    // Process embedded markdown files...
  }
}
```

**Example:** Files in the `docs/` directory are embedded using this method.

## Building

Build the single-file executable:

```bash
bun run build.ts
```

This creates `dist/app`, a standalone executable that contains all embedded files.

## Running

Run the executable:

```bash
./dist/app
```

The demo will:
1. Display information about embedded files from all four methods
2. Extract embedded files to `/tmp/bun-bundle-demo`
3. Extract scripts (METHOD 3) and markdown files (METHOD 4) from `Bun.embeddedFiles`
4. Read and parse the embedded YAML config
5. Execute the extracted setup script

## Key Concepts

- **File assets** are embedded as raw bytes in the executable, not parsed as code
- Files can be read at runtime using `Bun.file()` with the embedded file path (METHOD 1 & 2)
- `Bun.embeddedFiles` provides access to all files bundled via glob patterns (METHOD 3) and plugins (METHOD 4)
- Embedded files can be extracted to the filesystem if needed (e.g., for execution)
- Each method has different use cases:
  - **METHOD 1**: Best for specific files you need to import directly
  - **METHOD 2**: Best for bundling all files of a specific type
  - **METHOD 3**: Best for including entire directories as entrypoints
  - **METHOD 4**: Best for custom bundling logic or files not imported directly

## Requirements

- [Bun](https://bun.sh) (latest version)

## License

This is an educational demonstration project.