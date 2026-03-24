import { createContext, useContext } from "react";

export type ScoutingLayoutContextValue = {
  resolvedCycleId: string | undefined;
  changeCycle: (cycleId: string) => void;
};

const ScoutingLayoutContext = createContext<ScoutingLayoutContextValue | null>(null);

export function ScoutingLayoutProvider({
  value,
  children,
}: {
  value: ScoutingLayoutContextValue;
  children: React.ReactNode;
}) {
  return (
    <ScoutingLayoutContext.Provider value={value}>{children}</ScoutingLayoutContext.Provider>
  );
}

export function useScoutingLayout() {
  const ctx = useContext(ScoutingLayoutContext);
  if (!ctx) {
    throw new Error("useScoutingLayout must be used within the scouting section layout");
  }
  return ctx;
}
