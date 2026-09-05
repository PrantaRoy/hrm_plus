/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "src",
  testMatch: ["**/__tests__/**/*.test.ts"],
  setupFiles: ["dotenv/config"],
  // puppeteer 25+ ships as an ES module that Jest's CommonJS runtime cannot load
  // (it reaches the test graph via app.ts -> document-requests -> pdf/renderer).
  // No test exercises real PDF rendering, so map it to a stub.
  moduleNameMapper: {
    "^puppeteer$": "<rootDir>/testing/puppeteerStub.ts",
  },
  transform: {
    "^.+\\.[cm]?[tj]sx?$": ["ts-jest", { isolatedModules: true }],
  },
  // sanitize-html (used by utils/sanitize.ts, reached via app.ts) pulls in
  // htmlparser2 v12+ and its ESM-only dependency tree. Let ts-jest transpile
  // those packages to CommonJS instead of ignoring them like the rest of
  // node_modules.
  transformIgnorePatterns: [
    "/node_modules/(?!(htmlparser2|domhandler|domutils|dom-serializer|domelementtype|entities)/)",
  ],
};
