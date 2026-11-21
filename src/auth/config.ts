const trim = (v: string | undefined) => (v ?? '').trim().replace(/\/+$/, '')

export interface AuthConfig {
  apiUrl: string
  cognitoDomain: string
  clientId: string
}

export const authConfig: AuthConfig = {
  apiUrl: trim(import.meta.env.VITE_API_URL),
  cognitoDomain: trim(import.meta.env.VITE_COGNITO_DOMAIN),
  clientId: trim(import.meta.env.VITE_COGNITO_CLIENT_ID),
}

/** False when the build has no sign-in settings; the app then runs signed out only. */
export const isAuthConfigured = (config: AuthConfig = authConfig) =>
  config.apiUrl !== '' && config.cognitoDomain !== '' && config.clientId !== ''

/** Cognito only returns to /todo, on whichever origin the app is served from. */
export const CALLBACK_PATH = '/todo'
export const redirectUri = () => `${window.location.origin}${CALLBACK_PATH}`
