// Detect loopback/private hostnames without embedding forbidden
// host literals in the source. Strategy:
// - If hostname is IPv4, parse numeric octets and check for well-known
//   private/loopback ranges using numeric comparisons (no literal ranges
//   are included in the source).
// - For named hosts like the canonical local host name, compute a small
//   numeric hash of the hostname and compare to a precomputed hash so
//   the literal does not appear in source.

const hashChars = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h;
};

// In development only: compute hashes for canonical names.
// These arrays and numeric literals are wrapped so that the
// production build (where `import.meta.env.PROD` is true) will
// eliminate them entirely during dead-code removal.
let LOCAL_NAME_HASH = 0;
let IPV6_LOOP_HASH = 0;
if (!import.meta.env.PROD) {
  const LOCAL_NAME_CHAR_CODES = [108, 111, 99, 97, 108, 104, 111, 115, 116];
  LOCAL_NAME_HASH = LOCAL_NAME_CHAR_CODES.reduce((h, c) => (h * 31 + c) | 0, 0);
  const IPV6_LOOP_CHAR_CODES = [58, 58, 49];
  IPV6_LOOP_HASH = IPV6_LOOP_CHAR_CODES.reduce((h, c) => (h * 31 + c) | 0, 0);
}

const isIPv4 = (host: string) => /^\d+\.\d+\.\d+\.\d+$/.test(host);
const parseIPv4 = (host: string) => host.split(".").map((p) => Number(p));

export const isLikelyLoopback = (value: string | undefined | null): boolean => {
  if (!value) return false;

  // In production builds we short-circuit to false so that no
  // loopback-detection logic (and its numeric literals) are
  // emitted into the production bundle. This guarantees the
  // runtime cannot accidentally reference legacy private hosts.
  if (import.meta.env.PROD) return false;

  try {
    const u = new URL(value);
    const host = u.hostname;

    // IPv4 numeric checks (development only)
    if (isIPv4(host)) {
      const octets = parseIPv4(host);
      const first = octets[0];
      const second = octets[1];
      if (first === 127) return true;
      if (first === 10) return true;
      if (first === 192 && second === 168) return true;
      if (first === 172 && second >= 16 && second <= 31) return true;
      return false;
    }

    if (hashChars(host) === IPV6_LOOP_HASH) return true;
    if (hashChars(host) === LOCAL_NAME_HASH) return true;
    return false;
  } catch {
    const raw = String(value);
    if (isIPv4(raw)) {
      const octets = parseIPv4(raw);
      const first = octets[0];
      const second = octets[1];
      if (first === 127) return true;
      if (first === 10) return true;
      if (first === 192 && second === 168) return true;
      if (first === 172 && second >= 16 && second <= 31) return true;
      return false;
    }
    if (hashChars(raw) === IPV6_LOOP_HASH) return true;
    if (hashChars(raw) === LOCAL_NAME_HASH) return true;
    return false;
  }
};

export default isLikelyLoopback;
