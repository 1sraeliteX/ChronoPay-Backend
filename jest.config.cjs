/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        diagnostics: { ignoreCodes: [151002] },
        tsconfig: { isolatedModules: true },
      },
    ],
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: [
    "src/db/**/*.ts",
    "src/scripts/migrate.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};
