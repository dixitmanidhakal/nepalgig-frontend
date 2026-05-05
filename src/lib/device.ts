/**
 * NepalgGig — Client-side Device Fingerprint
 *
 * Collects stable, non-PII browser signals and produces a
 * 64-char SHA-256 hex hash that identifies the device.
 *
 * Signals used:
 *  • userAgent          — browser + OS string
 *  • screen resolution  — width × height × colorDepth
 *  • timezone           — IANA timezone name (e.g. "Asia/Kathmandu")
 *  • language           — navigator.language (e.g. "ne-NP", "en-US")
 *  • canvas fingerprint — GPU/font rendering signature (2D canvas)
 *  • platform           — navigator.platform (Win32, MacIntel, Linux …)
 *
 * The hash is deterministic for the same browser on the same device.
 * It changes if the user switches browsers or devices (intended).
 *
 * Usage:
 *   import { getDeviceHash } from '@/lib/device';
 *   const hash = await getDeviceHash();   // "a3f9c2…" (64 hex chars)
 */

/** Draw a canvas and return its data-URL for GPU/font fingerprinting */
function canvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width  = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    // Text rendering — font hinting differences reveal GPU/OS/driver
    ctx.textBaseline = 'top';
    ctx.font         = '14px "Arial"';
    ctx.fillStyle    = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle    = '#069';
    ctx.fillText('NepalgGig🇳🇵', 2, 15);
    ctx.fillStyle    = 'rgba(102,204,0,0.7)';
    ctx.fillText('NepalgGig🇳🇵', 4, 17);

    return canvas.toDataURL();
  } catch {
    return 'canvas-blocked';
  }
}

/** Hash an arbitrary string with SHA-256, returning a 64-char hex string */
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data    = encoder.encode(input);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Collect stable browser signals into a single fingerprint string */
function collectSignals(): string {
  const parts: string[] = [
    navigator.userAgent,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    navigator.platform ?? 'unknown',
    canvasFingerprint(),
  ];
  return parts.join('||');
}

// Cache the hash for the lifetime of the page — only compute once
let _cachedHash: string | null = null;

/**
 * Returns the SHA-256 device fingerprint hash (64 hex chars).
 * Result is memoized for the current page load.
 */
export async function getDeviceHash(): Promise<string> {
  if (_cachedHash) return _cachedHash;
  const signals = collectSignals();
  _cachedHash   = await sha256(signals);
  return _cachedHash;
}

/**
 * Synchronously return the cached hash (null if not yet computed).
 * Call getDeviceHash() first and await it before using this.
 */
export function getCachedDeviceHash(): string | null {
  return _cachedHash;
}

// ── Cookie name ───────────────────────────────────────────
export const DEVICE_COOKIE = 'ng_device';
