import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { Reading } from "@/app/hanja/middleChinese";

import { TextClickPopup, getCharacterAtPoint } from "./TextClickPopup";

const mockedGetMCData = jest.fn<(char: string) => Promise<Reading[] | null>>();

beforeEach(() => {
  Object.defineProperty(document, "caretPositionFromPoint", {
    configurable: true,
    value: jest.fn(),
  });
  Object.defineProperty(Range.prototype, "getClientRects", {
    configurable: true,
    value: jest.fn(),
  });
});

function makeRect(left: number, right: number): DOMRect {
  return {
    bottom: 20,
    height: 20,
    left,
    right,
    top: 0,
    width: right - left,
    x: left,
    y: 0,
    toJSON: () => ({}),
  };
}

function makeReading(fanqie: string): Reading {
  return {
    initial: { baxter: "k", rhymeGroup: "見" },
    final: { baxter: "ae" },
    rhymeGroup: "咍",
    division: "一",
    openClosed: "開",
    chongniu: "",
    tone: "平",
    fanqie,
  } as Reading;
}

function mockCaretPosition(node: Text, offset: number) {
  jest.spyOn(document, "caretPositionFromPoint").mockReturnValue({
    offsetNode: node,
    offset,
    getClientRect: () => null,
  });
}

function mockCharacterRects(rects: Map<number, DOMRect>) {
  jest.spyOn(Range.prototype, "getClientRects").mockImplementation(function (
    this: Range,
  ) {
    const rect = rects.get(this.startOffset);
    return (rect ? [rect] : []) as unknown as DOMRectList;
  });
}

afterEach(() => {
  jest.restoreAllMocks();
  mockedGetMCData.mockReset();
});

describe("getCharacterAtPoint", () => {
  it("does not select a later Han character when non-Han text was clicked", () => {
    const node = document.createTextNode("A漢");
    mockCaretPosition(node, 1);
    mockCharacterRects(
      new Map([
        [0, makeRect(0, 10)],
        [1, makeRect(10, 20)],
      ]),
    );

    expect(getCharacterAtPoint(5, 10)).toBeNull();
    expect(getCharacterAtPoint(15, 10)?.char).toBe("漢");
  });

  it("handles Han characters outside the BMP", () => {
    const node = document.createTextNode("𠀀");
    mockCaretPosition(node, 2);
    mockCharacterRects(new Map([[0, makeRect(0, 10)]]));

    expect(getCharacterAtPoint(5, 10)?.char).toBe("𠀀");
  });
});

describe("TextClickPopup", () => {
  function renderTwoCharacters() {
    render(
      <TextClickPopup lookup={mockedGetMCData} targetSelector=".text">
        <span className="text">漢</span>
        <span className="text">字</span>
      </TextClickPopup>,
    );

    const first = screen.getByText("漢").firstChild as Text;
    const second = screen.getByText("字").firstChild as Text;
    jest.spyOn(document, "caretPositionFromPoint").mockImplementation((x) => ({
      offsetNode: x < 15 ? first : second,
      offset: 0,
      getClientRect: () => null,
    }));
    jest.spyOn(Range.prototype, "getClientRects").mockImplementation(function (
      this: Range,
    ) {
      return [
        this.startContainer === first ? makeRect(0, 10) : makeRect(20, 30),
      ] as unknown as DOMRectList;
    });
  }

  it("does not open while text is selected", () => {
    renderTwoCharacters();
    jest
      .spyOn(window, "getSelection")
      .mockReturnValue({ isCollapsed: false } as Selection);

    fireEvent.click(screen.getByText("漢"), { clientX: 5, clientY: 10 });

    expect(mockedGetMCData).not.toHaveBeenCalled();
  });

  it("ignores a stale lookup response", async () => {
    let resolveFirst!: (readings: Reading[]) => void;
    let resolveSecond!: (readings: Reading[]) => void;
    mockedGetMCData
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSecond = resolve;
        }),
      );
    renderTwoCharacters();

    fireEvent.click(screen.getByText("漢"), { clientX: 5, clientY: 10 });
    fireEvent.click(screen.getByText("字"), { clientX: 25, clientY: 10 });

    await act(async () => resolveSecond([makeReading("second")]));
    expect(await screen.findByText("second切")).toBeInTheDocument();

    await act(async () => resolveFirst([makeReading("first")]));
    expect(screen.queryByText("first切")).not.toBeInTheDocument();
    expect(screen.getByText("second切")).toBeInTheDocument();
  });

  it("distinguishes an empty result from loading", async () => {
    mockedGetMCData.mockResolvedValue(null);
    renderTwoCharacters();

    fireEvent.click(screen.getByText("漢"), { clientX: 5, clientY: 10 });

    expect(
      await screen.findByText("중고음 자료가 없습니다."),
    ).toBeInTheDocument();
  });

  it("shows a lookup error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockedGetMCData.mockRejectedValue(new Error("failed"));
    renderTwoCharacters();

    fireEvent.click(screen.getByText("漢"), { clientX: 5, clientY: 10 });

    expect(
      await screen.findByText("중고음 자료를 불러오지 못했습니다."),
    ).toBeInTheDocument();
  });
});
