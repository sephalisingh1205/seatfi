// src/app/page.js
import OutsideKiosk from '@/components/ui/OutsideKiosk';
import HardwareRig3D from '@/components/3d/HardwareRig3D';

export default function SeatFiMasterView() {
  return (
    <main
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-800 select-none relative"
    >
      {/* Live Animated Background Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="animate-float-slow absolute -top-24 -left-24 w-96 h-96 bg-blue-300/25 rounded-full blur-3xl" />
        <div className="animate-float-reverse absolute top-1/3 -right-24 w-96 h-96 bg-indigo-300/25 rounded-full blur-3xl" />
      </div>

      {/* TOP HALF: Professional Outside Library Kiosk */}
      <section className="h-[46%] w-full border-b border-slate-200/90 bg-white/90 backdrop-blur-xl z-10 shadow-xs relative">
        <OutsideKiosk />
      </section>

      {/* BOTTOM HALF: High-Visibility 3D Hardware Studio */}
      <section className="h-[54%] w-full relative z-10">
        <HardwareRig3D />
      </section>
    </main>
  );
}