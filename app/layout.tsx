import type { Metadata } from 'next';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import './globals.css';
import { RealtimeListener } from '@/components/RealtimeListener';

const inter = Inter({ subsets: ['latin'] });

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/budgets', label: 'Budgets' },
  { href: '/grants', label: 'Grants' },
  { href: '/allocations', label: 'Allocations' },
  { href: '/actuals', label: 'Actuals' },
  { href: '/scenarios', label: 'Scenarios' },
];

export const metadata: Metadata = {
  title: 'HiiiWAV Budgeting Platform',
  description: 'Budgeting, allocations, and scenario planning for HiiiWAV.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}> 
        <div className="flex min-h-screen flex-col">
          <header className="border-b bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/dashboard" className="text-xl font-semibold">
                HiiiWAV Finance Ops
              </Link>
              <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="hover:text-slate-900">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
            <RealtimeListener />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

