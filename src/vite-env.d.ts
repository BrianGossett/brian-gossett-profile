/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the HTTP API, no trailing slash. */
  readonly VITE_API_URL?: string
  /** Cognito hosted sign-in domain, e.g. https://name.auth.us-east-2.amazoncognito.com */
  readonly VITE_COGNITO_DOMAIN?: string
  /** Cognito web client ID. */
  readonly VITE_COGNITO_CLIENT_ID?: string
  /** Where the score PDFs are stored, ending in /scores. Unset: served from the site itself. */
  readonly VITE_SCORES_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
