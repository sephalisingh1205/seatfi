// src/components/ui/OutsideKiosk.jsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Monitor,
  Wifi,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  UserCheck,
  Cpu,
  Layers,
  Clock,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { useSeatStore, computeNodeStatus, isNoiseViolation } from '@/store/useSeatStore';

export default function OutsideKiosk() {
  const {
    seats,
    selectedSeatId,
    setSelectedSeat,
    workspaceMode,
    setWorkspaceMode,
    bookSeat,
    cancelBooking,
    syncFromStorage,
  } = useSeatStore();

  const [, setTick] = useState(0);

  useEffect(() => {
    const cached = localStorage.getItem('seatfi_live_state_v3');
    if (cached) syncFromStorage(JSON.parse(cached));

    const handleStorage = (e) => {
      if (e.key === 'seatfi_live_state_v3' && e.newValue) {
        syncFromStorage(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(timer);
    };
  }, [syncFromStorage]);

  const activeSeat = seats.find((s) => s.id === selectedSeatId) || seats[0];
  const activeStatus = computeNodeStatus(
    activeSeat.irDistance,
    activeSeat.pressureWeight,
    activeSeat.prebookedUntil
  );
  const activeLoud = isNoiseViolation(activeSeat);

  // Live Summary Counts
  const counts = seats.reduce(
    (acc, s) => {
      const st = computeNodeStatus(s.irDistance, s.pressureWeight, s.prebookedUntil);
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    },
    { Vacant: 0, 'Pre-booked': 0, Occupied: 0, 'Bag Hogging': 0 }
  );

  const formatCountdown = (targetTime) => {
    if (!targetTime) return '0:00';
    const rem = Math.max(0, targetTime - Date.now());
    const m = Math.floor(rem / 60000);
    const s = Math.floor((rem % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const cardShade = (status, isSelected, loud) => {
    const ring = isSelected
      ? 'ring-2 ring-blue-600 shadow-md scale-[1.01] '
      : 'shadow-xs opacity-95 hover:opacity-100 ';
    if (loud) return ring + 'bg-gradient-to-b from-white to-red-100 border-red-400 text-red-950';
    if (status === 'Occupied')
      return ring + 'bg-gradient-to-b from-white to-rose-50/80 border-rose-200 text-rose-900';
    if (status === 'Bag Hogging')
      return ring + 'bg-gradient-to-b from-white to-amber-50/80 border-amber-200 text-amber-900';
    if (status === 'Pre-booked')
      return ring + 'bg-gradient-to-b from-white to-violet-50/90 border-violet-300 text-violet-900';
    return ring + 'bg-gradient-to-b from-white to-emerald-50/80 border-emerald-200 text-emerald-900';
  };

  const pillBadge = (status) => {
    if (status === 'Occupied') return 'bg-rose-100 text-rose-800 border border-rose-200';
    if (status === 'Bag Hogging') return 'bg-amber-100 text-amber-800 border border-amber-200';
    if (status === 'Pre-booked') return 'bg-violet-100 text-violet-800 border border-violet-300';
    return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  };

  return (
    <div className="h-full w-full px-6 py-3 flex flex-col justify-between overflow-y-auto">
      {/* Corporate Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-2.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/20">
            <Monitor size={19} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                SEATFI <span className="font-normal italic text-slate-500">// Outside Library Kiosk</span>
              </h1>
              <span className="text-[11px] font-bold italic bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Wifi size={11} className="text-emerald-600" /> 6-Chair ESP32 Bus Online
              </span>
            </div>
            <p className="text-xs italic text-slate-500">
              <strong className="font-bold not-italic text-slate-700">Open Reading Table #1</strong> •{' '}
              <span className="text-emerald-700 font-bold not-italic">{counts.Vacant} Vacant</span> ·{' '}
              <span className="text-violet-700 font-bold not-italic">{counts['Pre-booked']} Pre-booked</span> ·{' '}
              <span className="text-rose-700 font-bold not-italic">{counts.Occupied} Studying</span> ·{' '}
              <span className="text-amber-700 font-bold not-italic">{counts['Bag Hogging']} Bag Hogged</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* 3D Workspace Mode Switcher Pill */}
          <div className="bg-slate-100 p-1 rounded-full border border-slate-200/80 flex items-center gap-1">
            <button
              onClick={() => setWorkspaceMode('table')}
              className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                workspaceMode === 'table'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 italic hover:text-slate-900'
              }`}
            >
              <Layers size={13} />
              <span>1. 3D Long Table</span>
            </button>
            <button
              onClick={() => setWorkspaceMode('workbench')}
              className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                workspaceMode === 'workbench'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 italic hover:text-slate-900'
              }`}
            >
              <Cpu size={13} />
              <span>2. 3D ESP32 Hardware Lab</span>
            </button>
          </div>

          <Link
            href="/portal"
            target="_blank"
            className="flex items-center gap-2 text-xs font-bold italic bg-gradient-to-r from-slate-800 to-slate-900 hover:from-blue-700 hover:to-indigo-800 text-white px-4 py-2 rounded-full shadow-sm transition-all"
          >
            <span>Student Portal (/portal)</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 my-auto py-1.5">
        {/* Left 8 Columns: Shared Long Table Visual Schematic */}
        <div className="lg:col-span-8 bg-slate-100/70 border border-slate-200/90 rounded-2xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Shared Reading Table Layout{' '}
              <span className="font-normal italic">(Click any chair or pre-book for 5 mins)</span>
            </span>
            <span className="text-[11px] italic text-slate-500">
              North = Silent Zone (≤50dB) • South = Collab Zone
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {seats.map((seat) => {
              const currentStatus = computeNodeStatus(
                seat.irDistance,
                seat.pressureWeight,
                seat.prebookedUntil
              );
              const isSelected = seat.id === selectedSeatId;
              const loud = isNoiseViolation(seat);

              return (
                <div
                  key={seat.id}
                  onClick={() => setSelectedSeat(seat.id)}
                  className={`p-3 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${cardShade(
                    currentStatus,
                    isSelected,
                    loud
                  )}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{seat.id}</span>
                    <span className="text-[9px] italic px-1.5 py-0.5 rounded-full bg-white/80 text-slate-600 border border-slate-200">
                      {seat.zone === 'Silent Zone' ? 'Silent' : 'Collab'}
                    </span>
                  </div>

                  <div className="my-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${pillBadge(
                        currentStatus
                      )}`}
                    >
                      {currentStatus === 'Pre-booked' && <Clock size={10} className="animate-spin" />}
                      {currentStatus}
                    </span>

                    {/* Running Countdown Timer inside Pre-booked Card */}
                    {currentStatus === 'Pre-booked' && seat.prebookedUntil && (
                      <div className="mt-1 flex items-center justify-between bg-violet-100/90 border border-violet-300 px-2 py-0.5 rounded-lg">
                        <span className="text-[9px] italic text-violet-700">Hold:</span>
                        <span className="text-[11px] font-bold font-mono text-violet-900">
                          {formatCountdown(seat.prebookedUntil)}
                        </span>
                      </div>
                    )}

                    {/* Quick 5-Min Pre-book Pill directly on Kiosk for Vacant Chairs */}
                    {currentStatus === 'Vacant' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          bookSeat(seat.id, 5, 'KIOSK-HOLD');
                        }}
                        className="mt-1.5 w-full text-[10px] font-bold italic bg-emerald-600 hover:bg-emerald-700 text-white py-0.5 px-2 rounded-full transition cursor-pointer"
                      >
                        + Hold 5m
                      </button>
                    )}

                    {loud && (
                      <div className="mt-1 text-[9px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <Volume2 size={10} /> {seat.noiseDb}dB Loud!
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200/60 pt-1.5 text-[10px] flex justify-between items-center">
                    <span className="italic text-slate-500">{seat.irDistance}cm</span>
                    <span className="font-bold text-slate-700">{seat.pressureWeight}kg</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4 Columns: Active Chair ESP32 Telemetry + Serial Packet */}
        <div className="lg:col-span-4 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 border border-slate-200/90 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Chair {activeSeat.id} Telemetry
              </span>
              <p className="text-[11px] italic text-slate-500">
                {activeSeat.side} • <strong>{activeSeat.zone}</strong>
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {activeStatus === 'Pre-booked' && (
                <button
                  onClick={() => cancelBooking(activeSeat.id)}
                  className="text-[10px] font-bold italic text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <span
                className={`flex items-center gap-1 text-xs font-bold italic px-3 py-0.5 rounded-full ${pillBadge(
                  activeStatus
                )}`}
              >
                {activeStatus === 'Pre-booked' && <Clock size={12} />}
                {activeStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 my-2 text-center">
            <div className="bg-white p-2 rounded-xl border border-slate-200/80">
              <span className="text-[10px] italic text-slate-500 block">IR Sensor</span>
              <span className="text-sm font-bold text-blue-700">{activeSeat.irDistance} cm</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-200/80">
              <span className="text-[10px] italic text-slate-500 block">Chair FSR</span>
              <span className="text-sm font-bold text-indigo-700">{activeSeat.pressureWeight} kg</span>
            </div>
            <div
              className={`p-2 rounded-xl border ${
                activeLoud ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200/80'
              }`}
            >
              <span className="text-[10px] italic text-slate-500 block">Mic Noise</span>
              <span className={`text-sm font-bold ${activeLoud ? 'text-red-600' : 'text-teal-700'}`}>
                {activeSeat.noiseDb} dB
              </span>
            </div>
          </div>

          {/* Live Serial Telemetry Stream Line */}
          <div className="text-[10px] font-mono bg-slate-900 text-emerald-400 px-3 py-1.5 rounded-xl flex items-center justify-between">
            <span className="truncate">
              {`{"node":"${activeSeat.id}","ir":${activeSeat.irDistance},"kg":${activeSeat.pressureWeight},"st":"${activeStatus.toUpperCase()}"}`}
            </span>
            {activeStatus === 'Pre-booked' && (
              <span className="text-violet-300 font-bold ml-2 shrink-0">
                ⏱ {formatCountdown(activeSeat.prebookedUntil)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}