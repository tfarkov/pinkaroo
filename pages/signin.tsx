import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn, getProviders } from 'next-auth/react';
import { useRouter } from 'next/router';

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <circle cx="22" cy="22" r="22" fill="#db2777" />
      <text x="22" y="29" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="system-ui,sans-serif">P</text>
    </svg>
  );
}

export default function SignIn() {
  const router = useRouter();
  const { callbackUrl } = router.query;
  const [providers, setProviders] = useState<Awaited<ReturnType<typeof getProviders>>>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [showDevHint, setShowDevHint] = useState(false);

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  useEffect(() => {
    setShowDevHint(process.env.NODE_ENV === 'development');
  }, []);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const emailTrimmed = email.trim();
    const passwordTrimmed = password.trim();
    if (!emailTrimmed) {
      setError('Email is required.');
      return;
    }
    if (!passwordTrimmed) {
      setError('Password is required.');
      return;
    }
    setLoading(true);
    const res = await signIn('credentials', {
      email: emailTrimmed,
      password: passwordTrimmed,
      redirect: false,
      callbackUrl: typeof callbackUrl === 'string' ? callbackUrl : '/',
    });
    setLoading(false);
    if (res?.error) {
      setError('Invalid email or password.');
      return;
    }
    if (res?.url) router.push(res.url);
  };

  const redirectUrl = typeof callbackUrl === 'string' ? callbackUrl : '/';
  const oauthProviders = providers ? Object.entries(providers).filter(([id]) => id !== 'credentials') : [];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-header px-4 py-12">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Branding */}
        <Link href="/" className="flex flex-col items-center gap-3 mb-10 text-white hover:text-white">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden">
            {logoError ? (
              <LogoIcon className="w-10 h-10 text-white" />
            ) : (
              <img
                src="/logo.png"
                alt=""
                width={64}
                height={64}
                className="w-full h-full object-contain bg-transparent rounded-full"
                onError={() => setLogoError(true)}
              />
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Pinkaroo</h1>
          <p className="text-white/90 text-lg">find a house. make it a home.</p>
        </Link>

        {/* Sign-in card */}
        <div className="w-full bg-white rounded-lg shadow-card border border-slate-200 p-6 text-left">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Sign in</h2>

          {error && (
            <p className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm" role="alert">
              {error}
            </p>
          )}

          {providers?.credentials && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4 mb-6">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="password" className="label">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  required
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Signing in…' : 'Sign in with email'}
              </button>
            </form>
          )}

          {showDevHint && (
            <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm font-medium text-amber-900 mb-2">Local testing: emulate signed-in session</p>
              <p className="text-xs text-amber-800 mb-3">
                No database required. Role is set by <code className="bg-amber-100 px-1 rounded">EMULATE_SESSION_ROLE</code> (default: REALTOR). Restart dev server after changing.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEmail('emulate@local');
                  setPassword('emulate');
                  setError(null);
                }}
                className="text-sm font-medium text-amber-800 underline hover:no-underline"
              >
                Fill emulate credentials
              </button>
              <span className="text-amber-700 text-sm mx-2">then click “Sign in with email”.</span>
            </div>
          )}

          {oauthProviders.length > 0 && (
            <>
              {providers?.credentials && (
                <p className="text-slate-500 text-sm text-center mb-3">or continue with</p>
              )}
              <div className="flex flex-col gap-2">
                {oauthProviders.map(([id, provider]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => signIn(id, { callbackUrl: redirectUrl })}
                    className="w-full px-4 py-2.5 rounded-md border border-slate-300 bg-white text-slate-800 font-medium hover:bg-slate-50 transition-colors"
                  >
                    {provider.name}
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/" className="text-accent-600 font-medium hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
