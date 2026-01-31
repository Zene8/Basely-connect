'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 w-full z-50 bg-basely-dark/80 backdrop-blur-md border-b border-basely-orange/15">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 bg-basely-orange/20 rounded-lg blur group-hover:blur-md transition-all duration-300"></div>
            <div className="relative w-full h-full bg-gradient-to-br from-basely-orange to-orange-600 rounded-lg flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform">
              <span className="font-mono text-white font-bold text-xl">B</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-lg tracking-tight group-hover:text-basely-orange transition-colors">Basely</span>
            <span className="font-mono text-basely-orange text-xs tracking-[0.2em] uppercase opacity-80">Connect</span>
          </div>
        </Link>

        {/* Auth Action */}
        <div>
          {session ? (
            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="font-mono text-xs text-basely-orange uppercase tracking-wide">Operator</span>
                <span className="text-white text-sm font-medium">{session.user?.name}</span>
              </div>
              
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-xs font-mono text-gray-400 hover:text-white border border-transparent hover:border-basely-orange/30 rounded transition-all uppercase tracking-wider"
              >
                Disconnect
              </button>
              
              {session.user?.image && (
                <div className="relative">
                  <div className="absolute -inset-1 bg-basely-orange/30 rounded-full blur-sm"></div>
                  <img 
                    src={session.user.image} 
                    alt="Profile" 
                    className="relative w-10 h-10 rounded-full border border-basely-orange/30"
                  />
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signIn('github')}
              className="relative overflow-hidden group px-6 py-2.5 rounded bg-basely-navy border border-basely-orange/20 hover:border-basely-orange/50 transition-all"
            >
              <div className="absolute inset-0 bg-basely-orange/5 group-hover:bg-basely-orange/10 transition-colors"></div>
              <div className="relative flex items-center gap-2">
                <svg className="w-4 h-4 text-basely-orange" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <span className="font-mono text-sm font-bold text-white group-hover:text-basely-orange transition-colors">INIT_GITHUB_AUTH</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}