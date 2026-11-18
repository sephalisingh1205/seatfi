// src/components/ui/OutsideKiosk.jsx
'use client';
import Link from 'next/link';
import { Monitor, Wifi, ExternalLink, ShieldAlert, CheckCircle2, UserCheck, Cpu, Layers } from 'lucide-react';
import { useSeatStore, computeNodeStatus } from '@/store/useSeatStore';

export default function OutsideKiosk() {
  const { seats, selectedSeatId, setSelectedSeat, workspaceMode, setWorkspaceMode } = useSeatStore();
  const activeSeat = seats.find((s) => s.id === selectedSeatId) || seats[0];
  const activeStatus = computeNodeStatus(activeSeat.irDistance, activeSeat.pressureWeight);

  const cardShade = (status, isSelected) => {
    const ring = isSelected ? 'ring-2 ring-blue-600 shadow-md scale-[1.01] ' : 'shadow-xs opacity-90 hover:opacity-100 ';
    if (status === 'Occupied')
      return ring + 'bg-gradient-to-b from-white to-rose-50/80 border-rose-200 text-rose-900';
    if (status === 'Bag Hogging')
      return ring + 'bg-gradient-to-b from-white to-amber-50/80 border-amber-200 text-amber-900';
    return ring + 'bg-gradient-to-b from-white to-emerald-50/80 border-emerald-200 text-emerald-900';
  };

  const pillBadge = (status) => {
    if (status === 'Occupied') return 'bg-rose-100 text-rose-800 border border-rose-200';
    if (status === 'Bag Hogging') return 'bg-amber-100 text-amber-800 border border-amber-200';
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
                <Wifi size={11} className="text-emerald-600" /> 6-Chair Bus Online
              </span>
            </div>
            <p className="text-xs italic text-slate-500">
              <strong className="font-bold not-italic text-slate-700">Open Reading Table #1</strong> • Partition-Free Shared Long Table (Plastic Chairs Both Sides)
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
            <span>Student Portal</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 my-auto py-1.5">
        {/* Left 8 Columns: Shared Long Table Visual Schematic (North & South Plastic Chairs) */}
        <div className="lg:col-span-8 bg-slate-100/70 border border-slate-200/90 rounded-2xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Shared Reading Table Layout <span className="font-normal italic">(Click any plastic chair to simulate its sensors)</span>
            </span>
            <span className="text-[11px] italic text-slate-500">No dividers • Molded plastic chairs</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {seats.map((seat) => {
              const currentStatus = computeNodeStatus(seat.irDistance, seat.pressureWeight);
              const isSelected = seat.id === selectedSeatId;
              return (
                <div
                  key={seat.id}
                  onClick={() => setSelectedSeat(seat.id)}
                  className={`p-3 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${cardShade(
                    currentStatus,
                    isSelected
                  )}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{seat.id}</span>
                    {isSelected && (
                      <span className="text-[9px] font-bold italic bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="my-2">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${pillBadge(currentStatus)}`}>
                      {currentStatus}
                    </span>
                  </div>

                  <div className="border-t border-slate-200/60 pt-1.5 text-[10px] flex justify-between">
                    <span className="italic text-slate-500">{seat.side.split('•')[0]}</span>
                    <span className="font-bold text-slate-700">{seat.pressureWeight}kg</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4 Columns: Active Chair ESP32 Telemetry */}
        <div className="lg:col-span-4 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 border border-slate-200/90 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Chair {activeSeat.id} Telemetry
              </span>
              <p className="text-[11px] italic text-slate-500">{activeSeat.side}</p>
            </div>
            <span className={`text-xs font-bold italic px-3 py-0.5 rounded-full ${pillBadge(activeStatus)}`}>
              {activeStatus}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 my-2 text-center">
            <div className="bg-white p-2 rounded-xl border border-slate-200/80">
              <span className="text-[10px] italic text-slate-500 block">IR Sensor</span>
              <span className="text-sm font-bold text-blue-700">{activeSeat.irDistance} cm</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-200/80">
              <span className="text-[10px] italic text-slate-500 block">Plastic Seat FSR</span>
              <span className="text-sm font-bold text-indigo-700">{activeSeat.pressureWeight} kg</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-200/80">
              <span className="text-[10px] italic text-slate-500 block">ESP32 ADC</span>
              <span className="text-sm font-bold text-teal-700">
                {Math.min(4095, Math.round((activeSeat.pressureWeight / 95) * 4095))}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-700 bg-slate-100/80 px-3 py-1.5 rounded-xl flex items-center gap-2">
            {activeStatus === 'Occupied' && <UserCheck size={14} className="text-rose-600 shrink-0" />}
            {activeStatus === 'Bag Hogging' && <ShieldAlert size={14} className="text-amber-600 shrink-0" />}
            {activeStatus === 'Vacant' && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
            <span className="italic truncate">
              <strong className="font-bold not-italic">Logic: </strong>
              {activeStatus === 'Occupied' && 'IR < 65cm & Weight >= 25kg (Student Seated)'}
              {activeStatus === 'Bag Hogging' && 'IR > 65cm & Weight >= 3kg (Bag on Chair)'}
              {activeStatus === 'Vacant' && 'No load on plastic shell & IR path unobstructed'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}