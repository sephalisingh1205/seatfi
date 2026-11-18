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
  } = useSeatStore();

  const [studentId, setStudentId] = useState('12409821');
  const [bannerMsg, setBannerMsg] = useState('');
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem('seatfi_live_state_v3');
    if (cached) syncFromStorage(JSON.parse(cached));

    const handleStorage = (e) => {
      if (e.key === 'seatfi_live_state_v3' && e.newValue) {
        syncFromStorage(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [syncFromStorage]);

  const handleAutoFindSeat = (preferredZone) => {
    const candidate = seats.find((s) => {
      const st = computeNodeStatus(s.irDistance, s.pressureWeight, s.prebookedUntil);
      return st === 'Vacant' && (!preferredZone || s.zone === preferredZone);
    });
    if (!candidate) {
      setBannerMsg('No vacant seats currently match that zone! Try another zone.');
      return;
    }
    bookSeat(candidate.id, 5, studentId || 'STUDENT');
    setBannerMsg(
      `Seat ${candidate.id} (${candidate.zone}) pre-booked for 5 minutes! Reach the library before the timer expires.`
    );
  };

  const matchesFilter = (seat) => {
    const st = computeNodeStatus(seat.irDistance, seat.pressureWeight, seat.prebookedUntil);
    if (portalFilter === 'VACANT') return st === 'Vacant';
    if (portalFilter === 'SILENT') return seat.zone === 'Silent Zone';
    if (portalFilter === 'COLLAB') return seat.zone === 'Collab Zone';
    return true;
  };

  const chairBadge = (status, loud) => {
    if (loud) return 'bg-red-50 text-red-900 border-red-400 shadow-sm';
    if (status === 'Occupied') return 'bg-rose-50/90 text-rose-900 border-rose-300';
    if (status === 'Bag Hogging') return 'bg-amber-50/90 text-amber-900 border-amber-300';
    if (status === 'Pre-booked')
      return 'bg-violet-50 text-violet-950 border-violet-400 ring-2 ring-violet-500/30 shadow-md';
    return 'bg-emerald-50/90 text-emerald-900 border-emerald-300';
  };

  const renderChairCard = (seat) => {
    const status = computeNodeStatus(seat.irDistance, seat.pressureWeight, seat.prebookedUntil);
    const loud = isNoiseViolation(seat);
    const visibleByFilter = matchesFilter(seat);

    return (
      <div
        key={seat.id}
        className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-44 ${chairBadge(
          status,
          loud
        )} ${!visibleByFilter ? 'opacity-25 scale-95 pointer-events-none' : ''}`}
      >
        {/* Top Row: Seat ID + Zone Pill */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">{seat.id}</span>
          <span className="text-[10px] font-bold italic px-2.5 py-0.5 rounded-full bg-white/90 border border-slate-200 text-slate-700">
            {seat.zone}
          </span>
        </div>

        {/* Status Line */}
        <div className="my-2 text-center">
          <span className="text-xs font-bold italic uppercase tracking-wider flex items-center justify-center gap-1">
            {status === 'Pre-booked' && <Clock size={13} className="text-violet-700 animate-pulse" />}
            {status === 'Occupied' && <UserCheck size={13} className="text-rose-700" />}
            {status === 'Bag Hogging' && <ShieldAlert size={13} className="text-amber-700" />}
            {status === 'Vacant' && <CheckCircle2 size={13} className="text-emerald-700" />}
            {status}
          </span>

          {/* Small Running Timer Badge when Pre-booked */}
          {status === 'Pre-booked' && seat.prebookedUntil && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 bg-violet-200/80 text-violet-950 px-3 py-1 rounded-full border border-violet-300">
              <span className="text-[10px] italic">Hold expires in:</span>
              <RunningTimerBadge targetTime={seat.prebookedUntil} />
            </div>
          )}

          {status === 'Pre-booked' && seat.bookedBy && (
            <p className="text-[10px] italic text-violet-700 mt-1">
              Reserved for Reg: <strong>{seat.bookedBy}</strong>
            </p>
          )}

          {loud && (
            <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center justify-center gap-1">
              <Volume2 size={11} /> Noise Alert: {seat.noiseDb}dB (Max {seat.maxDb}dB)
            </p>
          )}
        </div>

        {/* Bottom Action Buttons Depending on Seat State */}
        <div className="mt-auto pt-2 border-t border-black/5">
          {status === 'Vacant' && (
            <button
              onClick={() => {
                bookSeat(seat.id, 5, studentId || '12409821');
                setBannerMsg(`Seat ${seat.id} pre-booked for 5 minutes! Timer is now running.`);
              }}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold italic py-2 px-3 rounded-full shadow-sm transition cursor-pointer"
            >
              Pre-Book Seat (5 min)
            </button>
          )}

          {status === 'Pre-booked' && (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  confirmArrivalAndSit(seat.id);
                  setBannerMsg(`Checked in at ${seat.id}! ESP32 sensors now detect you seated.`);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1.5 px-2 rounded-full transition cursor-pointer"
              >
                I've Arrived
              </button>
              <button
                onClick={() => cancelBooking(seat.id)}
                className="bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-[11px] italic font-bold py-1.5 px-2 rounded-full transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {status === 'Bag Hogging' && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] italic text-amber-900">
                Unattended load ({seat.pressureWeight}kg)
              </span>
              <button
                onClick={() => flagBagHogging(seat.id)}
                className="text-[10px] font-bold italic bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-full cursor-pointer"
              >
                {seat.flaggedForRemoval ? 'Staff Alerted ✓' : 'Report Bag'}
              </button>
            </div>
          )}

          {status === 'Occupied' && (
            <div className="flex justify-between text-[11px] italic text-rose-900/80">
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
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 text-slate-900 p-6"
    >
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Top Portal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/90 backdrop-blur-md p-5 rounded-3xl shadow-xs">
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

          <div className="flex items-center gap-3">
            <div className="bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-2">
              <span className="text-[11px] italic text-slate-500">Student ID:</span>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-24 text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
              />
            </div>

            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-bold italic bg-slate-900 text-white px-4 py-2.5 rounded-full hover:bg-blue-700 transition"
            >
              <ArrowLeft size={14} /> Back to Split Simulator
            </Link>
          </div>
        </div>

        {/* Express Smart-Finder & Zone Filter Bar */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-full border border-slate-200">
            <span className="text-xs font-bold text-slate-500 px-2.5 flex items-center gap-1">
              <Filter size={12} /> Filter:
            </span>
            {[
              { id: 'ALL', label: 'All (6)' },
              { id: 'VACANT', label: 'Vacant Only' },
              { id: 'SILENT', label: 'Silent Side' },
              { id: 'COLLAB', label: 'Collab Side' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPortalFilter(tab.id)}
                className={`text-xs px-3 py-1.5 rounded-full transition cursor-pointer ${
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
              className="flex items-center gap-1.5 text-xs font-bold italic bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-full shadow-sm cursor-pointer"
            >
              <Sparkles size={13} /> Auto-Book Silent Seat (5m)
            </button>
            <button
              onClick={() => handleAutoFindSeat('Collab Zone')}
              className="flex items-center gap-1.5 text-xs font-bold italic bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-4 py-2 rounded-full shadow-sm cursor-pointer"
            >
              <Sparkles size={13} /> Auto-Book Collab Seat (5m)
            </button>
          </div>
        </div>

        {bannerMsg && (
          <div className="bg-violet-600 text-white px-5 py-3 rounded-2xl text-xs font-bold italic flex items-center justify-between shadow-md">
            <span>✨ {bannerMsg}</span>
            <button onClick={() => setBannerMsg('')} className="text-white/80 hover:text-white not-italic">
              ✕
            </button>
          </div>
        )}

        {/* Shared Long Table Schematic */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-7 shadow-sm space-y-6">
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
              South Side Plastic Chairs • <span className="italic text-indigo-700">Collaborative Group Zone (≤70 dB)</span>
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