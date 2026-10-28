import type { EmailContext, EmailNotification } from '@mysamyr/core';

export interface EmailMessage {
  subject: string;
  paragraphs: string[];
  action?: { label: string; link: string };
}

type LinkContext = EmailContext & { payload: { link: string } };
type ProviderContext = EmailContext & { payload: { provider: string } };
type ReauthenticationContext = EmailContext & {
  payload: { code: string; action: 'delete-account' | 'set-password' };
};

const messages = {
  en: {
    reauthentication: ({
      appName,
      payload,
    }: ReauthenticationContext): EmailMessage => ({
      subject: `[${appName}] Confirm a sensitive action`,
      paragraphs: [
        `To ${payload.action === 'delete-account' ? 'delete your account' : 'set your first password'}, enter this code in the app: ${payload.code}`,
        'The code expires in five minutes and works only for this action in the requesting session. Do not share it. If you did not request it, ignore this email and review your active sessions.',
      ],
    }),
    verification: ({ appName, payload }: LinkContext): EmailMessage => ({
      subject: `[${appName}] Verify your email address`,
      paragraphs: [
        `Welcome to ${appName}!`,
        'Please verify your email address by clicking the following link:',
      ],
      action: { label: 'Verify email address', link: payload.link },
    }),
    emailChangeNotification: ({
      appName,
      supportContact,
    }: EmailContext): EmailMessage => ({
      subject: `[${appName}] Email change requested`,
      paragraphs: [
        `An email change was requested for your ${appName} account. If this wasn't you, please contact ${supportContact}.`,
      ],
    }),
    accountLinked: ({
      appName,
      supportContact,
      payload,
    }: ProviderContext): EmailMessage => ({
      subject: `[${appName}] ${payload.provider} sign-in linked to your account`,
      paragraphs: [
        `A ${payload.provider} sign-in was successfully linked to your ${appName} account.`,
        `If you did this, no further action is required. If this wasn't you, please change your password, revoke all active sessions immediately, and contact ${supportContact}.`,
      ],
    }),
    passwordChanged: ({
      appName,
      supportContact,
    }: EmailContext): EmailMessage => ({
      subject: `[${appName}] Your password has been changed`,
      paragraphs: [
        `Your ${appName} account password has been successfully changed.`,
        `If you did this, no further action is required. If this wasn't you, immediately reset your password using Forgot Password, end all active sessions in your account settings, and contact ${supportContact}.`,
      ],
    }),
    accountDeleted: ({
      appName,
      supportContact,
    }: EmailContext): EmailMessage => ({
      subject: `[${appName}] Your account has been deleted`,
      paragraphs: [
        `Your ${appName} account has been permanently deleted.`,
        `If you did not request this, please contact ${supportContact}.`,
      ],
    }),
    accountUnlinked: ({
      appName,
      supportContact,
      payload,
    }: ProviderContext): EmailMessage => ({
      subject: `[${appName}] ${payload.provider} sign-in unlinked from your account`,
      paragraphs: [
        `${payload.provider} sign-in has been removed from your ${appName} account.`,
        `If you did this, no further action is required. If this wasn't you, immediately end all active sessions in your account settings, reset your password using Forgot Password, and contact ${supportContact}.`,
      ],
    }),
    emailChangeVerification: ({
      appName,
      payload,
    }: LinkContext): EmailMessage => ({
      subject: `[${appName}] Verify your new email address`,
      paragraphs: [
        `Please verify the new email address for your ${appName} account by clicking the following link:`,
      ],
      action: { label: 'Verify email address', link: payload.link },
    }),
    passwordReset: ({ appName, payload }: LinkContext): EmailMessage => ({
      subject: `[${appName}] Reset your password`,
      paragraphs: [
        `You requested a password reset for your ${appName} account. Click the following link to choose a new password:`,
      ],
      action: { label: 'Reset password', link: payload.link },
    }),
  },
  uk: {
    reauthentication: ({
      appName,
      payload,
    }: ReauthenticationContext): EmailMessage => ({
      subject: `[${appName}] Підтвердження важливої дії`,
      paragraphs: [
        `Щоб ${payload.action === 'delete-account' ? 'видалити обліковий запис' : 'встановити перший пароль'}, введіть цей код у застосунку: ${payload.code}`,
        'Код діє п’ять хвилин лише для цієї дії в сеансі, з якого його запитали. Не повідомляйте його нікому. Якщо ви не надсилали запит, ігноруйте лист і перевірте активні сеанси.',
      ],
    }),
    verification: ({ appName, payload }: LinkContext): EmailMessage => ({
      subject: `[${appName}] Підтвердіть адресу електронної пошти`,
      paragraphs: [
        `Ласкаво просимо до ${appName}!`,
        'Підтвердіть адресу електронної пошти, перейшовши за посиланням:',
      ],
      action: { label: 'Підтвердити адресу', link: payload.link },
    }),
    emailChangeNotification: ({
      appName,
      supportContact,
    }: EmailContext): EmailMessage => ({
      subject: `[${appName}] Запит на зміну електронної пошти`,
      paragraphs: [
        `Було надіслано запит на зміну адреси електронної пошти вашого облікового запису ${appName}. Якщо це зробили не ви, зверніться до ${supportContact}.`,
      ],
    }),
    accountLinked: ({
      appName,
      supportContact,
      payload,
    }: ProviderContext): EmailMessage => ({
      subject: `[${appName}] Вхід через ${payload.provider} прив'язано до вашого облікового запису`,
      paragraphs: [
        `Вхід через ${payload.provider} успішно прив'язано до вашого облікового запису ${appName}.`,
        `Якщо це зробили ви, жодних подальших дій не потрібно. Якщо це зробили не ви, негайно змініть пароль, завершіть усі активні сеанси та зверніться до ${supportContact}.`,
      ],
    }),
    passwordChanged: ({
      appName,
      supportContact,
    }: EmailContext): EmailMessage => ({
      subject: `[${appName}] Ваш пароль змінено`,
      paragraphs: [
        `Пароль вашого облікового запису ${appName} успішно змінено.`,
        `Якщо це зробили ви, жодних подальших дій не потрібно. Якщо це зробили не ви, негайно відновіть пароль за допомогою функції «Забули пароль?», завершіть усі активні сеанси в налаштуваннях облікового запису та зверніться до ${supportContact}.`,
      ],
    }),
    accountDeleted: ({
      appName,
      supportContact,
    }: EmailContext): EmailMessage => ({
      subject: `[${appName}] Ваш обліковий запис видалено`,
      paragraphs: [
        `Ваш обліковий запис ${appName} остаточно видалено.`,
        `Якщо ви не надсилали цей запит, зверніться до ${supportContact}.`,
      ],
    }),
    accountUnlinked: ({
      appName,
      supportContact,
      payload,
    }: ProviderContext): EmailMessage => ({
      subject: `[${appName}] Вхід через ${payload.provider} відв'язано від вашого облікового запису`,
      paragraphs: [
        `Вхід через ${payload.provider} видалено з вашого облікового запису ${appName}.`,
        `Якщо це зробили ви, жодних подальших дій не потрібно. Якщо це зробили не ви, негайно завершіть усі активні сеанси в налаштуваннях облікового запису, відновіть пароль за допомогою функції «Забули пароль?» та зверніться до ${supportContact}.`,
      ],
    }),
    emailChangeVerification: ({
      appName,
      payload,
    }: LinkContext): EmailMessage => ({
      subject: `[${appName}] Підтвердіть нову адресу електронної пошти`,
      paragraphs: [
        `Підтвердіть нову адресу електронної пошти вашого облікового запису ${appName}, перейшовши за посиланням:`,
      ],
      action: { label: 'Підтвердити адресу', link: payload.link },
    }),
    passwordReset: ({ appName, payload }: LinkContext): EmailMessage => ({
      subject: `[${appName}] Відновлення пароля`,
      paragraphs: [
        `Ви запросили відновлення пароля вашого облікового запису ${appName}. Перейдіть за посиланням, щоб установити новий пароль:`,
      ],
      action: { label: 'Відновити пароль', link: payload.link },
    }),
  },
};

export function resolveEmailLocale(locale: string): 'en' | 'uk' {
  const language = locale.trim().toLowerCase().replace('_', '-').split('-')[0];
  return language === 'uk' ? 'uk' : 'en';
}

export function getEmailMessage(notification: EmailNotification): EmailMessage {
  const dictionary = messages[resolveEmailLocale(notification.locale)];
  switch (notification.event) {
    case 'reauthentication':
      return dictionary.reauthentication(notification);
    case 'verification':
      return dictionary.verification(notification);
    case 'passwordReset':
      return dictionary.passwordReset(notification);
    case 'emailChangeVerification':
      return dictionary.emailChangeVerification(notification);
    case 'emailChangeNotification':
      return dictionary.emailChangeNotification(notification);
    case 'accountLinked':
      return dictionary.accountLinked(notification);
    case 'accountUnlinked':
      return dictionary.accountUnlinked(notification);
    case 'passwordChanged':
      return dictionary.passwordChanged(notification);
    case 'accountDeleted':
      return dictionary.accountDeleted(notification);
  }
}
