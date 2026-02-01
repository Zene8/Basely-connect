import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-gray-300 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-gray-900/50 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-white mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          Terms and Conditions
        </h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using Basely Connect, you agree to be bound by these Terms and Conditions.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>Basely Connect provides AI-powered job matching by analyzing GitHub profiles and uploaded resumes. We provide recommendations and matches based on available data but do not guarantee employment or specific outcomes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. User Data</h2>
            <p>You grant Basely Connect permission to access your public GitHub data and any files you upload (like resumes) for the purpose of generating matches. We do not store your full resume or code permanently beyond the session analysis, only the resulting match data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Intellectual Property</h2>
            <p>The platform, its AI logic, and design are the property of Basely. You maintain ownership of your original content (resumes, code).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Limitation of Liability</h2>
            <p>Basely Connect is provided &quot;as is&quot;. We are not responsible for the accuracy of AI-generated matches or the practices of matched companies.</p>
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
