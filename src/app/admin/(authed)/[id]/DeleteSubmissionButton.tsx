'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeleteSubmissionButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (!confirm('Wirklich löschen? Alle PDFs werden hart gelöscht — kein Undo.')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        alert('Löschen fehlgeschlagen.');
        return;
      }
      router.replace('/admin');
      router.refresh();
    } catch {
      alert('Netzwerkfehler.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="text-sm text-red-700 hover:text-red-900 border border-red-200 hover:bg-red-50 rounded-full px-4 py-2 disabled:opacity-50"
    >
      {busy ? 'Lösche…' : 'Löschen'}
    </button>
  );
}
