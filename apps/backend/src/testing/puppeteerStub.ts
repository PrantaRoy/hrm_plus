// Jest runs under CommonJS, but puppeteer 25+ ships as an ES module that Jest's
// module runtime cannot load. No test exercises PDF rendering, so jest.config.js
// maps "puppeteer" to this stub via moduleNameMapper. If a test ever does need
// real PDF output, give it a dedicated ESM-aware config instead of unstubbing this.
export type Browser = unknown;

const puppeteer = {
  launch(): never {
    throw new Error("puppeteer is stubbed out in the Jest environment");
  },
};

export default puppeteer;
