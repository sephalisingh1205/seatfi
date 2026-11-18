// src/store/useSeatStore.js
'use client';
import { create } from 'zustand';

export const STUDENT_DIRECTORY = {
  '12512683': {
    regNo: '12512683',
    name: 'Nikhil',
    department: 'B.Tech CSE',
    role: 'Student',
  },
  '12522159': {
    regNo: '12522159',
    name: 'Sephali Singh',
    department: 'B.Tech CSE (AI & ML)',
    role: 'Student',
  },
};

const initialSeats = [
  {
    id: 'S-01',
    side: 'North Row • Seat 01',
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
    side: 'North Row • Seat 02',
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
    side: 'North Row • Seat 03',
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
    side: 'South Row • Seat 04',
    zone: 'Collab Zone',
    maxDb: 70,
    irDistance: 42,
    pressureWeight: 58,
    noiseDb: 52,
    prebookedUntil: null,
    bookedBy: null,
    bookedByName: null,
    hoggingSince: null,
    flaggedForRemoval: false,
  },
  {
    id: 'S-05',
    side: 'South Row • Seat 05',
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
    side: 'South Row • Seat 06',
    zone: 'Collab Zone',
    maxDb: 70,
    irDistance: 148,
    pressureWeight: 0,
    noiseDb: 41,
    prebookedUntil: null,
    bookedBy: null,
    bookedByName: null,
    hoggingSince: null,
    flaggedForRemoval: false,
  },
];

const initialLogs = [
  { id: 'log-1', time: 'Live', text: 'ESP32-WROOM-32 6-Node Telemetry Bus Initialized' },
  { id: 'log-2', time: 'Live', text: 'Chair S-03 flagged for unattended bag load (8kg, IR 132cm)' },
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
    localStorage.setItem('seatfi_live_state_v5', JSON.stringify(seats));
  }
};

const stampTime = () => {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const useSeatStore = create((set, get) => ({
  seats: initialSeats,
  selectedSeatId: 'S-01',
  workspaceMode: 'table', // 'table' | 'workbench'
  portalFilter: 'ALL', // 'ALL' | 'VACANT' | 'SILENT' | 'COLLAB'
  liveSimulationEnabled: true,
  activityLogs: initialLogs,
  currentUser: null,

  addLog: (text) =>
    set((state) => ({
      activityLogs: [
        { id: `${Date.now()}-${Math.random()}`, time: stampTime(), text },
        ...state.activityLogs.slice(0, 14),
      ],
    })),

  loginUser: (userObj) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('seatfi_auth_user_v5', JSON.stringify(userObj));
    }
    set({ currentUser: userObj });
    get().addLog(`${userObj.name} (${userObj.regNo}) authenticated on Student Portal`);
  },

  logoutUser: () => {
    const u = get().currentUser;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('seatfi_auth_user_v5');
    }
    set({ currentUser: null });
    if (u) get().addLog(`${u.name} (${u.regNo}) signed out`);
  },

  hydrateAuth: () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('seatfi_auth_user_v5');
      if (saved) {
        try {
          set({ currentUser: JSON.parse(saved) });
        } catch (e) {}
      }
    }
  },

  setSelectedSeat: (id) => set({ selectedSeatId: id }),
  setWorkspaceMode: (mode) => set({ workspaceMode: mode }),
  setPortalFilter: (filter) => set({ portalFilter: filter }),
  toggleLiveSimulation: () =>
    set((state) => ({ liveSimulationEnabled: !state.liveSimulationEnabled })),

  // Realistic Micro-Jitter for Live Hardware Telemetry
  pulseLiveTelemetry: () => {
    if (!get().liveSimulationEnabled) return;
    set((state) => {
      const nextSeats = state.seats.map((s) => {
        const st = computeNodeStatus(s.irDistance, s.pressureWeight, s.prebookedUntil);
        const dIr = Math.floor(Math.random() * 3) - 1; // -1, 0, +1 cm
        const dDb = Math.floor(Math.random() * 3) - 1; // -1, 0, +1 dB
        let nextIr = s.irDistance;
        let nextWeight = s.pressureWeight;

        if (st === 'Occupied') {
          nextIr = Math.min(58, Math.max(28, s.irDistance + dIr));
          nextWeight = Math.min(85, Math.max(48, s.pressureWeight + (Math.random() > 0.7 ? dIr : 0)));
        } else if (st === 'Vacant' || st === 'Pre-booked') {
          nextIr = Math.min(165, Math.max(135, s.irDistance + dIr));
          nextWeight = 0;
        }
        const nextDb = Math.min(68, Math.max(30, s.noiseDb + dDb));
        return { ...s, irDistance: nextIr, pressureWeight: nextWeight, noiseDb: nextDb };
      });
      return { seats: nextSeats };
    });
  },

  // Shuffle All 6 Seats with Realistic Scenarios
  shuffleSeats: () => {
    const scenarios = [
      { irDistance: 150, pressureWeight: 0, noiseDb: 33, prebookedUntil: null, bookedBy: null, bookedByName: null },
      { irDistance: 37, pressureWeight: 64, noiseDb: 39, prebookedUntil: null, bookedBy: null, bookedByName: null },
      { irDistance: 138, pressureWeight: 9, noiseDb: 36, prebookedUntil: null, bookedBy: null, bookedByName: null },
      { irDistance: 146, pressureWeight: 0, noiseDb: 34, prebookedUntil: null, bookedBy: null, bookedByName: null },
      { irDistance: 41, pressureWeight: 70, noiseDb: 46, prebookedUntil: null, bookedBy: null, bookedByName: null },
      { irDistance: 152, pressureWeight: 0, noiseDb: 35, prebookedUntil: null, bookedBy: null, bookedByName: null },
    ];

    set((state) => {
      const nextSeats = state.seats.map((s) => {
        // Keep current user's active pre-booked hold intact if they have one
        if (s.prebookedUntil && s.prebookedUntil > Date.now()) return s;
        const pick = scenarios[Math.floor(Math.random() * scenarios.length)];
        return {
          ...s,
          irDistance: pick.irDistance + Math.floor(Math.random() * 5),
          pressureWeight: pick.pressureWeight,
          noiseDb: pick.noiseDb,
          prebookedUntil: null,
          bookedBy: null,
          bookedByName: null,
          flaggedForRemoval: false,
        };
      });
      saveStateToStorage(nextSeats);
      return { seats: nextSeats };
    });
    get().addLog('Simulated crowd shuffle executed across all 6 ESP32 seat nodes');
  },

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

  bookSeat: (id, minutes = 5, studentReg = '12512683', studentName = 'Nikhil') => {
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
      return { seats: nextSeats };
    });
    get().addLog(`Seat ${id} pre-booked for ${minutes}m by ${studentName} (${studentReg})`);
  },

  cancelBooking: (id) => {
    set((state) => {
      const nextSeats = state.seats.map((s) =>
        s.id === id ? { ...s, prebookedUntil: null, bookedBy: null, bookedByName: null } : s
      );
      saveStateToStorage(nextSeats);
      return { seats: nextSeats };
    });
    get().addLog(`Pre-booking hold released on Seat ${id}`);
  },

  confirmArrivalAndSit: (id) => {
    set((state) => {
      const nextSeats = state.seats.map((s) =>
        s.id === id
          ? {
              ...s,
              irDistance: 36,
              pressureWeight: 64,
              prebookedUntil: null,
              hoggingSince: null,
              flaggedForRemoval: false,
            }
          : s
      );
      saveStateToStorage(nextSeats);
      return { seats: nextSeats, selectedSeatId: id };
    });
    get().addLog(`Physical check-in verified on Seat ${id} (IR: 36cm, FSR: 64kg)`);
  },

  evacuateSeat: (id) => {
    set((state) => {
      const nextSeats = state.seats.map((s) =>
        s.id === id
          ? {
              ...s,
              irDistance: 150,
              pressureWeight: 0,
              prebookedUntil: null,
              bookedBy: null,
              bookedByName: null,
              hoggingSince: null,
              flaggedForRemoval: false,
            }
          : s
      );
      saveStateToStorage(nextSeats);
      return { seats: nextSeats };
    });
    get().addLog(`Seat ${id} vacated and reset to Vacant`);
  },

  flagBagHogging: (id) => {
    set((state) => {
      const nextSeats = state.seats.map((s) =>
        s.id === id ? { ...s, flaggedForRemoval: true } : s
      );
      saveStateToStorage(nextSeats);
      return { seats: nextSeats };
    });
    get().addLog(`Attendant notified to clear unattended bag at Seat ${id}`);
  },

  applyPreset: (preset) => {
    const activeId = get().selectedSeatId;
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
      get().addLog(`Node ${activeId} set to Vacant preset`);
    }
    if (preset === 'studying') {
      get().updateActiveSeatHardware({
        irDistance: 36,
        pressureWeight: 65,
        noiseDb: 38,
        prebookedUntil: null,
        hoggingSince: null,
      });
      get().addLog(`Node ${activeId} set to Studying preset (65kg, 36cm)`);
    }
    if (preset === 'hogging') {
      get().updateActiveSeatHardware({
        irDistance: 135,
        pressureWeight: 8,
        noiseDb: 35,
        prebookedUntil: null,
        hoggingSince: Date.now(),
      });
      get().addLog(`Node ${activeId} set to Bag Hogging preset (8kg, 135cm)`);
    }
    if (preset === 'prebook') {
      get().bookSeat(activeId, 5, '12512683', 'Nikhil');
    }
  },

  syncFromStorage: (externalSeats) => set({ seats: externalSeats }),
}));