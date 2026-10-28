import type { RoutingStrategy } from '../utils/routing.js';

export type { RoutingStrategy } from '../utils/routing.js';

export interface AppearanceVariables {
  colorPrimary?: string;
  colorPrimaryHover?: string;
  colorDanger?: string;
  borderRadius?: string;
  fontFamily?: string;
}

export interface Appearance {
  variables?: AppearanceVariables;
  elements?: Partial<Record<string, string>>;
}

export interface AppearanceProps {
  appearance?: Appearance;
}

export interface BaseAuthComponentProps extends AppearanceProps {
  routing?: RoutingStrategy;
  className?: string;
}

export interface SignInProps extends BaseAuthComponentProps {
  signUpUrl?: string;
  forgotPasswordUrl?: string;
  afterSignInUrl?: string;
}

export interface SignUpProps extends BaseAuthComponentProps {
  signInUrl?: string;
  /** Optional destination after sending the verification link, not after verification. */
  afterSignUpUrl?: string;
}

export interface VerifyEmailProps extends BaseAuthComponentProps {
  signInUrl?: string;
  afterVerificationUrl?: string;
  token?: string;
}

export interface ConfirmEmailChangeProps extends BaseAuthComponentProps {
  signInUrl?: string;
  profileUrl?: string;
  afterConfirmUrl?: string;
  token?: string;
}

export interface UserButtonProps extends AppearanceProps {
  className?: string;
  afterSignOutUrl?: string;
  showName?: boolean;
}

export interface UserProfileProps extends AppearanceProps {
  className?: string;
}

export interface AuthNotificationsProps extends AppearanceProps {
  className?: string;
  /** Auto-dismiss delay; `0` keeps each notification until dismissed. */
  durationMs?: number;
}

export interface ForgotPasswordProps extends BaseAuthComponentProps {
  signInUrl?: string;
  afterSubmitUrl?: string;
}

export interface ResetPasswordProps extends BaseAuthComponentProps {
  signInUrl?: string;
  forgotPasswordUrl?: string;
  afterResetUrl?: string;
  token?: string;
}
