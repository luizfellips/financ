import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TransactionFiltersBar } from "@/features/transactions/components/transaction-filters";

vi.mock("@/hooks/use-categories", () => ({
  useCategories: () => ({
    data: [
      { id: "cat1", name: "Alimentação", type: "EXPENSE", color: "#f00", icon: "Utensils" },
      { id: "cat2", name: "Salário", type: "INCOME", color: "#0f0", icon: "Briefcase" },
    ],
    isLoading: false,
  }),
}));

describe("TransactionFiltersBar", () => {
  it("renders search and type controls", async () => {
    const onChange = vi.fn();
    render(
      <TransactionFiltersBar
        value={{
          search: "",
          type: "ALL",
          categoryId: undefined,
          month: undefined,
          year: undefined,
          recurring: "all",
          page: 1,
          pageSize: 20,
          sortBy: "date",
          sortOrder: "desc",
        }}
        onChange={onChange}
      />,
    );

    const [search] = screen.getAllByPlaceholderText(/buscar/i);
    await userEvent.type(search, "aluguel");
    expect(onChange).toHaveBeenCalled();
  });
});
