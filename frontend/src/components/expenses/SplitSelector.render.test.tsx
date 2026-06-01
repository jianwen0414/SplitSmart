import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SplitSelector } from "./SplitSelector";
import type { Member } from "@/lib/types";

const members: Member[] = [
  { user_id: "a", display_name: "Amir" } as Member,
  { user_id: "b", display_name: "Priya" } as Member,
];

describe("<SplitSelector />", () => {
  it("renders a checkbox per member and toggles selection", () => {
    const setSelected = vi.fn();
    render(
      <SplitSelector
        members={members}
        splitType="equal"
        totalAmount={100}
        selected={{ a: true }}
        setSelected={setSelected}
        exactAmounts={{}}
        setExactAmounts={() => {}}
        percentages={{}}
        setPercentages={() => {}}
      />
    );

    expect(screen.getByText("Amir")).toBeInTheDocument();
    expect(screen.getByText("Priya")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Priya"));
    expect(setSelected).toHaveBeenCalledWith({ a: true, b: true });
  });
});
