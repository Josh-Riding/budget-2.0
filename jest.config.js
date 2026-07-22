const nextJest = require("next/jest");

// next/jest wires up SWC transform for TS/TSX and resolves the `@/*` path
// alias from tsconfig, so no babel or ts-jest config is needed.
const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  // Pure logic lives under lib/; keep the runner scoped to test files there.
  testMatch: ["**/lib/**/*.test.ts"],
  // Avoid a Haste name collision with the standalone build output.
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
};

module.exports = createJestConfig(config);
