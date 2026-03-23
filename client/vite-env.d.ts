/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Privy Dashboard → App ID */
  readonly VITE_PRIVY_APP_ID: string;
  /** Optional: API origin when the SPA is hosted separately (no trailing slash), e.g. https://api.example.com */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
