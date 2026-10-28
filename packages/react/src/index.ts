export { AuthProvider } from './context/AuthProvider.js';
export type { AuthProviderProps } from './context/AuthProvider.js';
export { AuthContext } from './context/AuthContext.js';
export type { AuthContextValue, AuthState } from './context/AuthContext.js';

export { useAuthNavigate } from './hooks/useAuthNavigate.js';
export { useAuthPages } from './hooks/useAuthPages.js';
export { useAuth } from './hooks/useAuth.js';
export { useAuthNotifications } from './hooks/useAuthNotifications.js';
export type {
  AuthNotification,
  AuthNotificationCode,
} from './hooks/useAuthNotifications.js';
export { useLocale } from './hooks/useLocale.js';
export { i18nConfig } from './i18n/config.js';
export type { Locale } from './i18n/config.js';
export { useUser } from './hooks/useUser.js';
export { useSignIn } from './hooks/useSignIn.js';
export { useSignUp } from './hooks/useSignUp.js';
export { useVerifyEmail } from './hooks/useVerifyEmail.js';
export { useSession } from './hooks/useSession.js';
export { useForgotPassword } from './hooks/useForgotPassword.js';
export { useResetPassword } from './hooks/useResetPassword.js';
export { useVerifyResetToken } from './hooks/useVerifyResetToken.js';
export { useConfirmEmailChange } from './hooks/useConfirmEmailChange.js';

export type { AuthPages } from '@mysamyr/core/endpoints';
export { DEFAULT_PAGES } from '@mysamyr/core/endpoints';
export type {
  UserDTO,
  SessionDTO,
  ReauthenticationAction,
  ReauthenticationDTO,
  VerifyReauthenticationDTO,
} from '@mysamyr/client';
export { AuthApiError, KeychainClient } from '@mysamyr/client';
