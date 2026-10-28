'use client';

import { useEffect, useState } from 'react';

import { useUser, type ReauthenticationAction } from '@mysamyr/react';

import { useTranslation } from '../../i18n/useTranslation.js';
import { Alert, Button, Input } from '../shared';

export function ActionConfirmation({
  action,
  onConfirmed,
  onRequested,
  confirmed,
}: {
  action: ReauthenticationAction;
  onConfirmed: () => void;
  onRequested: () => void;
  confirmed: boolean;
}) {
  const { t, errorMessage } = useTranslation();
  const { requestReauthentication, verifyReauthentication } = useUser();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown === 0) return;
    const timeout = window.setTimeout(
      () => setCooldown(value => Math.max(0, value - 1)),
      1000
    );
    return () => window.clearTimeout(timeout);
  }, [cooldown]);

  const request = async () => {
    setPending(true);
    setError(null);
    try {
      await requestReauthentication(action);
      setSent(true);
      setCooldown(60);
      setCode('');
      onRequested();
    } catch (error) {
      setError(
        error instanceof Error ? error : new Error('Confirmation failed')
      );
    } finally {
      setPending(false);
    }
  };

  const verify = async () => {
    setPending(true);
    setError(null);
    try {
      await verifyReauthentication(action, code);
      setCode('');
      setSent(false);
      onConfirmed();
    } catch (error) {
      setError(
        error instanceof Error ? error : new Error('Confirmation failed')
      );
      setCode('');
    } finally {
      setPending(false);
    }
  };

  if (confirmed) {
    return <Alert variant="success" message={t.reauthenticationReady} />;
  }

  return (
    <div className="kc:space-y-3">
      <p className="kc:text-sm kc:text-gray-500">
        {t.reauthenticationDescription}
      </p>
      {error && <Alert variant="error" message={errorMessage(error)} />}
      <Button
        type="button"
        variant="secondary"
        disabled={pending || cooldown > 0}
        onClick={() => void request()}
      >
        {cooldown > 0
          ? t.confirmationResendIn(cooldown)
          : t.sendConfirmationCode}
      </Button>
      {sent && (
        <div className="kc:space-y-3">
          <Input
            label={t.confirmationCode}
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]{8}"
            maxLength={8}
            value={code}
            onChange={event => setCode(event.target.value)}
            disabled={pending}
          />
          <Button
            type="button"
            disabled={pending || !/^\d{8}$/.test(code)}
            loading={pending}
            onClick={() => void verify()}
          >
            {t.confirm}
          </Button>
        </div>
      )}
    </div>
  );
}
