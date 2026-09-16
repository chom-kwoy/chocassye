import { describe, expect, it } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import TextFieldWithGugyeol from "./TextFieldWithGugyeol";

// SWC hoists mocks made with the Jest global.
declare const jest: typeof import("@jest/globals").jest;

jest.mock("./TranslationProvider", () => ({
  useTranslation: () => ({ t: (text: string) => text }),
}));

function ControlledField({ initialValue }: { initialValue: string }) {
  const [value, setValue] = React.useState(initialValue);
  return (
    <TextFieldWithGugyeol
      label="Search"
      value={value}
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
});
