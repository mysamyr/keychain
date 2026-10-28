import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';

import {
  AuthProvider,
  DEFAULT_PAGES,
  i18nConfig,
  useAuth,
  useUser,
  type Locale,
} from '@mysamyr/react';
import {
  AuthNotifications,
  ConfirmEmailChange,
  ForgotPassword,
  ResetPassword,
  SignIn,
  SignUp,
  VerifyEmail,
  UserProfile,
  UserButton,
  useTranslation,
} from '@mysamyr/ui';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useSearchParams,
} from 'react-router';

import '@mysamyr/ui/styles.css';

const themes = ['light', 'dark'] as const;
type Theme = (typeof themes)[number];

const themeLabels = {
  en: { theme: 'Theme', light: 'Light', dark: 'Dark' },
  uk: { theme: 'Тема', light: 'Світла', dark: 'Темна' },
} satisfies Record<Locale, Record<'theme' | Theme, string>>;

function useStoredPreference<T extends string>(
  key: string,
  defaultValue: T,
  values: readonly T[]
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return values.find(candidate => candidate === stored) ?? defaultValue;
    } catch (error) {
      console.warn(`Unable to read ${key} from localStorage.`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Unable to save ${key} to localStorage.`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}

function Layout({
  children,
  onLocaleChange,
  theme,
  onThemeChange,
}: {
  children: React.ReactNode;
  onLocaleChange: (locale: Locale) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}) {
  const { t, languageTag, locale } = useTranslation();
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const labels = themeLabels[locale];

  return (
    <div lang={languageTag}>
      <nav className="navigation">
        <Link to="/">{t.home}</Link>
        {isLoaded && !user && <Link to="/sign-in">{t.signIn}</Link>}
        {isLoaded && !user && <Link to="/sign-up">{t.signUp}</Link>}
        {isLoaded && user && <Link to="/profile">{t.profile}</Link>}
        <div className="preference-toggles">
          <div
            className="preference-toggle"
            role="group"
            aria-label={labels.theme}
          >
            {themes.map(option => (
              <button
                key={option}
                type="button"
                aria-pressed={theme === option}
                onClick={() => onThemeChange(option)}
              >
                {labels[option]}
              </button>
            ))}
          </div>
          <div
            className="preference-toggle"
            role="group"
            aria-label={t.language}
          >
            <button
              type="button"
              lang="en"
              aria-label="English"
              aria-pressed={locale === 'en'}
              onClick={() => onLocaleChange('en')}
            >
              EN
            </button>
            <button
              type="button"
              lang="uk"
              aria-label="Українська"
              aria-pressed={locale === 'uk'}
              onClick={() => onLocaleChange('uk')}
            >
              UK
            </button>
          </div>
        </div>
        {isLoaded && user && (
          <button onClick={() => void signOut()}>{t.signOut}</button>
        )}
      </nav>
      <main className="page-content">{children}</main>
    </div>
  );
}

function Home() {
  const { t } = useTranslation();
  const { user } = useUser();
  return (
    <div>
      <h1>{t.exampleTitle}</h1>
      {user ? <p>{t.welcome(user.email)}</p> : <p>{t.signInPrompt}</p>}
      {user && <UserButton />}
    </div>
  );
}

function SignInPage() {
  const { t } = useTranslation();
  const { user, isLoaded } = useUser();
  const [searchParams] = useSearchParams();

  if (!isLoaded) return <div>{t.loading}</div>;
  if (user) return <Navigate to="/" replace />;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      {searchParams.get('password_reset') === 'true' && (
        <p role="status">{t.passwordResetDescription}</p>
      )}
      {searchParams.get('email_verified') === 'true' && (
        <p role="status">{t.accountCreatedDescription}</p>
      )}
      <SignIn />
    </div>
  );
}

function ForgotPasswordPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <ForgotPassword />
    </div>
  );
}

function ResetPasswordPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <ResetPassword
        afterResetUrl={`${DEFAULT_PAGES.signIn}?password_reset=true`}
      />
    </div>
  );
}

function SignUpPage() {
  const { t } = useTranslation();
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <div>{t.loading}</div>;
  if (user) return <Navigate to="/" replace />;

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <SignUp />
    </div>
  );
}

function VerifyEmailPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <VerifyEmail />
    </div>
  );
}

function ConfirmEmailChangePage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <ConfirmEmailChange />
    </div>
  );
}

function ProfilePage() {
  const { t } = useTranslation();
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <div>{t.loading}</div>;
  if (!user) return <div>{t.notSignedIn}</div>;

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <UserProfile />
    </div>
  );
}

function AppContent() {
  const nav = useNavigate();
  const [appLocale, setAppLocale] = useStoredPreference<Locale>(
    'keychain-example-locale',
    'en',
    i18nConfig.locales
  );
  const [theme, setTheme] = useStoredPreference<Theme>(
    'keychain-example-theme',
    'light',
    themes
  );

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = i18nConfig.languageTags[appLocale];
  }, [theme, appLocale]);

  const navigate = useCallback(
    (url: string) => {
      void nav(url);
    },
    [nav]
  );

  return (
    <AuthProvider
      apiBaseUrl="http://localhost:3000"
      navigate={navigate}
      locale={appLocale}
    >
      <AuthNotifications />
      <Layout
        onLocaleChange={setAppLocale}
        theme={theme}
        onThemeChange={setTheme}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path={`${DEFAULT_PAGES.signIn}/*`} element={<SignInPage />} />
          <Route
            path={`${DEFAULT_PAGES.forgotPassword}/*`}
            element={<ForgotPasswordPage />}
          />
          <Route
            path={`${DEFAULT_PAGES.resetPassword}/*`}
            element={<ResetPasswordPage />}
          />
          <Route path={`${DEFAULT_PAGES.signUp}/*`} element={<SignUpPage />} />
          <Route
            path={`${DEFAULT_PAGES.verifyEmail}/*`}
            element={<VerifyEmailPage />}
          />
          <Route
            path={`${DEFAULT_PAGES.confirmEmailChange}/*`}
            element={<ConfirmEmailChangePage />}
          />
          <Route
            path={`${DEFAULT_PAGES.profile}/*`}
            element={<ProfilePage />}
          />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
