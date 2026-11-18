// src/app/layout.js
import './globals.css';

export const metadata = {
  title: 'SEATFI // Smart Library IoT System — Developed by Sephali Singh',
  description: 'ESP32 + IR + FSR Real-Time Library Seat Telemetry & 5-Min Express Hold',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        className="h-full antialiased bg-slate-100 text-slate-900 selection:bg-slate-900 selection:text-white"
      >
        {children}
      </body>
    </html>
  );
}