'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || 'Login fehlgeschlagen');
        return;
      }
      router.replace('/admin');
      router.refresh();
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="qcg-card max-w-sm w-full p-7"
      >
        <h1 className="font-serif text-2xl font-medium text-ink mb-1">QCG Admin · Login</h1>
        <p className="text-sm text-ink-mute mb-6">Nur für Administrator:innen.</p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="qcg-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="qcg-input"
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="qcg-label">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="qcg-input"
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-[10px] px-3 py-2">
              {error}
            </div>
          )}
          <button type="submit" disabled={busy} className="qcg-btn justify-center">
            {busy ? 'Anmelden…' : 'Anmelden'}
          </button>
        </div>
      </form>
    </div>
  );
}
