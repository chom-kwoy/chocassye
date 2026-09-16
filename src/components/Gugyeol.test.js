import { describe, expect, it } from "@jest/globals";

import { suggestGugyeol } from "./Gugyeol";

describe("suggestGugyeol", () => {
  it.each([
    ["나", 1, 0],
    ["앞나", 2, 1],
    ["😀나", 3, 2],
    ["앞나", 3, 1],
    ["앞na", 3, 1],
    ["앞n", 2, 1],
    ["앞나뒤", 2, 1],
    ["앞na뒤", 3, 1],
  ])("tracks the original range in %s at %i", (input, cursor, start) => {
    expect(suggestGugyeol(input, cursor)).toContainEqual({
      gugyeol: "\uf69b",
      pron: "나",
      replaceStart: start,
      replaceEnd: cursor,
    });
  });

  it("defaults to the end of the input", () => {
    expect(suggestGugyeol("앞나")).toEqual(suggestGugyeol("앞나", 2));
  });

  it.each([
    ["", 0],
    ["나", 0],
    ["나", 2],
    ["😀나", 1],
    ["나", 1],
  ])("does not suggest at an invalid boundary in %s at %i", (input, cursor) => {
    expect(suggestGugyeol(input, cursor)).toEqual([]);
  });

  it("matches a complete Old Korean reading without splitting its jamo", () => {
    expect(suggestGugyeol("앞ᄇᆞ리")).toContainEqual({
      gugyeol: "捨",
      pron: "ᄇᆞ리",
      replaceStart: 1,
      replaceEnd: 4,
    });
  });
});
