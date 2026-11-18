// src/store/useSeatStore.js
'use client';
import { create } from 'zustand';

const initialSeats = [
  {
    id: 'S-01',
    side: 'North Side • Seat 1',
    zone: 'Silent Zone',
    maxDb: 50,
    irDistance: 36,
    pressureWeight: 64,
    noiseDb: 38,
    prebookedUntil: null,
    bookedBy: null,
    bookedByName: null,
    hoggingSince: null,
    flaggedForRemoval: false,
  },
  {
    id: 'S-02',
    side: 'North Side • Seat 2',
    zone: 'Silent Zone',
    maxDb: 50,
    irDistance: 145,
    pressureWeight: 0,
    noiseDb: 34,
    prebookedUntil: null,
    bookedBy: null,
    bookedByName: null,
    hoggingSince: null,
    flaggedForRemoval: false,
  },
  {
    id: 'S-03',
    side: 'North Side • Seat 3',
    zone: 'Silent Zone',
    maxDb: 50,
    irDistance: 132,
    pressureWeight: 8,
    noiseDb: 35,
    prebookedUntil: null,
    bookedBy: null,
    bookedByName: null,
    hoggingSince: Date.now() - 4 * 60 * 1000,
    flaggedForRemoval: false,
  },
  {
    id: 'S-04',
    side: 'South Side • Seat 4',
    zone: 'Collab Zone',
    maxDb: 70,
    irDistance: 42,
    pressureWeight: 58,
    noiseDb: 54,
    prebookedUntil: null,
    bookedBy: null,
    bookedByName: null,
    hoggingSince: null,
    flaggedForRemoval: false,
  },
  {
    id: 'S-05',
    side: 'South Side • Seat 5',
    zone: 'Collab Zone',
    maxDb: 70,
    irDistance: 150,
    pressureWeight: 0,
    noiseDb: 39,
    prebookedUntil: null,
    bookedBy: null,
    bookedByName: null,
    hoggingSince: null,
    flaggedForRemoval: false,
  },
  {
    id: 'S-06',
    side: 'South Side • Seat 6',
    zone: 'Collab Zone',
    maxDb: 70,
    irDistance: 39,
    pressureWeight: 71,
    noiseDb: 48,
    prebookedUntil: null,
    bookedBy: null,
    bookedByName: null,
    hoggingSince: null,
    flaggedForRemoval: false,
  },
];

export const computeNodeStatus = (ir, weight, prebookedUntil) => {
  if (weight >= 25 && ir <= 65) return 'Occupied';
  if (weight >= 3 && ir > 65) return 'Bag Hogging';
  if (prebookedUntil && prebookedUntil > Date.now()) return 'Pre-booked';
  return 'Vacant';
};

export const isNoiseViolation = (seat) => {
  return seat.noiseDb > (seat.maxDb || 55);
};

const saveStateToStorage = (seats) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('seatfi_live_state_v4', JSON.stringify(seats));
  }
};

export const useSeatStore = create((set, get) => ({
  seats: initialSeats,
  selectedSeatId: 'S-01',
  workspaceMode: 'table', // 'table' | 'workbench'
  portalFilter: 'ALL', // 'ALL' | 'VACANT' | 'SILENT' | 'COLLAB'
  lastActionId: null,

  // Authenticated Student Session
  currentUser: null, // { regNo, name, department, role }

  loginUser: (userObj) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('seatfi_auth_user', JSON.stringify(userObj));
    }
    set({ currentUser: userObj });
  },

  logoutUser: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('seatfi_auth_user');
    }
    set({ currentUser: null });
  },

  hydrateAuth: () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('seatfi_auth_user');
      if (saved) {
        try {
          set({ currentUser: JSON.parse(saved) });
        } catch (e) {}
      }
    }
  },

  setSelectedSeat: (id) => set({ selectedSeatId: id, lastActionId: id }),
  setWorkspaceMode: (mode) => set({ workspaceMode: mode }),
  setPortalFilter: (filter) => set({ portalFilter: filter }),

  updateActiveSeatHardware: (updates) => {
    set((state) => {
      const nextSeats = state.seats.map((s) => {
        if (s.id !== state.selectedSeatId) return s;
        const merged = { ...s, ...updates };
        const status = computeNodeStatus(merged.irDistance, merged.pressureWeight, merged.prebookedUntil);

        if (status === 'Occupied') {
          merged.prebookedUntil = null;
          merged.hoggingSince = null;
          merged.flaggedForRemoval = false;
        } else if (status === 'Bag Hogging') {
          if (!merged.hoggingSince) merged.hoggingSince = Date.now();
        } else {
          merged.hoggingSince = null;
          merged.flaggedForRemoval = false;
        }
        return merged;
      });
      saveStateToStorage(nextSeats);
      return { seats: nextSeats };
    });
  },

  bookSeat: (id, minutes = 5, studentReg = '12409821', studentName = 'Nikhil') => {
    set((state) => {
      const nextSeats = state.seats.map((s) =>
        s.id === id
          ? {
              ...s,
              irDistance: 150,
              pressureWeight: 0,
              prebookedUntil: Date.now() + minutes * 60 * 1000,
              bookedBy: studentReg,
              bookedByName: studentName,
              hoggingSince: null,
              flaggedForRemoval: false,
            }
          : s
      );
      saveStateToStorage(nextSeats);
      return { seats: nextSeats, lastActionId: id };
    });
  },

  cancelBooking: (id) => {
    set((state) => {
      const nextSeats = state.seats.map((s) =>
        s.id === id ? { ...s, prebookedUntil: null, bookedBy: null, bookedByName: null } : s
      );
      saveStateToStorage(nextSeats);
      return { seats: nextSeats, lastActionId: id };
    });
  },

  confirmArrivalAndSit: (id) => {
    set((state) => {
      const nextSeats = state.seats.map((s) =>
        s.id === id
          ? {
              ...s,
              irDistance: 38,
              pressureWeight: 64,
              prebookedUntil: null,
              hoggingSince: null,
              flaggedForRemoval: false,
            }
          : s
      );
      saveStateToStorage(nextSeats);
      return { seats: nextSeats, selectedSeatId: id, lastActionId: id };
    });
  },

  flagBagHogging: (id) => {
    set((state) => {
      const nextSeats = state.seats.map((s) =>
        s.id === id ? { ...s, flaggedForRemoval: true } : s
      );
      saveStateToStorage(nextSeats);
      return { seats: nextSeats, lastActionId: id };
    });
  },

  applyPreset: (preset) => {
    if (preset === 'vacant') {
      get().updateActiveSeatHardware({
        irDistance: 150,
        pressureWeight: 0,
        noiseDb: 33,
        prebookedUntil: null,
        bookedBy: null,
        bookedByName: null,
        hoggingSince: null,
        flaggedForRemoval: false,
      });
    }
    if (preset === 'studying') {
      get().updateActiveSeatHardware({
        irDistance: 36,
        pressureWeight: 65,
        noiseDb: 38,
        prebookedUntil: null,
        hoggingSince: null,
      });
    }
    if (preset === 'hogging') {
      get().updateActiveSeatHardware({
        irDistance: 135,
        pressureWeight: 8,
        noiseDb: 35,
        prebookedUntil: null,
        hoggingSince: Date.now(),
      });
    }
    if (preset === 'prebook') {
      get().bookSeat(get().selectedSeatId, 5, '12409821', 'Nikhil');
    }
  },

  syncFromStorage: (externalSeats) => set({ seats: externalSeats }),
}));