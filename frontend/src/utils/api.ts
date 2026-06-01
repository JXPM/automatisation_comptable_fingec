// Base URL of the FastAPI backend.
// - Dev: empty → Vite proxy (vite.config.ts) forwards /process, /download, /logs to localhost:8000
// - Prod: set VITE_API_URL on Vercel (e.g. https://api.fingec.app) to point at the deployed backend
export const API_URL: string = import.meta.env.VITE_API_URL ?? "";
