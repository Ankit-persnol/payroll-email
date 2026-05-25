// Thin wrapper around the IPC bridge exposed by electron/preload.js.
// In dev (npm run dev) this runs inside Electron; window.api is defined.
// If you open the Vite URL in a normal browser, calls will throw —
// that's expected (no Node/SQLite/SMTP in a browser).
export const api = typeof window !== 'undefined' && window.api
  ? window.api
  : new Proxy({}, { get: () => () => Promise.reject(new Error('Electron bridge unavailable — run via `npm run dev`')) });
