import { describe, expect, it } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import TextFieldWithGugyeol from "./TextFieldWithGugyeol";

// SWC hoists mocks made with the Jest global.
declare const jest: typeof import("@jest/globals").jest;

jest.mock("./TranslationProvider", () => ({
  useTranslation: () => ({ t: (text: string) => text }),
}));

function ControlledField({
  initialValue,
  onKeyDown,
}: {
  initialValue: string;
  onKeyDown?: React.KeyboardEventHandler;
}) {
  const [value, setValue] = React.useState(initialValue);
  return (
    <TextFieldWithGugyeol
      label="Search"
      value={value}
      onKeyDown={onKeyDown}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
        setValue(event.target.value)
      }
    />
  );
}

describe("TextFieldWithGugyeol", () => {
  it.each([
    ["앞나", 2, "앞\uf69b", 2],
    ["😀나", 3, "😀\uf69b", 3],
    ["앞나뒤", 3, "앞\uf69b뒤", 2],
    ["앞na뒤", 3, "앞\uf69b뒤", 2],
    ["앞나뒤", 2, "앞\uf69b뒤", 2],
  ])(
    "replaces only the matched range in %s",
    async (initialValue, cursor, expected, nextCursor) => {
      const user = userEvent.setup();
      render(<ControlledField initialValue={initialValue} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      await user.click(input);
      fireEvent.select(input, {
        target: { selectionStart: cursor, selectionEnd: cursor },
      });
      await user.click(
        screen.getByRole("button", { name: "Toggle Gugyeol Input" }),
      );
      await user.click(screen.getByRole("button", { name: "\uf69b 나" }));

      expect(input).toHaveValue(expected);
      expect(input).toHaveFocus();
      expect(input.selectionStart).toBe(nextCursor);
      expect(input.selectionEnd).toBe(nextCursor);
      await user.keyboard("x");
      expect(input).toHaveValue(
        expected.slice(0, nextCursor) + "x" + expected.slice(nextCursor),
      );
    },
  );

  it("updates suggestions when the cursor moves without editing", async () => {
    const user = userEvent.setup();
    render(<ControlledField initialValue="앞나뒤" />);
    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.keyboard("{End}");
    await user.click(
      screen.getByRole("button", { name: "Toggle Gugyeol Input" }),
    );
    expect(
      screen.queryByRole("button", { name: "\uf69b 나" }),
    ).not.toBeInTheDocument();

    await user.keyboard("{ArrowLeft}");
    expect(
      screen.getByRole("button", { name: "\uf69b 나" }),
    ).toBeInTheDocument();
    await user.keyboard("{Home}");
    expect(
      screen.queryByRole("button", { name: "\uf69b 나" }),
    ).not.toBeInTheDocument();
  });

  it("uses the cursor after typing in the middle of the field", async () => {
    const user = userEvent.setup();
    render(<ControlledField initialValue="앞뒤" />);
    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.keyboard("{Home}{ArrowRight}na");
    await user.click(
      screen.getByRole("button", { name: "Toggle Gugyeol Input" }),
    );
    await user.click(screen.getByRole("button", { name: "\uf69b 나" }));
    expect(input).toHaveValue("앞\uf69b뒤");
  });

  it("numbers only the first nine suggestions in display order", async () => {
    const user = userEvent.setup();
    render(<ControlledField initialValue="k" />);
    await user.click(screen.getByRole("textbox"));
    await user.click(
      screen.getByRole("button", { name: "Toggle Gugyeol Input" }),
    );

    const buttons = within(screen.getByRole("table")).getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(9);
    buttons.forEach((button, index) => {
      if (index < 9) {
        expect(within(button).getByText(String(index + 1))).toBeVisible();
        expect(button).toHaveAttribute("aria-keyshortcuts", String(index + 1));
      } else {
        expect(button).not.toHaveAttribute("aria-keyshortcuts");
        expect(button.querySelector("kbd")).toBeNull();
      }
    });
  });

  it.each([
    ["1", "\uf696"],
    ["2", "\uf77c"],
    ["3", "\uf681"],
    ["4", "\uf686"],
    ["5", "\uf687"],
    ["6", "\uf690"],
    ["7", "\uf68c"],
    ["8", "\uf6ab"],
    ["9", "\uf779"],
  ])("selects suggestion %s with its number key", async (key, gugyeol) => {
    const user = userEvent.setup();
    render(<ControlledField initialValue="😀k뒤" />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    await user.click(input);
    fireEvent.select(input, {
      target: { selectionStart: 3, selectionEnd: 3 },
    });
    await user.click(
      screen.getByRole("button", { name: "Toggle Gugyeol Input" }),
    );
    await user.keyboard(key);

    expect(input).toHaveValue(`😀${gugyeol}뒤`);
    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(3);
  });

  it("types numbers normally when the suggestion list is closed", async () => {
    const user = userEvent.setup();
    render(<ControlledField initialValue="k" />);
    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.keyboard("1");
    expect(input).toHaveValue("k1");
  });

  it.each(["0", "9"])(
    "types %s normally when there is no corresponding suggestion",
    async (key) => {
      const user = userEvent.setup();
      render(<ControlledField initialValue="나" />);
      const input = screen.getByRole("textbox");
      await user.click(input);
      await user.click(
        screen.getByRole("button", { name: "Toggle Gugyeol Input" }),
      );
      await user.keyboard(key);
      expect(input).toHaveValue(`나${key}`);
    },
  );

  it.each([
    { isComposing: true },
    { keyCode: 229 },
    { ctrlKey: true },
    { altKey: true },
    { metaKey: true },
    { shiftKey: true },
  ])("does not intercept composition or modified keys: %j", async (flags) => {
    const user = userEvent.setup();
    render(<ControlledField initialValue="나" />);
    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.click(
      screen.getByRole("button", { name: "Toggle Gugyeol Input" }),
    );

    expect(fireEvent.keyDown(input, { key: "1", ...flags })).toBe(true);
    expect(input).toHaveValue("나");
  });

  it("preserves the parent's key handler and respects preventDefault", async () => {
    const user = userEvent.setup();
    const onKeyDown = jest.fn<React.KeyboardEventHandler>((event) => {
      if (event.key === "1") event.preventDefault();
    });
    render(<ControlledField initialValue="나" onKeyDown={onKeyDown} />);
    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.click(
      screen.getByRole("button", { name: "Toggle Gugyeol Input" }),
    );
    await user.keyboard("1{Enter}");

    expect(input).toHaveValue("나");
    expect(onKeyDown.mock.calls.map(([event]) => event.key)).toEqual([
      "1",
      "Enter",
    ]);
  });
});
