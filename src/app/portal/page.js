// src/app/portal/page.js
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  useSeatStore,
  computeNodeStatus,
  isNoiseViolation,
  STUDENT_DIRECTORY,
} from '@/store/useSeatStore';
import {
  Smartphone,
  ArrowLeft,
  Wifi,
  Clock,
  CheckCircle2,
  Sparkles,
  Volume2,
  ShieldAlert,
  UserCheck,
  Filter,
  Lock,
  User,
  LogOut,
  KeyRound,
  GraduationCap,
  ArrowRight,
  Activity,
  Shuffle,
  Radio,
  Award,
  Timer,
  QrCode,
  RotateCcw,
} from 'lucide-react';

function RunningTimerBadge({ targetTime }) {
  const [rem, setRem] = useState(Math.max(0, targetTime - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setRem(Math.max(0, targetTime - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [targetTime]);

  const mins = Math.floor(rem / 60000);
  const secs = Math.floor((rem % 60000) / 1000);

  return (
    <span className="font-mono font-bold text-xs tabular-nums">
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  );
}

export default function StudentMobilePortal() {
  const {
    seats,
    syncFromStorage,
    bookSeat,
    cancelBooking,
    confirmArrivalAndSit,
    evacuateSeat,
    flagBagHogging,
    portalFilter,
    setPortalFilter,
    currentUser,
    loginUser,
    logoutUser,
    hydrateAuth,
    shuffleSeats,
    liveSimulationEnabled,
    toggleLiveSimulation,
    pulseLiveTelemetry,
    activityLogs,
  } = useSeatStore();

  // Boot Loading Screen State
  const [bootLoading, setBootLoading] = useState(true);
  const [bootProgress, setBootProgress] = useState(18);
  const [bootStepText, setBootStepText] = useState('Initializing ESP32-WROOM-32 Telemetry Bus...');

  // Login Form States (Default to Nikhil 12512683)
  const [regInput, setRegInput] = useState('12512683');
  const [nameInput, setNameInput] = useState('Nikhil');
  const [deptInput, setDeptInput] = useState('B.Tech CSE');
  const [passInput, setPassInput] = useState('••••••••');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginStageText, setLoginStageText] = useState('');

  // Interactive Click & Study Session States
  const [clickedCardId, setClickedCardId] = useState(null);
  const [bannerMsg, setBannerMsg] = useState('');
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [, setTick] = useState(0);

  // Boot Screen Sequence
  useEffect(() => {
    const t1 = setTimeout(() => {
      setBootProgress(58);
      setBootStepText('Calibrating 6 IR Proximity & FSR Pressure Sensors...');
    }, 380);
    const t2 = setTimeout(() => {
      setBootProgress(92);
      setBootStepText('Synchronizing Live Seat Map & Reservation Engine...');
    }, 760);
    const t3 = setTimeout(() => {
      setBootProgress(100);
      setBootLoading(false);
    }, 1100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Hydrate Auth + Live 1s Clock + Live Sensor Jitter
  useEffect(() => {
    hydrateAuth();
    const clockTimer = setInterval(() => setTick((t) => t + 1), 1000);
    const simTimer = setInterval(() => pulseLiveTelemetry(), 2400);
    return () => {
      clearInterval(clockTimer);
      clearInterval(simTimer);
    };
  }, [hydrateAuth, pulseLiveTelemetry]);

  // Pomodoro Countdown
  useEffect(() => {
    if (!pomodoroRunning) return;
    const pTimer = setInterval(() => {
      setPomodoroSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(pTimer);
  }, [pomodoroRunning]);

  // Cross-Tab Storage Listener
  useEffect(() => {
    const cached = localStorage.getItem('seatfi_live_state_v5');
    if (cached) syncFromStorage(JSON.parse(cached));

    const handleStorage = (e) => {
      if (e.key === 'seatfi_live_state_v5' && e.newValue) {
        syncFromStorage(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [syncFromStorage]);

  // Auto-fill student details when typing 12512683 (Nikhil) or 12522159 (Sephali Singh)
  const handleRegChange = (val) => {
    const clean = val.trim();
    setRegInput(clean);
    if (STUDENT_DIRECTORY[clean]) {
      setNameInput(STUDENT_DIRECTORY[clean].name);
      setDeptInput(STUDENT_DIRECTORY[clean].department);
    }
  };

  // Toggle between Nikhil (12512683) and Sephali Singh (12522159)
  const handleSwitchVerifiedId = () => {
    const nextReg = regInput === '12512683' ? '12522159' : '12512683';
    handleRegChange(nextReg);
  };

  const triggerCardRipple = (id) => {
    setClickedCardId(id);
    setTimeout(() => setClickedCardId(null), 350);
  };

  const handleAnimatedLogin = (e) => {
    e.preventDefault();
    if (!regInput.trim()) return;
    setIsLoggingIn(true);
    setLoginStageText(`Authenticating University ID ${regInput}...`);
    setTimeout(() => {
      setLoginStageText('Establishing Real-Time Link with ESP32 Bus...');
    }, 400);
    setTimeout(() => {
      loginUser({
        regNo: regInput.trim(),
        name: nameInput.trim() || 'Student',
        department: deptInput.trim() || 'B.Tech CSE',
        role: 'Student',
      });
      setIsLoggingIn(false);
      setBannerMsg(
        `Signed in as ${nameInput} (${regInput}). Select any vacant seat to lock a 5-minute hold.`
      );
    }, 850);
  };

  const handleAutoFindSeat = (preferredZone) => {
    const candidate = seats.find((s) => {
      const st = computeNodeStatus(s.irDistance, s.pressureWeight, s.prebookedUntil);
      return st === 'Vacant' && (!preferredZone || s.zone === preferredZone);
    });
    if (!candidate) {
      setBannerMsg(`All seats in ${preferredZone} are currently occupied or held. Click "Shuffle Seats" to free up spaces.`);
      return;
    }
    triggerCardRipple(candidate.id);
    bookSeat(
      candidate.id,
      5,
      currentUser?.regNo || '12512683',
      currentUser?.name || 'Nikhil'
    );
    setBannerMsg(
      `Seat ${candidate.id} (${candidate.zone}) locked for 5 minutes under ${currentUser?.name} (${currentUser?.regNo}).`
    );
  };

  const matchesFilter = (seat) => {
    const st = computeNodeStatus(seat.irDistance, seat.pressureWeight, seat.prebookedUntil);
    if (st === 'Pre-booked') return true;
    if (portalFilter === 'VACANT') return st === 'Vacant';
    if (portalFilter === 'SILENT') return seat.zone === 'Silent Zone';
    if (portalFilter === 'COLLAB') return seat.zone === 'Collab Zone';
    return true;
  };

  // ============================================================================
  // VIEW 0: PROFESSIONAL SYSTEM INITIALIZATION LOADING SCREEN
  // ============================================================================
  if (bootLoading) {
    return (
      <div
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        className="min-h-screen w-full bg-slate-900 text-white flex flex-col items-center justify-center p-6 select-none"
      >
        <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-700 text-white flex items-center justify-center mx-auto shadow-md">
            <Radio size={28} className="animate-pulse" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              SEATFI <span className="font-normal italic text-slate-400">// Smart Library IoT</span>
            </h1>
            <p className="text-xs italic text-slate-400 mt-1">{bootStepText}</p>
          </div>

          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-700">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${bootProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>ESP32-WROOM-32 BUS</span>
            <span className="font-bold text-emerald-400">{bootProgress}%</span>
          </div>

          <div className="pt-3 border-t border-slate-700/80 text-xs italic text-slate-300">
            Developed by <strong className="font-bold not-italic text-white">Sephali Singh</strong>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 1: PROFESSIONAL SOLID-UI LOGIN PAGE (NO DEMO PROFILE PILLS, NO GRADIENTS)
  // ============================================================================
  if (!currentUser) {
    return (
      <div
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        className="min-h-screen w-full relative overflow-hidden bg-slate-100 flex flex-col justify-between p-6 select-none"
      >
        {/* Subtle Live Ambient Orbs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="animate-orb-slow absolute -top-24 -left-24 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl" />
          <div className="animate-orb-slow absolute bottom-10 -right-24 w-96 h-96 bg-slate-300/50 rounded-full blur-3xl" />
        </div>

        <div className="my-auto relative z-10 w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl border border-slate-300 shadow-xl overflow-hidden">
          {/* Left 5 Columns: Solid Dark Slate Corporate Panel */}
          <div className="md:col-span-5 bg-slate-900 text-white p-8 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-[11px] font-bold italic text-emerald-400 mb-6">
                <Wifi size={12} /> 6-Node ESP32 Mesh Active
              </div>

              <h1 className="text-3xl font-bold tracking-tight">
                SEATFI <span className="font-normal italic text-slate-400">Portal</span>
              </h1>
              <p className="text-xs italic text-slate-300 mt-2 leading-relaxed">
                Real-Time Library Seat Occupancy, 5-Minute Express Pre-Booking & Dual-Sensor Anti-Hogging System.
              </p>
            </div>

            <div className="space-y-3 my-8">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Verified University IDs</span>
                  <span className="text-blue-400 italic">UMS Sync</span>
                </div>
                <p className="text-[11px] italic text-slate-300 mt-1">
                  • <strong>12512683</strong> — Nikhil (B.Tech CSE)
                </p>
                <p className="text-[11px] italic text-slate-300">
                  • <strong>12522159</strong> — Sephali Singh (B.Tech CSE)
                </p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>5-Minute Pre-Booking Lock</span>
                  <span className="text-emerald-400 italic">Instant Hold</span>
                </div>
                <p className="text-[11px] italic text-slate-300 mt-1">
                  Reserve any vacant library chair up to 5 minutes before arriving at the reading hall.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-[11px] italic text-slate-400">
              <span>Developed by <strong className="text-white not-italic">Sephali Singh</strong></span>
              <Link href="/" className="text-blue-400 hover:text-white font-bold not-italic">
                ← Kiosk View
              </Link>
            </div>
          </div>

          {/* Right 7 Columns: Solid Clean Authentication Form */}
          <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">University Portal Sign In</h2>
                  <p className="text-xs italic text-slate-500 mt-0.5">
                    Enter your Registration Number (<strong>12512683</strong> or <strong>12522159</strong>)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchVerifiedId}
                  className="btn-press flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-2 rounded-xl cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Switch ID ({regInput === '12512683' ? '12522159' : '12512683'})</span>
                </button>
              </div>

              <form onSubmit={handleAnimatedLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    University Registration Number <span className="font-normal italic text-slate-500">(UMS ID)</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regInput}
                      onChange={(e) => handleRegChange(e.target.value)}
                      placeholder="12512683 or 12522159"
                      className="w-full pl-10 pr-4 py-2.5 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-700 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Student Name
                    </label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-700 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department / Program
                    </label>
                    <input
                      type="text"
                      required
                      value={deptInput}
                      onChange={(e) => setDeptInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-bold italic text-slate-700 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-700 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    UMS Password / Security PIN
                  </label>
                  <div className="relative">
                    <KeyRound size={15} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={passInput}
                      onChange={(e) => setPassInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-700 focus:bg-white transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="btn-press w-full mt-2 bg-slate-900 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isLoggingIn ? (
                    <>
                      <Activity size={16} className="animate-spin" />
                      <span className="italic text-xs">{loginStageText}</span>
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>Sign In & Open Live Seat Map</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] italic text-slate-500">
              <span>SEATFI Smart Library System</span>
              <span>Developed by <strong className="font-bold not-italic text-slate-900">Sephali Singh</strong></span>
            </div>
          </div>
        </div>

        {/* Bottom Attribution Bar */}
        <footer className="relative z-10 text-center text-xs italic text-slate-500 py-2">
          SEATFI IoT Project • Developed by <strong className="font-bold not-italic text-slate-800">Sephali Singh</strong> (Reg: 12522159) & Team
        </footer>
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: AUTHENTICATED STUDENT PORTAL (NO TABLE BLOCK IN BETWEEN, SOLID BUTTONS)
  // ============================================================================
  const counts = seats.reduce(
    (acc, s) => {
      const st = computeNodeStatus(s.irDistance, s.pressureWeight, s.prebookedUntil);
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    },
    { Vacant: 0, 'Pre-booked': 0, Occupied: 0, 'Bag Hogging': 0 }
  );

  const myActiveSeat = seats.find(
    (s) =>
      s.bookedBy === currentUser.regNo &&
      computeNodeStatus(s.irDistance, s.pressureWeight, s.prebookedUntil) === 'Pre-booked'
  );

  const chairCardStyle = (status, loud) => {
    if (loud) return 'bg-red-50 text-red-950 border-red-400';
    if (status === 'Occupied') return 'bg-rose-50/90 text-rose-950 border-rose-300';
    if (status === 'Bag Hogging') return 'bg-amber-50/90 text-amber-950 border-amber-300';
    if (status === 'Pre-booked')
      return 'bg-violet-50 text-violet-950 border-violet-500 ring-2 ring-violet-500/30 shadow-md';
    return 'bg-emerald-50/90 text-emerald-950 border-emerald-300 hover:border-emerald-500';
  };

  const formatPomodoro = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderChairCard = (seat) => {
    const status = computeNodeStatus(seat.irDistance, seat.pressureWeight, seat.prebookedUntil);
    const loud = isNoiseViolation(seat);
    const visibleByFilter = matchesFilter(seat);
    const isClicked = clickedCardId === seat.id;

    return (
      <div
        key={seat.id}
        onClick={() => triggerCardRipple(seat.id)}
        className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between min-h-48 ${chairCardStyle(
          status,
          loud
        )} ${isClicked ? 'scale-[0.96] ring-4 ring-blue-500/30' : ''} ${
          !visibleByFilter ? 'opacity-25 scale-95' : ''
        }`}
      >
        {/* Top Row: Seat ID + Side + Zone Pill */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-slate-900">{seat.id}</span>
            <span className="block text-[10px] italic text-slate-500">{seat.side}</span>
          </div>
          <span className="text-[10px] font-bold italic px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-800">
            {seat.zone}
          </span>
        </div>

        {/* Center Status Display */}
        <div className="my-3 text-center">
          <span className="text-xs font-bold italic uppercase tracking-wider flex items-center justify-center gap-1.5">
            {status === 'Pre-booked' && <Clock size={14} className="text-violet-700 animate-spin" />}
            {status === 'Occupied' && <UserCheck size={14} className="text-rose-700" />}
            {status === 'Bag Hogging' && <ShieldAlert size={14} className="text-amber-700" />}
            {status === 'Vacant' && <CheckCircle2 size={14} className="text-emerald-700" />}
            {status}
          </span>

          {/* Small Running Timer when Pre-booked */}
          {status === 'Pre-booked' && seat.prebookedUntil && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-violet-200 text-violet-950 px-3 py-1 rounded-lg border border-violet-400">
              <span className="text-[10px] italic">Time Left:</span>
              <RunningTimerBadge targetTime={seat.prebookedUntil} />
            </div>
          )}

          {status === 'Pre-booked' && seat.bookedBy && (
            <p className="text-[10px] italic text-violet-900 mt-1 font-bold">
              Reserved: {seat.bookedByName} ({seat.bookedBy})
            </p>
          )}

          {loud && (
            <p className="text-[10px] font-bold text-red-700 mt-1 flex items-center justify-center gap-1">
              <Volume2 size={11} /> Noise Exceeded: {seat.noiseDb}dB (Max {seat.maxDb}dB)
            </p>
          )}
        </div>

        {/* Bottom Solid Action Buttons */}
        <div className="mt-auto pt-2.5 border-t border-slate-300/70">
          {status === 'Vacant' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerCardRipple(seat.id);
                bookSeat(seat.id, 5, currentUser.regNo, currentUser.name);
                setBannerMsg(
                  `Seat ${seat.id} pre-booked for 5 minutes under ${currentUser.name} (${currentUser.regNo}).`
                );
              }}
              className="btn-press w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2 px-3 rounded-xl cursor-pointer"
            >
              Pre-Book Seat (5 min)
            </button>
          )}

          {status === 'Pre-booked' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerCardRipple(seat.id);
                  confirmArrivalAndSit(seat.id);
                  setBannerMsg(
                    `Checked in at ${seat.id}! ESP32 IR & FSR sensors now verify your presence.`
                  );
                }}
                className="btn-press bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold py-2 px-2.5 rounded-xl cursor-pointer"
              >
                I've Arrived
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerCardRipple(seat.id);
                  cancelBooking(seat.id);
                  setBannerMsg(`5-minute hold on Seat ${seat.id} cancelled.`);
                }}
                className="btn-press bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-[11px] font-bold italic py-2 px-2.5 rounded-xl cursor-pointer"
              >
                Cancel Hold
              </button>
            </div>
          )}

          {status === 'Bag Hogging' && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] italic text-amber-900 font-bold">
                Bag Load ({seat.pressureWeight}kg)
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerCardRipple(seat.id);
                  flagBagHogging(seat.id);
                  setBannerMsg(`Library attendant alerted to clear unattended bag on Seat ${seat.id}.`);
                }}
                className="btn-press text-[10px] font-bold bg-amber-700 hover:bg-amber-800 text-white px-3 py-1.5 rounded-xl cursor-pointer"
              >
                {seat.flaggedForRemoval ? 'Staff Alerted ✓' : 'Report Bag'}
              </button>
            </div>
          )}

          {status === 'Occupied' && (
            <div className="flex items-center justify-between text-[11px] font-bold text-rose-950">
              <span className="italic">
                IR: {seat.irDistance}cm • {seat.pressureWeight}kg • {seat.noiseDb}dB
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerCardRipple(seat.id);
                  evacuateSeat(seat.id);
                  setBannerMsg(`Seat ${seat.id} vacated and marked Vacant.`);
                }}
                className="btn-press text-[10px] bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                Leave Seat
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      className="min-h-screen relative overflow-hidden bg-slate-100 text-slate-900 p-6 select-none flex flex-col justify-between"
    >
      {/* Subtle Live Ambient Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="animate-orb-slow absolute -top-28 -left-28 w-96 h-96 bg-blue-200/35 rounded-full blur-3xl" />
        <div className="animate-orb-slow absolute top-1/3 -right-28 w-96 h-96 bg-slate-300/45 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl w-full mx-auto space-y-5">
        {/* Top Corporate Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border border-slate-300 bg-white p-5 rounded-3xl shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-slate-900 text-white">
              <Smartphone size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">
                  SEATFI <span className="font-normal italic text-slate-500">// Student Web Portal</span>
                </h1>
                <span className="text-[11px] font-bold italic bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-lg">
                  Developed by Sephali Singh
                </span>
              </div>
              <p className="text-xs italic text-slate-500 mt-0.5">
                5-Minute Express Pre-Booking • Live ESP32 Sensor Telemetry •{' '}
                <strong className="not-italic text-emerald-700">{counts.Vacant} Vacant</strong> ·{' '}
                <strong className="not-italic text-violet-700">{counts['Pre-booked']} Pre-booked</strong> ·{' '}
                <strong className="not-italic text-rose-700">{counts.Occupied} Occupied</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Switch Between Nikhil (12512683) and Sephali (12522159) Live */}
            <button
              onClick={() => {
                const nextId = currentUser.regNo === '12512683' ? '12522159' : '12512683';
                const profile = STUDENT_DIRECTORY[nextId];
                loginUser(profile);
                setBannerMsg(`Switched active session to ${profile.name} (Reg: ${profile.regNo})`);
              }}
              className="btn-press bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer text-xs"
            >
              <User size={14} className="text-blue-700" />
              <span>
                <strong>{currentUser.name}</strong> <i>({currentUser.regNo})</i>
              </span>
              <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-bold">
                Switch User ⇄
              </span>
            </button>

            <button
              onClick={logoutUser}
              title="Sign Out"
              className="btn-press bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <LogOut size={14} /> Sign Out
            </button>

            <Link
              href="/"
              className="btn-press flex items-center gap-1.5 text-xs font-bold bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition"
            >
              <ArrowLeft size={14} /> Kiosk & 3D Simulator
            </Link>
          </div>
        </div>

        {/* Control & Action Bar (Solid Professional Buttons — Zero Gradients) */}
        <div className="bg-white border border-slate-300 rounded-3xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-300">
            <span className="text-xs font-bold text-slate-600 px-2.5 flex items-center gap-1">
              <Filter size={12} /> View:
            </span>
            {[
              { id: 'ALL', label: 'All Chairs (6)' },
              { id: 'VACANT', label: 'Vacant Only' },
              { id: 'SILENT', label: 'Silent Zone' },
              { id: 'COLLAB', label: 'Collab Zone' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPortalFilter(tab.id)}
                className={`btn-press text-xs px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  portalFilter === tab.id
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 italic hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Solid Action Buttons: Shuffle, Live Traffic Toggle, Auto-Book Silent/Collab */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                shuffleSeats();
                setBannerMsg('Shuffled all 6 library chairs with live sensor states!');
              }}
              className="btn-press flex items-center gap-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-950 text-white px-3.5 py-2 rounded-xl cursor-pointer"
            >
              <Shuffle size={13} /> Shuffle Seats
            </button>

            <button
              onClick={toggleLiveSimulation}
              className={`btn-press flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border cursor-pointer ${
                liveSimulationEnabled
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                  : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}
            >
              <Radio size={13} className={liveSimulationEnabled ? 'text-emerald-600 animate-pulse' : ''} />
              <span>{liveSimulationEnabled ? 'Live Sensor Stream: ON' : 'Live Stream: PAUSED'}</span>
            </button>

            <button
              onClick={() => handleAutoFindSeat('Silent Zone')}
              className="btn-press flex items-center gap-1.5 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl cursor-pointer"
            >
              <Sparkles size={13} /> Auto-Book Silent (5m)
            </button>

            <button
              onClick={() => handleAutoFindSeat('Collab Zone')}
              className="btn-press flex items-center gap-1.5 text-xs font-bold bg-violet-700 hover:bg-violet-800 text-white px-4 py-2 rounded-xl cursor-pointer"
            >
              <Sparkles size={13} /> Auto-Book Collab (5m)
            </button>
          </div>
        </div>

        {bannerMsg && (
          <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm">
            <span className="italic">{bannerMsg}</span>
            <button
              onClick={() => setBannerMsg('')}
              className="btn-press text-slate-300 hover:text-white font-bold px-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Unified 6-Chair Grid (Orange Middle Table Block Removed!) */}
        <div className="bg-white border border-slate-300 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Central Library Reading Area • 6 Smart Plastic Chairs
              </h2>
              <p className="text-xs italic text-slate-500">
                Seats S-01 to S-03: <strong>Silent Study Zone (≤50 dB)</strong> • Seats S-04 to S-06:{' '}
                <strong>Collaborative Group Zone (≤70 dB)</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {myActiveSeat && (
                <button
                  onClick={() => setShowPassModal(true)}
                  className="btn-press flex items-center gap-1.5 text-xs font-bold bg-violet-700 text-white px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  <QrCode size={13} /> View Boarding Pass ({myActiveSeat.id})
                </button>
              )}
              <span className="text-xs font-bold italic text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-300 flex items-center gap-1.5">
                <Wifi size={12} /> Synced with ESP32 Bus
              </span>
            </div>
          </div>

          {/* Clean 6-Seat Grid without the Orange Table Bar in Between */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {seats.map((seat) => renderChairCard(seat))}
          </div>
        </div>

        {/* Extra Value-Add Modules: Pomodoro Study Timer + Live Activity Log */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left 5 Columns: Personal Focus & Study Timer */}
          <div className="md:col-span-5 bg-white border border-slate-300 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Timer size={18} className="text-blue-700" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Student Focus Pomodoro Timer
                  </h3>
                  <p className="text-[11px] italic text-slate-500">
                    Track your study session after checking in
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold italic text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300">
                25m Sprint
              </span>
            </div>

            <div className="my-4 text-center">
              <div className="text-4xl font-bold font-mono text-slate-900 tracking-tight">
                {formatPomodoro(pomodoroSeconds)}
              </div>
              <p className="text-xs italic text-slate-500 mt-1">
                Active User: <strong>{currentUser.name}</strong> ({currentUser.regNo})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPomodoroRunning(!pomodoroRunning)}
                className="btn-press bg-slate-900 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
              >
                {pomodoroRunning ? 'Pause Timer' : 'Start Focus Session'}
              </button>
              <button
                onClick={() => {
                  setPomodoroRunning(false);
                  setPomodoroSeconds(25 * 60);
                }}
                className="btn-press bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold italic py-2.5 rounded-xl cursor-pointer"
              >
                Reset (25:00)
              </button>
            </div>
          </div>

          {/* Right 7 Columns: Live ESP32 & Portal Event Feed */}
          <div className="md:col-span-7 bg-white border border-slate-300 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-2">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-emerald-700" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Live Telemetry & Reservation Event Log
                  </h3>
                  <p className="text-[11px] italic text-slate-500">
                    Real-time audit stream across ESP32 sensors and student check-ins
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {activityLogs.length} Events
              </span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {activityLogs.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl flex items-center justify-between gap-2"
                >
                  <span className="italic text-slate-800">{item.text}</span>
                  <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Digital Seat Pass Modal */}
      {showPassModal && myActiveSeat && (
        <div
          onClick={() => setShowPassModal(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-300 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4"
          >
            <div className="inline-flex p-3 rounded-2xl bg-violet-100 text-violet-800 border border-violet-300">
              <QrCode size={36} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Express 5-Minute Seat Pass
              </h3>
              <p className="text-xs italic text-slate-500">
                Scan or sit at Chair <strong>{myActiveSeat.id}</strong> before hold expires
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-1 text-left">
              <div className="flex justify-between">
                <span className="italic text-slate-500">Student Name:</span>
                <span className="font-bold">{currentUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="italic text-slate-500">Registration ID:</span>
                <span className="font-bold font-mono">{currentUser.regNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="italic text-slate-500">Reserved Chair:</span>
                <span className="font-bold text-violet-700">{myActiveSeat.id} ({myActiveSeat.zone})</span>
              </div>
            </div>
            <button
              onClick={() => setShowPassModal(false)}
              className="btn-press w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}

      {/* Persistent Credit Footer */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto mt-6 pt-4 border-t border-slate-300 flex flex-wrap items-center justify-between text-xs italic text-slate-600">
        <span>SEATFI // Smart Library IoT Occupancy & Pre-Booking System (Project P06)</span>
        <span className="flex items-center gap-1.5">
          <Award size={14} className="text-blue-700" />
          Developed by <strong className="font-bold not-italic text-slate-900">Sephali Singh</strong> (12522159) & Nikhil (12512683)
        </span>
      </footer>
    </div>
  );
}