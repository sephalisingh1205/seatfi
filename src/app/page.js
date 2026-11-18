// src/app/page.js
import OutsideKiosk from '@/components/ui/OutsideKiosk';
import HardwareRig3D from '@/components/3d/HardwareRig3D';

export default function SeatFiMasterView() {
  return (
    <main
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 select-none relative"
    >
      {/* TOP HALF: Solid Professional Outside Library Kiosk */}
      <section className="h-[46%] w-full border-b border-slate-300 bg-white z-10 relative">
        <OutsideKiosk />
      </section>

      {/* BOTTOM HALF: High-Visibility 3D Hardware Studio */}
      <section className="h-[54%] w-full relative z-10">
        <HardwareRig3D />
      </section>
    </main>
  );
}