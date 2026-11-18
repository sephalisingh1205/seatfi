// src/app/portal/page.js
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSeatStore, computeNodeStatus, isNoiseViolation } from '@/store/useSeatStore';
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
    flagBagHogging,
    portalFilter,
    setPortalFilter,
    currentUser,
    loginUser,
    logoutUser,
    hydrateAuth,
  } = useSeatStore();

  // Login Form States
  const [regInput, setRegInput] = useState('12409821');
  const [nameInput, setNameInput] = useState('Nikhil (B.Tech CSE)');
  const [passInput, setPassInput] = useState('••••••••');
  const [roleInput, setRoleInput] = useState('Student');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginStageText, setLoginStageText] = useState('');

  // Interactive Click Pulse & Banner States
  const [clickedCardId, setClickedCardId] = useState(null);
  const [bannerMsg, setBannerMsg] = useState('');
  const [, setTick] = useState(0);

  useEffect(() => {
    hydrateAuth();
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [hydrateAuth]);

  useEffect(() => {
    const cached = localStorage.getItem('seatfi_live_state_v4');
    if (cached) syncFromStorage(JSON.parse(cached));

    const handleStorage = (e) => {
      if (e.key === 'seatfi_live_state_v4' && e.newValue) {
        syncFromStorage(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [syncFromStorage]);

  const triggerCardRipple = (id) => {
    setClickedCardId(id);
    setTimeout(() => setClickedCardId(null), 500);
  };

  const handleAnimatedLogin = (e) => {
    e.preventDefault();
    if (!regInput.trim()) return;
    setIsLoggingIn(true);
    setLoginStageText('Verifying University ID & Credentials...');
    setTimeout(() => {
      setLoginStageText('Syncing with Central Library ESP32 Mesh Bus...');
    }, 450);
    setTimeout(() => {
      loginUser({
        regNo: regInput.trim(),
        name: nameInput.trim() || 'LPU Student',
        role: roleInput,
      });
      setIsLoggingIn(false);
      setBannerMsg(`Welcome ${nameInput}! Connected to Central Library Ground Floor Table #1.`);
    }, 950);
  };

  const applyQuickProfile = (reg, name, role) => {
    setRegInput(reg);
    setNameInput(name);
    setRoleInput(role);
  };

  const handleAutoFindSeat = (preferredZone) => {
    const candidate = seats.find((s) => {
      const st = computeNodeStatus(s.irDistance, s.pressureWeight, s.prebookedUntil);
      return st === 'Vacant' && (!preferredZone || s.zone === preferredZone);
    });
    if (!candidate) {
      setBannerMsg('No vacant seats currently match that zone! Try another zone.');
      return;
    }
    triggerCardRipple(candidate.id);
    bookSeat(
      candidate.id,
      5,
      currentUser?.regNo || '12409821',
      currentUser?.name || 'Nikhil'
    );
    setBannerMsg(
      `Seat ${candidate.id} (${candidate.zone}) pre-booked for 5 minutes! Reach the library before the timer expires.`
    );
  };

  // Fixed Filter Logic: Pre-booked seats NEVER fade out so you can always click "I've Arrived" or "Cancel"
  const matchesFilter = (seat) => {
    const st = computeNodeStatus(seat.irDistance, seat.pressureWeight, seat.prebookedUntil);
    if (st === 'Pre-booked') return true;
    if (portalFilter === 'VACANT') return st === 'Vacant';
    if (portalFilter === 'SILENT') return seat.zone === 'Silent Zone';
    if (portalFilter === 'COLLAB') return seat.zone === 'Collab Zone';
    return true;
  };

  // ============================================================================
  // VIEW 1: PROFESSIONAL CORPORATE LOGIN PAGE WITH LIVE ANIMATED BACKGROUND
  // ============================================================================
  if (!currentUser) {
    return (
      <div
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        className="min-h-screen w-full relative overflow-hidden bg-slate-100 flex items-center justify-center p-6 select-none"
      >
        {/* Live Moving Ambient Background Orbs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="animate-float-slow absolute -top-24 -left-24 w-[30rem] h-[30rem] bg-blue-400/25 rounded-full blur-3xl" />
          <div className="animate-float-reverse absolute top-1/4 -right-28 w-[32rem] h-[32rem] bg-indigo-400/20 rounded-full blur-3xl" />
          <div className="animate-float-slow absolute -bottom-28 left-1/3 w-[28rem] h-[28rem] bg-sky-300/25 rounded-full blur-3xl" />
        </div>

        {/* Main Corporate Login Card */}
        <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-white/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden">
          {/* Left 5 Columns: Live Telemetry Branding Pane */}
          <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-[11px] font-bold italic text-blue-200 mb-6">
                <Wifi size={12} className="animate-pulse text-emerald-400" /> ESP32 Telemetry Gate Active
              </div>

              <h1 className="text-3xl font-bold tracking-tight">
                SEATFI <span className="font-normal italic text-blue-300">Portal</span>
              </h1>
              <p className="text-xs italic text-slate-300 mt-2 leading-relaxed">
                Smart Library Seat Discovery, 5-Minute Express Pre-Booking & Dual-Sensor Anti-Hogging System.
              </p>
            </div>

            <div className="space-y-3 my-8 relative z-10">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Central Library Table #1</span>
                  <span className="text-emerald-400 italic">6 Nodes Live</span>
                </div>
                <p className="text-[11px] italic text-slate-300 mt-1">
                  Real-time IR Obstacle + FSR Pressure Pad verification on every chair.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>5-Minute Express Hold</span>
                  <span className="text-violet-300 italic">Instant Lock</span>
                </div>
                <p className="text-[11px] italic text-slate-300 mt-1">
                  Reserve your seat 5 minutes before reaching the library entrance.
                </p>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-4 text-[11px] italic text-slate-400">
              <span>LPU Campus Innovation • P06</span>
              <Link href="/" className="text-blue-300 hover:text-white font-bold not-italic">
                ← Kiosk View
              </Link>
            </div>
          </div>

          {/* Right 7 Columns: Interactive Login Form */}
          <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Student & Staff Sign In</h2>
                  <p className="text-xs italic text-slate-500 mt-0.5">
                    Authenticate with your University Registration ID to reserve a library seat
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200">
                  <GraduationCap size={22} />
                </div>
              </div>

              {/* Quick Demo Profile Selector Pills */}
              <div className="mb-5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Quick One-Click Demo Profiles:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyQuickProfile('12409821', 'Nikhil (CSE)', 'Student')}
                    className={`btn-click-fx text-xs py-2 px-3 rounded-xl border text-left transition cursor-pointer ${
                      regInput === '12409821'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 italic hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold not-italic">Nikhil</div>
                    <div className="text-[10px] opacity-75">ID: 12409821</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyQuickProfile('12410452', 'Sephali (AI/ML)', 'Student')}
                    className={`btn-click-fx text-xs py-2 px-3 rounded-xl border text-left transition cursor-pointer ${
                      regInput === '12410452'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 italic hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold not-italic">Sephali</div>
                    <div className="text-[10px] opacity-75">ID: 12410452</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyQuickProfile('LIB-STAFF-01', 'Library Warden', 'Staff')}
                    className={`btn-click-fx text-xs py-2 px-3 rounded-xl border text-left transition cursor-pointer ${
                      regInput === 'LIB-STAFF-01'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 italic hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold not-italic">Staff Desk</div>
                    <div className="text-[10px] opacity-75">ID: LIB-STAFF-01</div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleAnimatedLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    University Registration Number <span className="font-normal italic text-slate-400">(UMS ID)</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regInput}
                      onChange={(e) => setRegInput(e.target.value)}
                      placeholder="e.g. 12409821"
                      className="w-full pl-10 pr-4 py-2.5 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name & Branch
                    </label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      UMS Password / PIN
                    </label>
                    <div className="relative">
                      <KeyRound size={15} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={passInput}
                        onChange={(e) => setPassInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="btn-click-fx w-full mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isLoggingIn ? (
                    <>
                      <Activity size={16} className="animate-spin" />
                      <span className="italic text-xs">{loginStageText}</span>
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>Authenticate & Launch Live Seat Map</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>

            <p className="text-[11px] italic text-slate-400 text-center mt-6">
              Protected by SEATFI Edge Telemetry • Instant Cross-Tab Sync with Outside Library Kiosk
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: AUTHENTICATED STUDENT PORTAL DASHBOARD
  // ============================================================================
  const chairBadge = (status, loud) => {
    if (loud) return 'bg-red-50 text-red-900 border-red-400 shadow-sm';
    if (status === 'Occupied') return 'bg-rose-50/95 text-rose-900 border-rose-300 shadow-xs';
    if (status === 'Bag Hogging') return 'bg-amber-50/95 text-amber-900 border-amber-300 shadow-xs';
    if (status === 'Pre-booked')
      return 'bg-violet-50/95 text-violet-950 border-violet-400 ring-2 ring-violet-500/40 shadow-md';
    return 'bg-emerald-50/95 text-emerald-900 border-emerald-300 shadow-xs hover:shadow-md';
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
        className={`p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between min-h-48 relative overflow-hidden ${chairBadge(
          status,
          loud
        )} ${isClicked ? 'scale-[0.96] ring-4 ring-blue-500/40' : 'hover:-translate-y-0.5'} ${
          !visibleByFilter ? 'opacity-30 scale-95' : ''
        }`}
      >
        {/* Top Row: Seat ID + Zone Pill */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">{seat.id}</span>
          <span className="text-[10px] font-bold italic px-2.5 py-0.5 rounded-full bg-white/90 border border-slate-200 text-slate-700">
            {seat.zone}
          </span>
        </div>

        {/* Status Line */}
        <div className="my-2.5 text-center">
          <span className="text-xs font-bold italic uppercase tracking-wider flex items-center justify-center gap-1.5">
            {status === 'Pre-booked' && <Clock size={14} className="text-violet-700 animate-spin" />}
            {status === 'Occupied' && <UserCheck size={14} className="text-rose-700" />}
            {status === 'Bag Hogging' && <ShieldAlert size={14} className="text-amber-700" />}
            {status === 'Vacant' && <CheckCircle2 size={14} className="text-emerald-700" />}
            {status}
          </span>

          {/* Small Running Timer Badge when Pre-booked */}
          {status === 'Pre-booked' && seat.prebookedUntil && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-violet-200/90 text-violet-950 px-3 py-1 rounded-full border border-violet-300 shadow-2xs">
              <span className="text-[10px] italic">Hold time left:</span>
              <RunningTimerBadge targetTime={seat.prebookedUntil} />
            </div>
          )}

          {status === 'Pre-booked' && seat.bookedBy && (
            <p className="text-[10px] italic text-violet-800 mt-1 font-bold">
              Booked by: {seat.bookedByName || 'Student'} ({seat.bookedBy})
            </p>
          )}

          {loud && (
            <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center justify-center gap-1">
              <Volume2 size={11} /> Noise Alert: {seat.noiseDb}dB (Max {seat.maxDb}dB)
            </p>
          )}
        </div>

        {/* Bottom Action Buttons Depending on Seat State */}
        <div className="mt-auto pt-2.5 border-t border-black/10">
          {status === 'Vacant' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerCardRipple(seat.id);
                bookSeat(seat.id, 5, currentUser.regNo, currentUser.name);
                setBannerMsg(
                  `Seat ${seat.id} pre-booked for 5 minutes under ID ${currentUser.regNo}! Live countdown started.`
                );
              }}
              className="btn-click-fx w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold italic py-2 px-3 rounded-xl shadow-sm cursor-pointer"
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
                    `Checked in at ${seat.id}! ESP32 IR & Pressure sensors now verify your physical presence.`
                  );
                }}
                className="btn-click-fx bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-2 px-2.5 rounded-xl shadow-xs cursor-pointer"
              >
                I've Arrived
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerCardRipple(seat.id);
                  cancelBooking(seat.id);
                  setBannerMsg(`Pre-booking for Seat ${seat.id} cancelled.`);
                }}
                className="btn-click-fx bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-[11px] italic font-bold py-2 px-2.5 rounded-xl cursor-pointer"
              >
                Cancel Hold
              </button>
            </div>
          )}

          {status === 'Bag Hogging' && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] italic text-amber-900 font-bold">
                Unattended load ({seat.pressureWeight}kg)
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerCardRipple(seat.id);
                  flagBagHogging(seat.id);
                  setBannerMsg(`Library staff alerted to clear unattended bag on Seat ${seat.id}.`);
                }}
                className="btn-click-fx text-[10px] font-bold italic bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl cursor-pointer"
              >
                {seat.flaggedForRemoval ? 'Staff Alerted ✓' : 'Report Bag'}
              </button>
            </div>
          )}

          {status === 'Occupied' && (
            <div className="flex justify-between text-[11px] italic text-rose-950 font-bold">
              <span>IR: {seat.irDistance}cm</span>
              <span>Load: {seat.pressureWeight}kg</span>
              <span>{seat.noiseDb}dB</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      className="min-h-screen relative overflow-hidden bg-slate-100/90 text-slate-900 p-6 select-none"
    >
      {/* Live Animated Ambient Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="animate-float-slow absolute -top-28 -left-28 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="animate-float-reverse absolute top-1/3 -right-28 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-5">
        {/* Top Portal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border border-slate-200/90 bg-white/95 backdrop-blur-xl p-5 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md">
              <Smartphone size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                SEATFI <span className="font-normal italic text-slate-500">// Student Web & Mobile Portal</span>
              </h1>
              <p className="text-xs italic text-slate-500">
                5-Minute Express Pre-Booking • Live Anti-Hogging & Acoustic Zone Map
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Authenticated User Badge */}
            <div className="bg-slate-100 px-3.5 py-2 rounded-2xl border border-slate-200 flex items-center gap-2">
              <User size={14} className="text-blue-600" />
              <div className="text-xs">
                <span className="font-bold text-slate-900">{currentUser.name}</span>{' '}
                <span className="italic text-slate-500">({currentUser.regNo})</span>
              </div>
              <button
                onClick={logoutUser}
                title="Sign Out"
                className="btn-click-fx ml-1 text-rose-600 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
              >
                <LogOut size={14} />
              </button>
            </div>

            <Link
              href="/"
              className="btn-click-fx flex items-center gap-1.5 text-xs font-bold italic bg-slate-900 text-white px-4 py-2.5 rounded-2xl hover:bg-blue-700 transition"
            >
              <ArrowLeft size={14} /> Back to Split Simulator
            </Link>
          </div>
        </div>

        {/* Express Smart-Finder & Zone Filter Bar */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 px-2.5 flex items-center gap-1">
              <Filter size={12} /> Filter:
            </span>
            {[
              { id: 'ALL', label: 'All Seats (6)' },
              { id: 'VACANT', label: 'Vacant + My Hold' },
              { id: 'SILENT', label: 'Silent Side' },
              { id: 'COLLAB', label: 'Collab Side' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPortalFilter(tab.id)}
                className={`btn-click-fx text-xs px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                  portalFilter === tab.id
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 italic hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAutoFindSeat('Silent Zone')}
              className="btn-click-fx flex items-center gap-1.5 text-xs font-bold italic bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-2xl shadow-sm cursor-pointer"
            >
              <Sparkles size={13} /> Auto-Book Silent Seat (5m)
            </button>
            <button
              onClick={() => handleAutoFindSeat('Collab Zone')}
              className="btn-click-fx flex items-center gap-1.5 text-xs font-bold italic bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-4 py-2 rounded-2xl shadow-sm cursor-pointer"
            >
              <Sparkles size={13} /> Auto-Book Collab Seat (5m)
            </button>
          </div>
        </div>

        {bannerMsg && (
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 text-white px-5 py-3 rounded-2xl text-xs font-bold italic flex items-center justify-between shadow-md">
            <span>✨ {bannerMsg}</span>
            <button
              onClick={() => setBannerMsg('')}
              className="btn-click-fx text-white/80 hover:text-white not-italic font-bold px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Shared Long Table Schematic */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-7 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              North Side Plastic Chairs • <span className="italic text-blue-700">Silent Study Zone (≤50 dB)</span>
            </span>
            <span className="text-xs font-bold italic text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <Wifi size={12} /> Live Synced with ESP32 Bus
            </span>
          </div>

          {/* North Row (S-01, S-02, S-03) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {seats.slice(0, 3).map((seat) => renderChairCard(seat))}
          </div>

          {/* Continuous Unpartitioned Wooden Table Surface */}
          <div className="h-24 w-full rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white flex flex-col items-center justify-center shadow-inner border-4 border-amber-700/30">
            <span className="text-sm font-bold tracking-widest uppercase">
              Shared Wooden Library Reading Table (No Partitions / Dividers)
            </span>
            <span className="text-xs italic opacity-95 mt-1">
              6 Directional IR Obstacle Sensors + 6 FSR Chair Pressure Pads + Acoustic Zone Microphones
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              South Side Plastic Chairs •{' '}
              <span className="italic text-indigo-700">Collaborative Group Zone (≤70 dB)</span>
            </span>
          </div>

          {/* South Row (S-04, S-05, S-06) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {seats.slice(3, 6).map((seat) => renderChairCard(seat))}
          </div>
        </div>
      </div>
    </div>
  );
}