/* eslint-disable */
// Jest reporter that writes a test-case report (Excel + CSV) with the columns:
//   Test ID | Module | Test Step | Input | Expected | Actual Result | Environment | Status | Note
//
// Jest only records a test's name, status and failure message. "Input" and "Expected" are therefore
// recovered from the test's own source: top-level statements that are not assertions become the Input
// (the setup/calls the test makes), and `expect(...)` statements become the Expected result.
//
// Usage: npm run test:report         (all suites; integration suites need MySQL)
//        npm run test:report:unit    (fast, DB-free unit suites only)
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const ExcelJS = require("exceljs");

const MAX_CELL = 900;

const clip = (text) => (text.length > MAX_CELL ? `${text.slice(0, MAX_CELL - 1)}…` : text);
const squash = (text) => text.replace(/\s+/g, " ").trim();

// Returns the source text of the call that starts at (line, column), by balancing brackets
// and skipping string/template literals and comments. Best-effort; returns "" on failure.
function extractCall(source, line, column) {
  const lines = source.split("\n");
  let offset = 0;
  for (let i = 0; i < line - 1; i++) offset += lines[i].length + 1;
  offset += Math.max(0, column - 1);
  // Jest points at the last member of `it.failing` / `it.each`; step back to include `it.`
  while (offset > 0 && /[\w$.]/.test(source[offset - 1])) offset--;

  let depth = 0;
  let started = false;
  for (let i = offset; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];
    if (ch === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") i++;
    } else if (ch === "/" && next === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i++;
    } else if (ch === '"' || ch === "'" || ch === "`") {
      i++;
      while (i < source.length && source[i] !== ch) {
        if (source[i] === "\\") i++;
        i++;
      }
    } else if ("([{".includes(ch)) {
      depth++;
      started = true;
    } else if (")]}".includes(ch)) {
      depth--;
      // `it.each(table)("name", fn)` has a second argument group right after the first.
      if (started && depth === 0 && source[i + 1] !== "(") return source.slice(offset, i + 1);
    }
  }
  return "";
}

// Splits the callback body into top-level statements (on `;` at bracket depth 0).
function splitStatements(body) {
  const out = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      current += ch;
      i++;
      while (i < body.length && body[i] !== quote) {
        if (body[i] === "\\") current += body[i++];
        current += body[i++];
      }
      current += quote;
      continue;
    }
    if (ch === "/" && body[i + 1] === "/") {
      while (i < body.length && body[i] !== "\n") i++;
      continue;
    }
    if ("([{".includes(ch)) depth++;
    if (")]}".includes(ch)) depth--;
    if (ch === ";" && depth === 0) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) out.push(current);
  return out.map(squash).filter(Boolean);
}

// Splits `expect(ARG).matcher(...)` into its argument and matcher chain.
function splitExpect(statement) {
  const start = statement.indexOf("expect(");
  if (start < 0) return null;
  let depth = 0;
  for (let i = start + "expect".length; i < statement.length; i++) {
    const ch = statement[i];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) {
        return {
          arg: squash(statement.slice(start + "expect(".length, i)),
          matcher: squash(statement.slice(i + 1)).replace(/^\./, ""),
        };
      }
    }
  }
  return null;
}

// A bare variable / member path (`err.status`) is not worth listing as a separate input.
const isTrivialArg = (arg) => /^[\w$.\[\]"'`]+$/.test(arg);

function describeTest(call) {
  if (!call) return { input: "", expected: "", known: false };
  const known = /^(it|test)\.failing/.test(call);
  // The callback body is the `{ ... }` block after `=>`, or the bare expression for `() => expect(...)`.
  const arrow = call.search(/=>|function/);
  const afterArrow = arrow >= 0 ? call.slice(call.indexOf(call.startsWith("=>", arrow) ? "=>" : "{", arrow) + (call.startsWith("=>", arrow) ? 2 : 0)).trimStart() : "";
  let body = "";
  if (afterArrow.startsWith("{")) body = afterArrow.slice(1, afterArrow.lastIndexOf("}"));
  else if (afterArrow) body = afterArrow.slice(0, afterArrow.lastIndexOf(")"));
  const statements = splitStatements(body);
  const isAssertion = (s) => /^(await\s+)?expect\(/.test(s);

  const input = statements.filter((s) => !isAssertion(s));
  const expected = [];
  for (const statement of statements.filter(isAssertion)) {
    const parts = splitExpect(statement);
    if (!parts) {
      expected.push(statement);
    } else if (isTrivialArg(parts.arg)) {
      expected.push(`${parts.arg} → ${parts.matcher}`);
    } else {
      // The expression under test is the input; the matcher is the expected outcome.
      input.push(parts.arg);
      expected.push(`${/^await\s/.test(statement) ? "await " : ""}result → ${parts.matcher}`);
    }
  }
  // Assertions nested in loops / if-else branches: pull each `expect(...)` out of the setup statements.
  if (expected.length === 0) {
    for (const match of body.matchAll(/(?<![\w$.])expect\(/g)) {
      const [first] = splitStatements(body.slice(match.index));
      const parts = first && splitExpect(first);
      if (parts) expected.push(`${parts.arg} → ${parts.matcher}`);
    }
  }
  return {
    known,
    input: clip(input.join(";\n") || "(none — see Test Step)"),
    expected: clip(expected.join(";\n") || "(see Test Step)"),
  };
}

function moduleName(testFilePath, rootDir) {
  return path.relative(rootDir, testFilePath).replace(/\.test\.ts$/, "").replace(/^__tests__\//, "");
}

function kindOf(testFilePath) {
  return testFilePath.includes(`${path.sep}__tests__${path.sep}unit${path.sep}`) ? "Unit (white-box, mocked)" : "Integration (HTTP + MySQL)";
}

class TestReportReporter {
  constructor(globalConfig) {
    this.globalConfig = globalConfig;
  }

  async onRunComplete(_contexts, results) {
    const rootDir = this.globalConfig.rootDir;
    const sourceCache = new Map();
    const readSource = (file) => {
      if (!sourceCache.has(file)) sourceCache.set(file, fs.readFileSync(file, "utf8"));
      return sourceCache.get(file);
    };

    const runDate = new Date();
    const envBase = `Node ${process.version}; ${os.type()} ${os.release()} (${os.arch()}); Jest ${require("jest/package.json").version}`;

    const rows = [];
    const suites = [...results.testResults].sort((a, b) => a.testFilePath.localeCompare(b.testFilePath));
    for (const suite of suites) {
      const source = readSource(suite.testFilePath);
      const module = moduleName(suite.testFilePath, rootDir);
      const kind = kindOf(suite.testFilePath);
      const suiteFailedToRun = suite.testResults.length === 0 && suite.failureMessage;

      if (suiteFailedToRun) {
        rows.push({
          module,
          step: "(suite failed to run)",
          input: "",
          expected: "Suite loads and executes",
          actual: clip(squash(suite.failureMessage.replace(/\u001b\[[0-9;]*m/g, ""))),
          environment: `${envBase}; ${kind}`,
          status: "FAIL",
          note: "",
        });
        continue;
      }

      for (const test of suite.testResults) {
        const loc = test.location;
        const call = loc ? extractCall(source, loc.line, loc.column) : "";
        const { input, expected, known } = describeTest(call);
        const status = test.status === "passed" ? "PASS" : test.status === "failed" ? "FAIL" : "SKIPPED";
        const failure = (test.failureMessages || []).join(" ").replace(/\u001b\[[0-9;]*m/g, "");

        const notes = [`${test.duration ?? 0} ms`];
        if (known) notes.push("KNOWN BUG documented with it.failing — passes while the bug exists; flips to FAIL once fixed");

        rows.push({
          module,
          step: [...test.ancestorTitles, test.title].join(" › "),
          input,
          expected,
          actual:
            status === "PASS"
              ? known
                ? "Defect reproduced as documented (assertion currently fails, as expected)"
                : "Behaved as expected — all assertions held"
              : status === "SKIPPED"
                ? "Not executed"
                : clip(squash(failure)),
          environment: `${envBase}; ${kind}`,
          status,
          note: notes.join("; "),
        });
      }
    }

    rows.forEach((row, i) => {
      row.id = `TC-${String(i + 1).padStart(4, "0")}`;
    });

    const outDir = path.resolve(rootDir, "..", "test-reports");
    fs.mkdirSync(outDir, { recursive: true });
    const stamp = runDate.toISOString().replace(/[:.]/g, "-").slice(0, 19);

    // ---- Excel ----
    const wb = new ExcelJS.Workbook();
    wb.created = runDate;
    const ws = wb.addWorksheet("Test Cases", { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = [
      { header: "Test ID", key: "id", width: 11 },
      { header: "Module", key: "module", width: 28 },
      { header: "Test Step", key: "step", width: 52 },
      { header: "Input", key: "input", width: 60 },
      { header: "Expected", key: "expected", width: 60 },
      { header: "Actual Result", key: "actual", width: 44 },
      { header: "Environment", key: "environment", width: 46 },
      { header: "Status", key: "status", width: 10 },
      { header: "Note", key: "note", width: 40 },
    ];
    ws.addRows(rows);
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3A5F" } };
    ws.autoFilter = { from: "A1", to: "I1" };
    ws.eachRow((row, n) => {
      row.alignment = { vertical: "top", wrapText: true };
      if (n === 1) return;
      const status = row.getCell("status");
      const color = status.value === "PASS" ? "FFC6EFCE" : status.value === "FAIL" ? "FFFFC7CE" : "FFFFEB9C";
      status.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
      status.font = { bold: true };
    });

    const passed = rows.filter((r) => r.status === "PASS").length;
    const failed = rows.filter((r) => r.status === "FAIL").length;
    const skipped = rows.length - passed - failed;
    const summary = wb.addWorksheet("Summary");
    summary.columns = [{ width: 24 }, { width: 70 }];
    summary.addRows([
      ["Run date", runDate.toISOString()],
      ["Total test cases", rows.length],
      ["Passed", passed],
      ["Failed", failed],
      ["Skipped", skipped],
      ["Pass rate", rows.length ? `${((passed / rows.length) * 100).toFixed(1)}%` : "n/a"],
      ["Test suites", suites.length],
      ["Environment", envBase],
      ["Integration DB", "MySQL (per-suite tenant databases created and dropped by testUtils.ts)"],
      ["Unit tests", "No DB / Redis / network — Prisma, config, storage and fetch are mocked"],
    ]);
    summary.getColumn(1).font = { bold: true };
    summary.getColumn(2).alignment = { horizontal: "left" };

    const xlsxPath = path.join(outDir, `test-report-${stamp}.xlsx`);
    await wb.xlsx.writeFile(xlsxPath);

    // ---- CSV ----
    const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["Test ID", "Module", "Test Step", "Input", "Expected", "Actual Result", "Environment", "Status", "Note"];
    const keys = ["id", "module", "step", "input", "expected", "actual", "environment", "status", "note"];
    const csv = [header.map(csvCell).join(","), ...rows.map((r) => keys.map((k) => csvCell(r[k])).join(","))].join("\n");
    const csvPath = path.join(outDir, `test-report-${stamp}.csv`);
    fs.writeFileSync(csvPath, `﻿${csv}`); // BOM so Excel reads UTF-8 correctly

    console.log(`\nTest report written (${rows.length} cases: ${passed} passed, ${failed} failed, ${skipped} skipped):`);
    console.log(`  ${xlsxPath}`);
    console.log(`  ${csvPath}`);
  }
}

module.exports = TestReportReporter;
