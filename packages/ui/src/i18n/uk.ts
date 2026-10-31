import type { Messages } from './en.js';

export const uk = {
  language: 'Мова',
  signIn: 'Увійти',
  signUp: 'Зареєструватися',
  signOut: 'Вийти',
  signInSubtitle: 'З поверненням! Увійдіть, щоб продовжити.',
  createAccount: 'Створити обліковий запис',
  signUpSubtitle: 'Введіть свої дані, щоб розпочати.',
  continueWithGoogle: 'Продовжити з Google',
  or: 'або',
  email: 'Електронна пошта',
  emailPlaceholder: 'Введіть електронну адресу',
  password: 'Пароль',
  passwordPlaceholder: 'Введіть пароль',
  createPassword: 'Створіть пароль',
  confirmPassword: 'Підтвердіть пароль',
  confirmPasswordPlaceholder: 'Введіть пароль ще раз',
  rememberMe: "Запам'ятати мене",
  forgotPassword: 'Забули пароль?',
  noAccount: 'Немає облікового запису?',
  haveAccount: 'Уже маєте обліковий запис?',
  verifyEmailTitle: 'Підтвердіть електронну пошту',
  verificationSent: (email: string) =>
    `Ми надіслали посилання для підтвердження на ${email}. Перейдіть за ним, щоб підтвердити пошту.`,
  verifyEmail: 'Підтвердити пошту',
  noVerificationLink: 'Не отримали посилання?',
  invalidVerificationToken:
    'Посилання для підтвердження відсутнє, недійсне або термін його дії минув. Запросіть нове посилання нижче.',
  verificationLinkRequested:
    'Якщо обліковий запис існує та потребує підтвердження, посилання надіслано. Перевірте пошту.',
  resend: 'Надіслати ще раз',
  accountCreated: 'Обліковий запис створено!',
  accountCreatedDescription:
    'Вашу електронну пошту підтверджено. Увійдіть, використовуючи свої облікові дані.',
  checkEmail: 'Перевірте пошту',
  resetLinkSent: (email: string) =>
    `Якщо обліковий запис для ${email} існує, ми надіслали посилання для скидання пароля.`,
  backToSignIn: 'Повернутися до входу',
  forgotPasswordSubtitle:
    'Введіть електронну адресу, і ми надішлемо посилання для скидання пароля.',
  sendResetLink: 'Надіслати посилання',
  rememberPassword: "Пам'ятаєте пароль?",
  passwordReset: 'Пароль скинуто!',
  passwordResetDescription: 'Ваш пароль успішно оновлено.',
  invalidResetToken:
    'Токен скидання недійсний або відсутній. Запросіть нове посилання для скидання пароля.',
  retry: 'Спробувати ще раз',
  resetPasswordTitle: 'Скиньте пароль',
  resetPasswordSubtitle: 'Введіть новий пароль нижче.',
  newPassword: 'Новий пароль',
  newPasswordPlaceholder: 'Введіть новий пароль',
  confirmNewPassword: 'Підтвердіть новий пароль',
  resetPassword: 'Скинути пароль',
  emailRequired: 'Введіть електронну адресу',
  emailInvalid: 'Введіть коректну електронну адресу',
  passwordsMismatch: 'Паролі не збігаються',
  passwordTooShort: 'Пароль має містити щонайменше 8 символів',
  invalidField: 'Перевірте це поле.',
  errorGeneric: 'Щось пішло не так. Спробуйте ще раз.',
  errorValidation: 'Перевірте введені дані.',
  errorUserExists: 'Обліковий запис із цією адресою вже існує.',
  errorCredentials: 'Неправильна електронна адреса або пароль.',
  errorSessionExpired: 'Термін дії сеансу минув. Увійдіть ще раз.',
  errorTokenInvalid: 'Код або посилання недійсні чи термін їх дії минув.',
  errorUserNotFound: 'Обліковий запис не знайдено.',
  errorEmailNotVerified: 'Підтвердіть свою електронну адресу.',
  errorNotAuthenticated: 'Увійдіть, щоб продовжити.',
  errorOAuthNotConfigured: 'Вхід через Google недоступний.',
  errorMissingAuthorizationCode:
    'Код авторизації відсутній. Спробуйте ввійти ще раз.',
  errorOAuth: 'Не вдалося ввійти через OAuth. Спробуйте ще раз.',
  errorPasswordRequired: 'Спершу встановіть пароль.',
  errorEmailChangeConflict:
    'Очікувана адреса змінилася. Перевірте актуальний запит і спробуйте ще раз.',
  errorEmailChangePending:
    'Зміна пошти вже очікує підтвердження. Підтвердьте або скасуйте її, перш ніж надсилати новий запит.',
  errorRateLimited: 'Забагато спроб. Спробуйте пізніше.',
  errorServiceUnavailable:
    'Сервіс тимчасово недоступний. Спробуйте трохи згодом.',
  confirmEmailChangeTitle: 'Підтвердьте зміну електронної пошти',
  confirmEmailChangeDescription:
    'Підтвердьте, що хочете використовувати цю адресу для свого облікового запису. Вас буде виведено з усіх пристроїв.',
  confirmEmailChangeButton: 'Підтвердити зміну пошти',
  invalidEmailChangeToken:
    'Посилання для зміни пошти відсутнє, недійсне або термін його дії минув. Запросіть зміну ще раз у профілі.',
  accountSettings: 'Налаштування облікового запису',
  profile: 'Профіль',
  security: 'Безпека',
  sessions: 'Сеанси',
  profileSubtitle: 'Керуйте інформацією свого облікового запису.',
  emailChangeSent:
    'Лист для підтвердження надіслано. Перевірте пошту, щоб завершити зміну.',
  pendingEmailDescription: (email: string) =>
    `Посилання для підтвердження надіслано на ${email}. Перевірте пошту, щоб завершити зміну.`,
  cancelEmailChangeButton: 'Скасувати зміну пошти',
  cancelEmailChangeTitle: 'Скасувати зміну електронної пошти?',
  cancelEmailChangeDescription: (email: string) =>
    `Поточна адреса залишиться активною. Посилання для підтвердження, надіслане на ${email}, більше не працюватиме.`,
  keepEmailChange: 'Залишити запит',
  confirmCancelEmailChange: 'Скасувати зміну пошти',
  emailChangeCancelled:
    'Зміну електронної пошти скасовано. Поточна адреса не змінилася.',
  saveChanges: 'Зберегти зміни',
  emailVerifiedBadge: 'Підтверджено',
  emailUnverifiedBadge: 'Не підтверджено',
  signInMethods: 'Способи входу',
  googleMethod: 'Google',
  accountDetails: 'Відомості про обліковий запис',
  lastUpdated: 'Останнє оновлення',
  userId: 'ID користувача',
  pendingEmail: 'Нова адреса очікує підтвердження',
  memberSince: 'Дата реєстрації',
  changeEmail: 'Змінити електронну адресу',
  setPasswordBeforeChangingEmail:
    "Перш ніж змінювати пошту, встановіть пароль у розділі «Безпека». Після підтвердження нової адреси Google буде від'єднано. Для входу використовуйте нову пошту та пароль.",
  changeEmailDescription: (email: string) =>
    `Ми надішлемо посилання для підтвердження на ${email}. Поточна адреса залишатиметься активною, доки ви не підтвердите нову. На поточну адресу також буде надіслано сповіщення. Після підтвердження Google буде від'єднано, а всі сеанси завершено. Увійдіть із новою поштою та паролем.`,
  cancel: 'Скасувати',
  confirm: 'Підтвердити',
  securitySubtitle: 'Оновіть пароль, щоб захистити обліковий запис.',
  passwordSetupSubtitle: 'Встановіть пароль, щоб захистити обліковий запис.',
  passwordUpdated: 'Пароль успішно оновлено.',
  currentPassword: 'Поточний пароль',
  sendConfirmationCode: 'Надіслати код підтвердження',
  resendConfirmationCode: 'Надіслати код повторно',
  confirmationSending: 'Надсилаємо код підтвердження...',
  confirmationCompleting: 'Підтверджуємо та виконуємо вашу дію...',
  confirmationSent: (email: string) =>
    `Код підтвердження надіслано на ${email}. Введіть його нижче, щоб завершити цю дію.`,
  confirmationRequestRequired:
    'Запросіть новий код підтвердження, щоб завершити цю дію.',
  confirmationCode: 'Восьмизначний код підтвердження',
  confirmationResendIn: (seconds: number) =>
    `Повторний запит через ${seconds} с`,
  reauthenticationDescription:
    'Код діє п’ять хвилин і дозволяє п’ять спроб. Повторний запит можливий через хвилину.',
  errorReauthenticationCooldown:
    'Зачекайте хвилину перед повторним запитом коду.',
  errorReauthentication:
    'Підтвердження відсутнє, недійсне, прострочене або вичерпало п’ять спроб. Запросіть новий код.',
  currentPasswordPlaceholder: 'Введіть поточний пароль',
  updatePassword: 'Оновити пароль',
  setPassword: 'Встановити пароль',
  setPasswordConfirmation:
    'Підтвердьте дію кодом з електронної пошти, щоб встановити пароль. Усі сеанси буде завершено. Увійдіть знову, щоб продовжити.',
  googleAccount: 'Обліковий запис Google',
  unlinkGoogle: "Від'єднати Google",
  unlinkGoogleDescription:
    'Видаліть Google як спосіб входу. Для входу знадобляться електронна пошта та пароль. Повторний вхід через Google знову приєднає його.',
  googleUnlinked: "Обліковий запис Google від'єднано.",
  setPasswordBeforeUnlinking: "Встановіть пароль, перш ніж від'єднати Google.",
  linkGoogle: "Прив'язати Google",
  linkGoogleDescription:
    'Додайте Google як спосіб входу. Обліковий запис Google має використовувати ту саму електронну адресу, що й цей обліковий запис.',
  linkGoogleConfirmation:
    "Введіть пароль, щоб перейти до Google і прив'язати його до цього облікового запису.",
  linkGoogleVerifiesEmail:
    "Вашу електронну адресу не підтверджено. Прив'язка Google підтвердить її.",
  signOutEverywhere: 'Вийти на всіх пристроях',
  signOutEverywhereDescription: 'Вийдіть на всіх пристроях, включно з цим.',
  deleteAccount: 'Видалити обліковий запис',
  deleteAccountDescription:
    "Назавжди видаліть обліковий запис і всі пов'язані дані. Цю дію неможливо скасувати.",
  deleteAccountConfirmation: 'Ця дія незворотна. Усі ваші дані буде видалено.',
  deleteMyAccount: 'Видалити мій обліковий запис',
  mobileDevice: 'Мобільний пристрій',
  desktopDevice: "Комп'ютер",
  currentSession: 'Поточний',
  revokeSession: 'Завершити сеанс',
  activeSessions: 'Активні сеанси',
  sessionsSubtitle: 'Керуйте активними сеансами на різних пристроях.',
  revokeOthers: 'Завершити інші',
  noSessions: 'Активних сеансів не знайдено.',
  emailNotVerified: 'Пошту не підтверджено',
  manageAccount: 'Керувати обліковим записом',
  close: 'Закрити',
  userMenu: 'Меню користувача',
  home: 'Головна',
  loading: 'Завантаження...',
  exampleTitle: 'Вебприклад Keychain',
  welcome: (email: string) =>
    `Вітаємо, ${email}! Ви ввійшли в обліковий запис.`,
  notSignedIn: 'Ви не ввійшли в обліковий запис.',
  signInPrompt: 'Ви не ввійшли в обліковий запис. Увійдіть або зареєструйтеся.',
  emailChanged:
    'Вашу електронну адресу успішно змінено. Увійдіть із новою адресою та паролем.',
  oauthFailed: 'Не вдалося ввійти через Google. Спробуйте ще раз.',
  oauthNotConfigured: 'Вхід через Google недоступний.',
  googleLinked: "Обліковий запис Google прив'язано.",
  googleLinkFailed:
    "Не вдалося прив'язати обліковий запис Google. Спробуйте ще раз.",
  oauthEmailMismatch:
    'Електронна адреса Google має збігатися з адресою вашого облікового запису.',
  googleLinkRequired:
    "Обліковий запис із цією адресою вже існує. Увійдіть у нього та прив'яжіть Google у налаштуваннях профілю.",
  dismiss: 'Закрити',
  errorNetwork:
    "Не вдалося зв'язатися із сервером. Перевірте з'єднання та спробуйте ще раз.",
} satisfies Messages;
