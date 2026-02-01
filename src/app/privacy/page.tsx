import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-gray-300 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-gray-900/50 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-white mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          Privacy Policy
        </h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data Collection</h2>
            <p>We collect information you provide directly to us through GitHub OAuth and resume uploads. This includes your name, email, GitHub handle, and technical experience.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data Storage</h2>
            <p>We do not store your full technical portfolio or resume content permanently. Our database primarily stores:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Authentication details (Email, GitHub Handle)</li>
              <li>Generated match results (Company Name, Match Score)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data Usage</h2>
            <p>Your data is used solely to generate company matches and facilitate potential introductions. Match results are forwarded to our internal team to assist in the process.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Third Parties</h2>
            <p>We use OpenAI for semantic analysis and Neon for database hosting. We do not sell your personal data to third parties.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
