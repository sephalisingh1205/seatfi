// src/app/layout.js
import './globals.css';

export const metadata = {
  title: 'SEATFI: Smart Library IoT Occupancy System',
  description: 'Developed bt SEPHALI SINGH',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        className="h-full antialiased bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white"
      >
        {children}
      </body>
    </html>
  );
}