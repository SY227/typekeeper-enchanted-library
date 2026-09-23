/** Same runtime supports both normal local assets and the self-contained PLAY.html export. */
export function asset(path) { return globalThis.__TM_EMBEDDED_ASSETS__?.[path] || path; }
