import { randomBytes } from 'node:crypto';
import { ensureTables, getDb } from './db';

const DEFAULT_TTL_SEC = 60 * 60; // 1 hour

export type FileTokenRow = {
  token: string;
  file_id: string;
  expires_at: string;
  used_at: string | null;
};

export type RedeemedFile = {
  fileId: string;
  blobPath: string;
  blobUrl: string;
  fileName: string;
  kind: string;
};

function newTokenString(): string {
  // 32 bytes ≈ 256 bits entropy → 43 chars base64url
  return randomBytes(32).toString('base64url');
}

/**
 * Creates a one-use token for the given submission_files.id.
 * Returns the token string. The caller is responsible for embedding it
 * in a URL like `/api/internal/file/{token}`.
 */
export async function createFileToken(
  fileId: string,
  ttlSec: number = DEFAULT_TTL_SEC,
): Promise<string> {
  await ensureTables();
  const sql = getDb();
  const token = newTokenString();
  const expiresAt = new Date(Date.now() + ttlSec * 1000).toISOString();
  await sql`
    INSERT INTO file_tokens (token, file_id, expires_at)
    VALUES (${token}, ${fileId}, ${expiresAt})
  `;
  return token;
}

/**
 * Atomically marks a token as used and returns the associated file row.
 * Returns null if the token is invalid, expired, or already used.
 *
 * Uses a single UPDATE … WHERE used_at IS NULL AND expires_at > now() RETURNING …
 * pattern so that two concurrent requests can't both succeed (1-use guarantee).
 */
export async function redeemFileToken(
  token: string,
  ip: string | null,
  userAgent: string | null,
): Promise<RedeemedFile | null> {
  if (!token || token.length < 20) return null;

  await ensureTables();
  const sql = getDb();

  const rows = await sql`
    WITH redeemed AS (
      UPDATE file_tokens
      SET used_at = now(),
          used_ip = ${ip},
          used_user_agent = ${userAgent}
      WHERE token = ${token}
        AND used_at IS NULL
        AND expires_at > now()
      RETURNING file_id
    )
    SELECT
      sf.id::text   AS file_id,
      sf.blob_path  AS blob_path,
      sf.blob_url   AS blob_url,
      sf.file_name  AS file_name,
      sf.kind       AS kind
    FROM redeemed r
    JOIN submission_files sf ON sf.id = r.file_id
  `;

  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    fileId: r.file_id as string,
    blobPath: r.blob_path as string,
    blobUrl: r.blob_url as string,
    fileName: r.file_name as string,
    kind: r.kind as string,
  };
}

/** Used by submit-route to compute the public-facing URL the customer/Zapier should call. */
export function buildTokenUrl(origin: string, token: string): string {
  const trimmed = origin.replace(/\/+$/, '');
  return `${trimmed}/api/internal/file/${encodeURIComponent(token)}`;
}
