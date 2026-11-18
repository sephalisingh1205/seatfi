// src/components/ui/OutsideKiosk.jsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Monitor,
  Wifi,
  ExternalLink,
  Cpu,
  Layers,
  Clock,
  Volume2,
  Shuffle,
  Award,
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
    confirmArrivalAndSit,
    shuffleSeats,
    pulseLiveTelemetry,
    syncFromStorage,
  } = useSeatStore();

  const [clickedId, setClickedId] = useState(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const cached = localStorage.getItem('seatfi_live_state_v5');
    if (cached) syncFromStorage(JSON.parse(cached));

    const handleStorage = (e) => {
      if (e.key === 'seatfi_live_state_v5' && e.newValue) {
        syncFromStorage(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    const liveJitter = setInterval(() => pulseLiveTelemetry(), 2500);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(timer);
      clearInterval(liveJitter);
    };
  }, [syncFromStorage, pulseLiveTelemetry]);

  const activeSeat = seats.find((s) => s.id === selectedSeatId) || seats[0];
  const activeStatus = computeNodeStatus(
    activeSeat.irDistance,
    activeSeat.pressureWeight,
    activeSeat.prebookedUntil
  );
  const activeLoud = isNoiseViolation(activeSeat);

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

  // Solid Professional Card Shades (Zero Gradients)
  const cardShade = (status, isSelected, loud, isPulsing) => {
    const anim = isPulsing ? 'scale-95 ' : '';
    const ring = isSelected ? 'ring-2 ring-blue-700 shadow-sm ' : '';
    if (loud) return anim + ring + 'bg-red-50 border-red-400 text-red-950';
    if (status === 'Occupied') return anim + ring + 'bg-rose-50 border-rose-300 text-rose-950';
    if (status === 'Bag Hogging') return anim + ring + 'bg-amber-50 border-amber-300 text-amber-950';
    if (status === 'Pre-booked') return anim + ring + 'bg-violet-50 border-violet-400 text-violet-950';
    return anim + ring + 'bg-emerald-50 border-emerald-300 text-emerald-950';
  };

  const pillBadge = (status) => {
    if (status === 'Occupied') return 'bg-rose-100 text-rose-900 border border-rose-300';
    if (status === 'Bag Hogging') return 'bg-amber-100 text-amber-900 border border-amber-300';
    if (status === 'Pre-booked') return 'bg-violet-200 text-violet-950 border border-violet-400';
    return 'bg-emerald-100 text-emerald-900 border border-emerald-300';
  };

  return (
    <div
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      className="h-full w-full px-6 py-3 flex flex-col justify-between overflow-y-auto bg-white"
    >
      {/* Solid Professional Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-slate-900 text-white">
            <Monitor size={19} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                SEATFI <span className="font-normal italic text-slate-500">// Outside Library Kiosk</span>
              </h1>
              <span className="text-[11px] font-bold italic bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                <Wifi size={11} className="text-emerald-700" /> 6-Chair ESP32 Bus Live
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] italic text-slate-600 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-lg">
                <Award size={11} className="text-blue-700" /> Developed by <strong className="not-italic text-slate-900">Sephali Singh</strong>
              </span>
            </div>
            <p className="text-xs italic text-slate-500">
              <strong className="font-bold not-italic text-slate-700">Open Reading Hall</strong> •{' '}
              <span className="text-emerald-700 font-bold not-italic">{counts.Vacant} Vacant</span> ·{' '}
              <span className="text-violet-700 font-bold not-italic">{counts['Pre-booked']} Pre-booked</span> ·{' '}
              <span className="text-rose-700 font-bold not-italic">{counts.Occupied} Studying</span> ·{' '}
              <span className="text-amber-700 font-bold not-italic">{counts['Bag Hogging']} Bag Hogged</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={shuffleSeats}
            className="btn-press flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 px-3 py-1.5 rounded-xl cursor-pointer"
          >
            <Shuffle size={13} /> Shuffle Live
          </button>

          <div className="bg-slate-100 p-1 rounded-xl border border-slate-300 flex items-center gap-1">
            <button
              onClick={() => setWorkspaceMode('table')}
              className={`btn-press flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                workspaceMode === 'table'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 italic hover:text-slate-900'
              }`}
            >
              <Layers size={13} />
              <span>1. 3D Long Table</span>
            </button>
            <button
              onClick={() => setWorkspaceMode('workbench')}
              className={`btn-press flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                workspaceMode === 'workbench'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 italic hover:text-slate-900'
              }`}
            >
              <Cpu size={13} />
              <span>2. 3D Hardware Lab</span>
            </button>
          </div>

          <Link
            href="/portal"
            target="_blank"
            className="btn-press flex items-center gap-2 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl transition-all"
          >
            <span>Student Portal (/portal)</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 my-auto py-1.5">
        <div className="lg:col-span-8 bg-slate-50 border border-slate-300 rounded-2xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Live 6-Chair Matrix{' '}
              <span className="font-normal italic text-slate-500">(Click any chair to inspect or hold for 5m)</span>
            </span>
            <span className="text-[11px] italic text-slate-500">
              Nikhil (12512683) • Sephali Singh (12522159)
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
                  onClick={() => {
                    setClickedId(seat.id);
                    setTimeout(() => setClickedId(null), 250);
                    setSelectedSeat(seat.id);
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all duration-150 ${cardShade(
                    currentStatus,
                    isSelected,
                    loud,
                    clickedId === seat.id
                  )}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{seat.id}</span>
                    <span className="text-[9px] italic px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-300">
                      {seat.zone === 'Silent Zone' ? 'Silent' : 'Collab'}
                    </span>
                  </div>

                  <div className="my-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${pillBadge(
                        currentStatus
                      )}`}
                    >
                      {currentStatus === 'Pre-booked' && <Clock size={10} className="animate-spin" />}
                      {currentStatus}
                    </span>

                    {currentStatus === 'Pre-booked' && seat.prebookedUntil && (
                      <div className="mt-1 flex items-center justify-between bg-violet-200/80 border border-violet-400 px-2 py-0.5 rounded-md">
                        <span className="text-[9px] italic text-violet-900">Hold:</span>
                        <span className="text-[11px] font-bold font-mono text-violet-950">
                          {formatCountdown(seat.prebookedUntil)}
                        </span>
                      </div>
                    )}

                    {currentStatus === 'Vacant' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          bookSeat(seat.id, 5, '12512683', 'Nikhil');
                        }}
                        className="btn-press mt-1.5 w-full text-[10px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white py-1 px-2 rounded-lg transition cursor-pointer"
                      >
                        + Hold 5m
                      </button>
                    )}

                    {loud && (
                      <div className="mt-1 text-[9px] font-bold text-red-800 bg-red-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Volume2 size={10} /> {seat.noiseDb}dB
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-300/80 pt-1.5 text-[10px] flex justify-between items-center">
                    <span className="italic text-slate-600">{seat.irDistance}cm</span>
                    <span className="font-bold text-slate-900">{seat.pressureWeight}kg</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4 Columns: Active Chair ESP32 Telemetry */}
        <div className="lg:col-span-4 bg-slate-50 border border-slate-300 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
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
                <>
                  <button
                    onClick={() => confirmArrivalAndSit(activeSeat.id)}
                    className="btn-press text-[10px] font-bold bg-blue-700 text-white px-2 py-0.5 rounded cursor-pointer"
                  >
                    Sit
                  </button>
                  <button
                    onClick={() => cancelBooking(activeSeat.id)}
                    className="btn-press text-[10px] font-bold italic text-rose-700 bg-white border border-rose-300 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              )}
              <span
                className={`flex items-center gap-1 text-xs font-bold italic px-2.5 py-0.5 rounded-md ${pillBadge(
                  activeStatus
                )}`}
              >
                {activeStatus === 'Pre-booked' && <Clock size={12} />}
                {activeStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 my-2 text-center">
            <div className="bg-white p-2 rounded-xl border border-slate-300">
              <span className="text-[10px] italic text-slate-500 block">IR Sensor</span>
              <span className="text-sm font-bold text-blue-700">{activeSeat.irDistance} cm</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-300">
              <span className="text-[10px] italic text-slate-500 block">Chair FSR</span>
              <span className="text-sm font-bold text-slate-900">{activeSeat.pressureWeight} kg</span>
            </div>
            <div
              className={`p-2 rounded-xl border ${
                activeLoud ? 'bg-red-50 border-red-400' : 'bg-white border-slate-300'
              }`}
            >
              <span className="text-[10px] italic text-slate-500 block">Mic Noise</span>
              <span className={`text-sm font-bold ${activeLoud ? 'text-red-700' : 'text-emerald-700'}`}>
                {activeSeat.noiseDb} dB
              </span>
            </div>
          </div>

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