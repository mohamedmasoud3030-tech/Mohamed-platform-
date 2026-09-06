// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { PreferencesProvider } from "@/providers/preferences";
import { SignalRuntimeProvider } from "@/features/world/signals";
import WorldCommand from "./WorldCommand";

afterEach(() => cleanup());

function renderCommand(locale: "ar" | "en" = "en") {
  const router = createMemoryRouter(
    [{ path: "/world/command", element: <WorldCommand /> }],
    { initialEntries: ["/world/command"] },
  );
  render(
    <PreferencesProvider initialLocale={locale}>
      <SignalRuntimeProvider>
        <RouterProvider router={router} />
      </SignalRuntimeProvider>
    </PreferencesProvider>,
  );
}

describe("World Command unavailable source", () => {
  it("states that live product signals are not connected without fabricating a pulse", () => {
    renderCommand();
    const command = screen.getByTestId("world-command");
    expect(command.getAttribute("data-signal-availability")).toBe("unavailable");
    expect(command.getAttribute("data-graph-available")).toBe("true");
    expect(command.getAttribute("data-core-state")).toBeTruthy();
    expect(screen.getByText("Live product signals are not connected yet.")).toBeTruthy();
    expect(command.textContent).not.toContain("active worlds");
    expect(command.textContent).not.toContain("attention pressure");
    expect(command.querySelector("button")).toBeNull();
  });

  it("keeps the unavailable message bilingual", () => {
    renderCommand("ar");
    const command = screen.getByTestId("world-command");
    expect(screen.getByText("الإشارات الحية للمنتجات غير متصلة بعد.")).toBeTruthy();
    expect(command.textContent).not.toContain("عوالم نشطة");
    expect(command.textContent).not.toContain("ضغط الانتباه");
  });
});
