import { create } from "zustand";
import type { AppPhase, SubnetData } from "@/types";
import { MAX_SUBNETS } from "@/lib/constants";

interface UIState {
  phase: AppPhase;
  selectedSubnets: SubnetData[];
  focusedCar: number | null;
  userHasClicked: boolean;
  subnets: SubnetData[];
  setPhase: (phase: AppPhase) => void;
  setSubnets: (subnets: SubnetData[]) => void;
  toggleSubnet: (subnet: SubnetData) => void;
  setFocusedCar: (netuid: number | null) => void;
  setUserHasClicked: () => void;
  clearSelection: () => void;
  resetToSelection: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  phase: "loading",
  selectedSubnets: [],
  focusedCar: null,
  userHasClicked: false,
  subnets: [],

  setPhase: (phase) => set({ phase }),

  setSubnets: (subnets) => set({ subnets }),

  toggleSubnet: (subnet) =>
    set((state) => {
      const exists = state.selectedSubnets.some(
        (s) => s.netuid === subnet.netuid
      );
      if (exists) {
        return {
          selectedSubnets: state.selectedSubnets.filter(
            (s) => s.netuid !== subnet.netuid
          ),
        };
      }
      if (state.selectedSubnets.length >= MAX_SUBNETS) {
        return state;
      }
      return { selectedSubnets: [...state.selectedSubnets, subnet] };
    }),

  setFocusedCar: (netuid) => set({ focusedCar: netuid }),

  setUserHasClicked: () => set({ userHasClicked: true }),

  clearSelection: () => set({ selectedSubnets: [] }),

  resetToSelection: () => set({ phase: "selection", focusedCar: null, userHasClicked: false }),
}));
