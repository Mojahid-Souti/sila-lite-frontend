import { csvPreview, csvRecords } from "@/lib/csv-records";
import { describe, expect, it } from "vitest";

// What Excel exports: a BOM, CRLF line ends, and line breaks inside quoted
// cells — three records of four columns spread over many physical lines.
const EXPORTED = [
  "\uFEFF#,Objective,Owner,Progress",
  '1,Faster onboarding,Operations,"Two sites live.\nThe third opens in May."',
  '2,Fewer tickets,Support,"Down 12%.\nTarget: 20%.\nOn track."',
  "3,Cleaner data,Data team,Done",
  "",
].join("\r\n");

describe("csvRecords", () => {
  it("keeps a quoted line break inside its cell", () => {
    expect(csvRecords('a,b\n1,"line one\nline two"\n')).toEqual([
      ["a", "b"],
      ["1", "line one\nline two"],
    ]);
  });

  it("reads doubled quotes, CRLF and a BOM", () => {
    expect(csvRecords('﻿a,b\r\n"say ""hi""",2\r\n')).toEqual([
      ["a", "b"],
      ['say "hi"', "2"],
    ]);
  });

  it("counts an Excel export by records, not physical lines", () => {
    const records = csvRecords(EXPORTED);
    expect(EXPORTED.split(/\r?\n/).length).toBeGreaterThan(4); // lines would lie
    expect(records.length).toBe(4);
    expect(records[0][0]).toBe("#"); // the BOM is not glued to the first header
  });
});

describe("csvPreview", () => {
  it("says 3 rows for 3 records, not the physical line count", () => {
    expect(csvPreview(EXPORTED, 220).split("\n")[0]).toBe("3 rows · 4 columns");
  });

  it("falls back to the text for a one-line file", () => {
    expect(csvPreview("just a header", 220)).toBe("just a header");
  });
});
