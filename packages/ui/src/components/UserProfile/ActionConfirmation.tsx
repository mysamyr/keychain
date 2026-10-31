'use client';

import { useEffect, useRef, type SyntheticEvent } from 'react';

import { useTranslation } from '../../i18n/useTranslation.js';
import { Alert, Button, Input } from '../shared';

export function ActionConfirmation({
  email,
  label,
  destructive = false,
  sent,
  sending,
  pending,
  cooldown,
  code,
  error,
  onCodeChange,
  onRequest,
  onConfirm,
  onCancel,
}: {
  email: string;
  label: string;
  destructive?: boolean;
  sent: boolean;
  sending: boolean;
  pending: boolean;
  cooldown: number;
  code: string;
  error: Error | null;
  onCodeChange: (code: string) => void;
  onRequest: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t, errorMessage } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sent && !sending && !pending) inputRef.current?.focus();
  }, [sent, sending, pending]);

  return (
    <form
      className="kc:space-y-4"
      onSubmit={(event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (sent && !sending && !pending && /^\d{8}$/.test(code)) {
          onConfirm();
        }
      }}
    >
      <p role="status" className="kc:text-sm kc:text-gray-500">
        {pending
          ? t.confirmationCompleting
          : sending
            ? t.confirmationSending
            : sent
              ? t.confirmationSent(email)
              : t.confirmationRequestRequired}
      </p>
      <p className="kc:text-sm kc:text-gray-500">
        {t.reauthenticationDescription}
      </p>
      {error && <Alert variant="error" message={errorMessage(error)} />}
      <Input
        ref={inputRef}
        label={t.confirmationCode}
        className="kc:text-base kc:sm:text-sm"
        autoComplete="one-time-code"
        inputMode="numeric"
        pattern="[0-9]{8}"
        maxLength={8}
        value={code}
        onChange={event => onCodeChange(event.target.value)}
        disabled={!sent || sending || pending}
        required
      />
      <Button
        type="button"
        variant="secondary"
        disabled={sending || pending || cooldown > 0}
        loading={sending}
        onClick={onRequest}
      >
        {cooldown > 0
          ? t.confirmationResendIn(cooldown)
          : sent
            ? t.resendConfirmationCode
            : t.sendConfirmationCode}
      </Button>
      <div className="kc:flex kc:flex-col-reverse kc:gap-3 kc:sm:flex-row kc:sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={onCancel}
        >
          {t.cancel}
        </Button>
        <Button
          type="submit"
          variant={destructive ? 'danger' : 'primary'}
          size="sm"
          disabled={!sent || sending || pending || !/^\d{8}$/.test(code)}
          loading={pending}
        >
          {label}
        </Button>
      </div>
    </form>
  );
}
