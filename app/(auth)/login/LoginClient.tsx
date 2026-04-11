'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import BrandLogo from '@/components/BrandLogo';
import { BRAND_NAME, brandCopy } from '@/lib/brand/config';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { getFirebaseAuth } from '@/lib/firebase/config';
import { setSessionAndSync } from './actions';

type Mode = 'signin' | 'signup';
type SupportedLang = 'en' | 'ar' | 'he';

type ScreenCopy = {
  subtitle: string;
  heroTitle: string;
  heroDescription: string;
  signin: string;
  signup: string;
  fullName: string;
  fullNamePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  passwordHint: string;
  wait: string;
  createAccount: string;
  signinHint: string;
  signupHint: string;
  signInFailed: string;
  emailInUse: string;
  invalidCredentials: string;
  noAccount: string;
  fullNameRequired: string;
  emailRequired: string;
  passwordMin: string;
  showPassword: string;
  hidePassword: string;
  trustTitle: string;
  trustBullets: string[];
  privacyTitle: string;
  privacyNote: string;
};

const COPY: Record<SupportedLang, ScreenCopy> = {
  en: {
    subtitle: 'Simple ride coordination for real communities.',
    heroTitle: 'Sign in to a calmer, more trustworthy trip flow.',
    heroDescription:
      `${BRAND_NAME} keeps ride coordination scoped to communities, makes expectations clear, and stays honest about what trust features are already live.`,
    signin: 'Sign in',
    signup: 'Sign up',
    fullName: 'Full name',
    fullNamePlaceholder: 'Your full name',
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    passwordHint: 'At least 6 characters',
    wait: 'Please wait...',
    createAccount: 'Create account',
    signinHint: 'Sign in to join communities and coordinate rides.',
    signupHint: 'Create your account now, then finish the basic details people need to coordinate with you.',
    signInFailed: 'Sign in failed',
    emailInUse: 'This email is already registered. Sign in instead.',
    invalidCredentials: 'Invalid email or password.',
    noAccount: 'No account with this email. Sign up first.',
    fullNameRequired: 'Add your full name to create an account.',
    emailRequired: 'Enter the email address you want to use.',
    passwordMin: 'Use at least 6 characters for your password.',
    showPassword: 'Show',
    hidePassword: 'Hide',
    trustTitle: 'What to expect',
    trustBullets: [
      'Join with email first, then complete the basic profile details needed for trip coordination.',
      'Public community bookings require a basic profile. Verified communities may apply stricter local rules.',
      'Document verification uploads are not fully live yet, and the product does not pretend they are.',
    ],
    privacyTitle: 'Trust and privacy',
    privacyNote:
      'Profile details are used to help people recognize who they are coordinating with. Safety tools, moderation, and community scope are real product features. Fake verification claims are not.',
  },
  ar: {
    subtitle: 'تنظيم رحلات بسيط وموثوق داخل مجتمعك.',
    heroTitle: 'سجّل دخولك وابدأ رحلاتك بسهولة وثقة.',
    heroDescription:
      `يبقي ${BRAND_NAME} تنسيق الرحلات داخل المجتمعات، ويوضح التوقعات من البداية، ويبقى صريحًا بشأن ميزات الثقة التي أصبحت جاهزة فعلًا.`,
    signin: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    fullName: 'الاسم الكامل',
    fullNamePlaceholder: 'اسمك الكامل',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'you@example.com',
    password: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
    passwordHint: '6 أحرف على الأقل',
    wait: 'جارٍ المتابعة...',
    createAccount: 'إنشاء الحساب',
    signinHint: 'سجّل الدخول للانضمام إلى المجتمعات وتنسيق الرحلات.',
    signupHint: 'أنشئ حسابك الآن، ثم أكمل التفاصيل الأساسية التي يحتاجها الناس للتنسيق معك.',
    signInFailed: 'فشل تسجيل الدخول. تأكد من بياناتك وحاول مرة أخرى.',
    emailInUse: 'هذا البريد مستخدم بالفعل. جرّب تسجيل الدخول بدلًا من ذلك.',
    invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    noAccount: 'لا يوجد حساب بهذا البريد. أنشئ حسابًا أولًا.',
    fullNameRequired: 'أضف اسمك الكامل لإنشاء حساب.',
    emailRequired: 'أدخل البريد الإلكتروني الذي تريد استخدامه.',
    passwordMin: 'استخدم 6 أحرف على الأقل لكلمة المرور.',
    showPassword: 'إظهار',
    hidePassword: 'إخفاء',
    trustTitle: 'ما الذي ستتوقعه',
    trustBullets: [
      'ابدأ بالبريد الإلكتروني أولًا، ثم أكمل تفاصيل الملف الشخصي الأساسية المطلوبة لتنسيق الرحلات.',
      'الحجز في المجتمعات العامة يتطلب ملفًا شخصيًا أساسيًا. وقد تكون للمجتمعات الموثقة شروط إضافية.',
      'رفع مستندات التحقق ليس مكتملًا بعد، والمنتج لا يدّعي خلاف ذلك.',
    ],
    privacyTitle: 'الثقة والخصوصية',
    privacyNote:
      'تُستخدم بيانات الملف الشخصي لمساعدة الناس على معرفة من ينسقون معه. أدوات السلامة والإشراف ونطاق المجتمع ميزات حقيقية في المنتج، أما ادعاءات التحقق الوهمية فليست موجودة.',
  },
  he: {
    subtitle: 'תיאום נסיעות פשוט ומסודר לקהילות אמיתיות.',
    heroTitle: 'התחברו לזרימת נסיעות רגועה ואמינה יותר.',
    heroDescription:
      `${BRAND_NAME} שומרת את תיאום הנסיעות בתוך קהילות, מבהירה ציפיות מראש, ונשארת כנה לגבי אילו שכבות אמון כבר פעילות בפועל.`,
    signin: 'התחברות',
    signup: 'יצירת חשבון',
    fullName: 'שם מלא',
    fullNamePlaceholder: 'השם המלא שלך',
    email: 'אימייל',
    emailPlaceholder: 'you@example.com',
    password: 'סיסמה',
    passwordPlaceholder: 'הקלידו את הסיסמה שלכם',
    passwordHint: 'לפחות 6 תווים',
    wait: 'טוען...',
    createAccount: 'יצירת חשבון',
    signinHint: 'התחברו כדי להצטרף לקהילות ולתאם נסיעות.',
    signupHint: 'צרו את החשבון עכשיו, ואז השלימו את הפרטים הבסיסיים שאנשים צריכים כדי לתאם אתכם.',
    signInFailed: 'ההתחברות נכשלה',
    emailInUse: 'האימייל הזה כבר רשום. נסו להתחבר במקום.',
    invalidCredentials: 'האימייל או הסיסמה שגויים.',
    noAccount: 'אין חשבון עם האימייל הזה. צרו חשבון קודם.',
    fullNameRequired: 'הוסיפו שם מלא כדי ליצור חשבון.',
    emailRequired: 'הזינו את כתובת האימייל שבה תרצו להשתמש.',
    passwordMin: 'השתמשו בסיסמה של לפחות 6 תווים.',
    showPassword: 'הצג',
    hidePassword: 'הסתר',
    trustTitle: 'למה לצפות',
    trustBullets: [
      'מצטרפים עם אימייל תחילה, ואז משלימים את פרטי הפרופיל הבסיסיים הדרושים לתיאום נסיעות.',
      'הזמנות בקהילות ציבוריות דורשות פרופיל בסיסי. לקהילות מאומתות עשויות להיות דרישות נוספות.',
      'העלאת מסמכי אימות עדיין לא פעילה במלואה, והמוצר לא מעמיד פנים שכן.',
    ],
    privacyTitle: 'אמון ופרטיות',
    privacyNote:
      'פרטי הפרופיל משמשים כדי לעזור לאנשים להבין עם מי הם מתאמים. כלי בטיחות, ניהול קהילה ותחימה קהילתית הם פיצ׳רים אמיתיים. טענות שווא על אימות לא קיימות כאן.',
  },
};

function getCopy(lang: string): ScreenCopy {
  return COPY[(lang === 'ar' || lang === 'he' ? lang : 'en') as SupportedLang];
}

function LoginContent() {
  const { lang, t } = useTranslation();
  const copy = useMemo(() => brandCopy(getCopy(lang)), [lang]);
  const [mode, setMode] = useState<Mode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const submitLabel = useMemo(() => {
    if (loading) return copy.wait;
    return mode === 'signup' ? copy.createAccount : copy.signin;
  }, [copy.createAccount, copy.signin, copy.wait, loading, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup' && !displayName.trim()) {
      setError(copy.fullNameRequired);
      return;
    }
    if (!email.trim()) {
      setError(copy.emailRequired);
      return;
    }
    if (password.trim().length < 6) {
      setError(copy.passwordMin);
      return;
    }

    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      if (mode === 'signup') {
        const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (displayName.trim()) {
          await updateProfile(user, { displayName: displayName.trim() });
        }
        const token = await user.getIdToken();
        await setSessionAndSync(token);
      } else {
        const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
        const token = await user.getIdToken();
        await setSessionAndSync(token);
      }
      window.location.href = '/app';
    } catch (err: unknown) {
      let message: string = copy.signInFailed;
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code;
        const msg = (err as { message?: string }).message;
        if (code === 'auth/email-already-in-use') message = copy.emailInUse;
        else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') message = copy.invalidCredentials;
        else if (code === 'auth/user-not-found') message = copy.noAccount;
        else if (msg && lang === 'en') message = msg;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <div className="mb-5 flex justify-center">
          <BrandLogo lang={lang as SupportedLang} size="auth" priority className="drop-shadow-sm" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {mode === 'signin' ? copy.signin : copy.signup}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{copy.subtitle}</p>
      </div>

      <div className="flex rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-700 dark:bg-slate-800/60">
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            setError(null);
          }}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
            mode === 'signin'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {copy.signin}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setError(null);
          }}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
            mode === 'signup'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {copy.signup}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === 'signup' ? (
          <div>
            <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {copy.fullName}
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={copy.fullNamePlaceholder}
              autoComplete="name"
              aria-invalid={error === copy.fullNameRequired}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400 dark:focus:ring-sky-400/20"
            />
          </div>
        ) : null}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {copy.email}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="login-email"
            placeholder={copy.emailPlaceholder}
            required
            autoComplete="email"
            aria-invalid={error === copy.emailRequired}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400 dark:focus:ring-sky-400/20"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {copy.password}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={copy.passwordPlaceholder}
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              aria-invalid={error === copy.passwordMin}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-14 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400 dark:focus:ring-sky-400/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? copy.hidePassword : copy.showPassword}
              className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              {showPassword ? copy.hidePassword : copy.showPassword}
            </button>
          </div>
          {mode === 'signup' ? (
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{copy.passwordHint}</p>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-900/20">
            <p className="text-center text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          data-testid="login-submit"
          className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-semibold text-white shadow-md transition-all disabled:opacity-50 disabled:transform-none"
        >
          {loading ? (
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4z" />
            </svg>
          ) : null}
          {submitLabel}
        </button>
      </form>

      <p className="text-center text-xs leading-relaxed text-slate-400 dark:text-slate-500">
        {mode === 'signin' ? copy.signinHint : copy.signupHint}
      </p>

      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/70 dark:bg-slate-800/40">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {copy.trustTitle}
        </p>
        <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {copy.trustBullets.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-slate-200 pt-4 dark:border-slate-700/50">
        <Link
          href="/"
          className="block w-full text-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          {t('continue_without_signin')}
        </Link>
      </div>
    </div>
  );
}

export default function LoginClient() {
  const { lang } = useTranslation();
  const copy = useMemo(() => brandCopy(getCopy(lang)), [lang]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-cyan-50/50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute right-[-5%] top-[-10%] h-[500px] w-[500px] rounded-full bg-sky-200/30 blur-3xl dark:bg-sky-900/20" />
      <div className="pointer-events-none absolute bottom-[-10%] left-[-5%] h-[400px] w-[400px] rounded-full bg-cyan-200/20 blur-3xl dark:bg-cyan-900/10" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center">
        <div className="grid w-full items-center gap-6 lg:grid-cols-[1.05fr_0.85fr]">
          <section className="rounded-[32px] border border-white/60 bg-white/60 p-8 shadow-elevated backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/45 sm:p-10 lg:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
              {BRAND_NAME}
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {copy.heroTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
              {copy.heroDescription}
            </p>

            <div className="mt-8 grid gap-3">
              {copy.trustBullets.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{item}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-sky-100 bg-sky-50/80 p-5 dark:border-sky-900/50 dark:bg-sky-950/30">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">
                {copy.privacyTitle}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {copy.privacyNote}
              </p>
            </div>
          </section>

          <div className="rounded-3xl border border-white/50 bg-white/80 p-8 shadow-elevated backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/60">
            <Suspense
              fallback={
                <div className="py-12 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                </div>
              }
            >
              <LoginContent />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
