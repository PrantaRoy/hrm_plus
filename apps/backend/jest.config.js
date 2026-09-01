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
};
