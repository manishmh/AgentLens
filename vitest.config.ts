import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "services/**/*.test.ts", "tests/**/*.test.ts"],
    environment: "node",
    globals: false,
    // Workspace packages resolve through pnpm symlinks + their package.json
    // "exports" fields (which point at ./src/index.ts), so no path aliases are needed.
  },
});
