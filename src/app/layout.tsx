import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import './globals.css';
import './tailwind-built.css';

export const metadata: Metadata = {
  title: 'CNC OptiTool | Industrial Tool Wear & Cutting Optimization Platform',
  description: 'Shop-floor CNC tool wear tracking, Taylor tool life prediction, MRR productivity calculator, and multi-axis cutting economics optimization.',
};

// Ensure critical Tailwind styling is embedded directly into HTML head
function getInlineCss(): string {
  try {
    const cssPath = path.join(process.cwd(), 'src', 'app', 'tailwind-built.css');
    if (fs.existsSync(cssPath)) {
      return fs.readFileSync(cssPath, 'utf8');
    }
  } catch (e) {
    // fallback gracefully
  }
  return '';
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const inlineCss = getInlineCss();

  return (
    <html lang="en" className="dark bg-[#070b14] text-slate-100" style={{ backgroundColor: '#070b14', color: '#f1f5f9' }}>
      <head>
        {inlineCss ? (
          <style id="critical-tailwind-css" dangerouslySetInnerHTML={{ __html: inlineCss }} />
        ) : null}
      </head>
      <body
        className="min-h-screen bg-[#070b14] text-slate-100 antialiased selection:bg-cyan-500 selection:text-black font-sans"
        style={{ backgroundColor: '#070b14', color: '#f1f5f9' }}
      >
        {children}
      </body>
    </html>
  );
}
