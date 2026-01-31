'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-[#27272a]/50 bg-[#09090b]/60 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)] group-hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[#fafafa] font-bold text-lg tracking-tight">Basely</span>
            <span className="text-cyan-400 font-mono text-[10px] tracking-[0.2em] uppercase font-bold opacity-80">Connect</span>
          </div>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
          <a href="#companies" className="text-sm text-gray-400 hover:text-white transition-colors">Companies</a>
        </div>

        {/* Auth Action */}
        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[#fafafa] text-xs font-medium">{session.user?.name}</span>
                <button onClick={() => signOut()} className="text-[10px] text-cyan-400 hover:text-cyan-300 uppercase tracking-widest font-bold">Disconnect</button>
              </div>
              <img 
                src={session.user?.image || ''} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-[#27272a] shadow-sm"
              />
            </div>
          ) : (
            <button
              onClick={() => signIn('github')}
              className="px-4 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-[#fafafa] text-xs font-bold uppercase tracking-widest transition-all border border-[#27272a] hover:border-cyan-500/50"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
