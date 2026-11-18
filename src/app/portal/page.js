// src/app/portal/page.js
'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useSeatStore, computeNodeStatus } from '@/store/useSeatStore';
import { Smartphone, ArrowLeft, Wifi } from 'lucide-react';

export default function StudentMobilePortal() {
  const { seats, syncFromStorage } = useSeatStore();

  useEffect(() => {
    const cached = localStorage.getItem('seatfi_live_state_v2');
    if (cached) syncFromStorage(JSON.parse(cached));

    const handleStorage = (e) => {
      if (e.key === 'seatfi_live_state_v2' && e.newValue) {
        syncFromStorage(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [syncFromStorage]);

  const chairBadge = (status) => {
    if (status === 'Occupied') return 'bg-rose-100 text-rose-800 border-rose-300';
    if (status === 'Bag Hogging') return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  };

  return (
    <div
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 text-slate-900 p-6"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 bg-white/80 backdrop-blur-md p-5 rounded-3xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
              <Smartphone size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                SEATFI <span className="font-normal italic text-slate-500">// Student Web Portal</span>
              </h1>
              <p className="text-xs italic text-slate-500">
                Live Partition-Free Shared Reading Table Map • Molded Plastic Chairs Both Sides
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold italic bg-slate-900 text-white px-4 py-2.5 rounded-full hover:bg-blue-700 transition"
          >
            <ArrowLeft size={14} /> Back to Split Simulator
          </Link>
        </div>

        {/* Shared Long Table Schematic (North Side Plastic Chairs + Table Surface + South Side Plastic Chairs) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              North Side Plastic Chairs (Facing South)
            </span>
            <span className="text-xs font-bold italic text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <Wifi size={12} /> Synced with ESP32 Bus
            </span>
          </div>

          {/* North Row */}
          <div className="grid grid-cols-3 gap-6">
            {seats.slice(0, 3).map((seat) => {
              const status = computeNodeStatus(seat.irDistance, seat.pressureWeight);
              return (
                <div
                  key={seat.id}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${chairBadge(status)}`}
                >
                  <span className="text-base font-bold block">{seat.id}</span>
                  <span className="text-xs font-bold italic uppercase">{status}</span>
                  <p className="text-[11px] italic mt-1 opacity-80">
                    IR: {seat.irDistance}cm • Load: {seat.pressureWeight}kg
                  </p>
                </div>
              );
            })}
          </div>

          {/* Continuous Unpartitioned Wooden Table Surface */}
          <div className="h-28 w-full rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white flex flex-col items-center justify-center shadow-inner border-4 border-amber-700/30">
            <span className="text-sm font-bold tracking-widest uppercase">
              Shared Wooden Library Reading Table (No Partitions / Dividers)
            </span>
            <span className="text-xs italic opacity-90 mt-1">
              Under-table ESP32 Bus + 6 Directional IR Obstacle Sensors
            </span>
          </div>

          {/* South Row */}
          <div className="grid grid-cols-3 gap-6">
            {seats.slice(3, 6).map((seat) => {
              const status = computeNodeStatus(seat.irDistance, seat.pressureWeight);
              return (
                <div
                  key={seat.id}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${chairBadge(status)}`}
                >
                  <span className="text-base font-bold block">{seat.id}</span>
                  <span className="text-xs font-bold italic uppercase">{status}</span>
                  <p className="text-[11px] italic mt-1 opacity-80">
                    IR: {seat.irDistance}cm • Load: {seat.pressureWeight}kg
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}