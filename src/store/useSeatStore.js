// src/store/useSeatStore.js
'use client';
import { create } from 'zustand';

const initialSeats = [
  { id: 'S-01', side: 'North Side • Seat 1', irDistance: 36, pressureWeight: 64, noiseDb: 38 },
  { id: 'S-02', side: 'North Side • Seat 2', irDistance: 145, pressureWeight: 0, noiseDb: 34 },
  { id: 'S-03', side: 'North Side • Seat 3', irDistance: 132, pressureWeight: 8, noiseDb: 35 },
  { id: 'S-04', side: 'South Side • Seat 4', irDistance: 42, pressureWeight: 58, noiseDb: 40 },
  { id: 'S-05', side: 'South Side • Seat 5', irDistance: 150, pressureWeight: 0, noiseDb: 33 },
  { id: 'S-06', side: 'South Side • Seat 6', irDistance: 39, pressureWeight: 71, noiseDb: 39 },
];

export const computeNodeStatus = (ir, weight) => {
  if (weight >= 25 && ir <= 65) return 'Occupied';
  if (weight >= 3 && ir > 65) return 'Bag Hogging';
  return 'Vacant';
};

export const useSeatStore = create((set, get) => ({
  seats: initialSeats,
  selectedSeatId: 'S-01',
  workspaceMode: 'table', // 'table' | 'workbench'

  setSelectedSeat: (id) => set({ selectedSeatId: id }),
  setWorkspaceMode: (mode) => set({ workspaceMode: mode }),

  updateActiveSeatHardware: (updates) => {
    set((state) => {
      const nextSeats = state.seats.map((s) =>
        s.id === state.selectedSeatId ? { ...s, ...updates } : s
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem('seatfi_live_state_v2', JSON.stringify(nextSeats));
      }
      return { seats: nextSeats };
    });
  },

  applyPreset: (preset) => {
    if (preset === 'vacant') get().updateActiveSeatHardware({ irDistance: 150, pressureWeight: 0, noiseDb: 33 });
    if (preset === 'studying') get().updateActiveSeatHardware({ irDistance: 36, pressureWeight: 65, noiseDb: 38 });
    if (preset === 'hogging') get().updateActiveSeatHardware({ irDistance: 135, pressureWeight: 8, noiseDb: 35 });
  },

  syncFromStorage: (externalSeats) => set({ seats: externalSeats }),
}));