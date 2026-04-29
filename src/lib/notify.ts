export type SubmissionNotifyPayload = {
  submissionId: string;
  createdAt: string;
  firma: string;
  branche: string;
  ansprechpartner: string;
  contactName?: string;
  contactEmail?: string;
  mitarbeiterCount: number;
  mitarbeiter: Array<{
    id: string;
    name: string;
    beschaeftigungAls?: string;
    vertical?: string;
    moduleCount?: number;
    preis?: number;
  }>;
  adminUrl: string;
};

export async function notifyZapier(payload: SubmissionNotifyPayload): Promise<void> {
  const url = process.env.ZAPIER_WEBHOOK_URL;
  if (!url) {
    console.warn('[notify] ZAPIER_WEBHOOK_URL not set, skipping');
    return;
  }

  const body = JSON.stringify(payload);
  const attempt = async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!res.ok) throw new Error(`webhook ${res.status}`);
    } finally {
      clearTimeout(t);
    }
  };

  try {
    await attempt();
  } catch (err) {
    console.warn('[notify] first attempt failed, retrying once:', err);
    try {
      await attempt();
    } catch (err2) {
      console.error('[notify] webhook delivery failed (non-fatal):', err2);
    }
  }
}
