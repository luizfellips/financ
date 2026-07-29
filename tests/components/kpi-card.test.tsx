import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KpiCard } from "@/components/shared/kpi-card";
import { Wallet } from "lucide-react";

describe("KpiCard", () => {
  it("renders title and formatted value", async () => {
    render(
      <KpiCard
        title="Saldo atual"
        value={1500}
        icon={Wallet}
        trend={{ value: 5, label: "vs mês anterior" }}
      />,
    );

    expect(screen.getByText("Saldo atual")).toBeInTheDocument();
    expect(await screen.findByText(/R\$/)).toBeInTheDocument();
  });
});
