jest.mock("../../config/env", () => ({ env: { SETTINGS_ENCRYPTION_KEY: "unit-test-key-unit-test-key-unit-test" } }));

import { decrypt, encrypt } from "../../utils/encryption";

describe("encryption (AES-256-GCM)", () => {
  it("round-trips plaintext, including unicode and empty-ish values", () => {
    for (const text of ["sk-secret-123", "pässwörd ✓ 日本語", "a", "x".repeat(5000)]) {
      expect(decrypt(encrypt(text))).toBe(text);
    }
  });

  it("emits the versioned v1:iv:tag:ciphertext format", () => {
    const parts = encrypt("hello").split(":");
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe("v1");
    expect(Buffer.from(parts[1], "base64")).toHaveLength(12); // GCM IV
    expect(Buffer.from(parts[2], "base64")).toHaveLength(16); // auth tag
  });

  it("uses a fresh IV per call so equal plaintexts encrypt differently", () => {
    expect(encrypt("same")).not.toBe(encrypt("same"));
  });

  it("does not leak the plaintext", () => {
    expect(encrypt("super-secret-api-key")).not.toContain("super-secret-api-key");
  });

  it("rejects an unrecognized version or malformed payload", () => {
    expect(() => decrypt("v2:a:b:c")).toThrow("Unrecognized ciphertext format");
    expect(() => decrypt("v1:onlyone")).toThrow("Unrecognized ciphertext format");
    expect(() => decrypt("garbage")).toThrow("Unrecognized ciphertext format");
  });

  it("detects tampering with the ciphertext (GCM auth)", () => {
    const [v, iv, tag, ct] = encrypt("tamper me").split(":");
    const flipped = Buffer.from(ct, "base64");
    flipped[0] ^= 0xff;
    expect(() => decrypt([v, iv, tag, flipped.toString("base64")].join(":"))).toThrow();
  });

  it("detects tampering with the auth tag", () => {
    const [v, iv, tag, ct] = encrypt("tamper me").split(":");
    const badTag = Buffer.from(tag, "base64");
    badTag[0] ^= 0xff;
    expect(() => decrypt([v, iv, badTag.toString("base64"), ct].join(":"))).toThrow();
  });
});
