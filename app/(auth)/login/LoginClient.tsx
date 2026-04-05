'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import BrandLogo from '@/components/BrandLogo';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { getFirebaseAuth } from '@/lib/firebase/config';
import { setSessionAndSync } from './actions';

type Mode = 'signin' | 'signup';

const COPY = {
  en: {
    subtitle: 'Simple ride coordination for real communities.',
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
    signupHint: 'Create a simple account, then finish your required details right after.',
    signInFailed: 'Sign in failed',
    emailInUse: 'This email is already registered. Sign in instead.',
    invalidCredentials: 'Invalid email or password.',
    noAccount: 'No account with this email. Sign up first.',
  },
  ar: {
    subtitle: 'تنسيق رحلات بسيط ومنظم لمجتمعات حقيقية.',
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
    signupHint: 'أنشئ حسابًا بسيطًا الآن، ثم أكمل التفاصيل المطلوبة مباشرة بعد الدخول.',
    signInFailed: 'فشل تسجيل الدخول',
    emailInUse: 'هذا البريد مستخدم بالفعل. جرّب تسجيل الدخول بدلًا من ذلك.',
    invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    noAccount: 'لا يوجد حساب بهذا البريد. أنشئ حسابًا أولًا.',
  },
  he: {
    subtitle: 'תיאום נסיעות פשוט ומסודר לקהילות אמיתיות.',
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
    signupHint: 'צרו חשבון פשוט עכשיו, ואת הפרטים הנדרשים תשלים מיד אחרי הכניסה.',
    signInFailed: 'ההתחברות נכשלה',
    emailInUse: 'האימייל הזה כבר רשום. נסו להתחבר במקום.',
    invalidCredentials: 'האימייל או הסיסמה שגויים.',
    noAccount: 'אין חשבון עם האימייל הזה. צרו חשבון קודם.',
  },
} as const;

function LoginContent() {
  const { lang, t } = useTranslation();
  const copy = COPY[lang];
  const [mode, setMode] = useState<Mode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submitLabel = useMemo(() => {
    if (loading) return copy.wait;
    return mode === 'signup' ? copy.createAccount : copy.signin;
  }, [copy.createAccount, copy.signin, copy.wait, loading, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
        <div className="mb-4 flex justify-center">
          <BrandLogo lang={lang} size="auth" priority className="drop-shadow-sm" />
        </div>
        <p className="mt-2 text-sm text-slate-500">{copy.subtitle}</p>
      </div>

      <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            setError(null);
          }}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          {copy.signin}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setError(null);
          }}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          {copy.signup}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-slate-700">
              {copy.fullName}
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={copy.fullNamePlaceholder}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
              autoComplete="name"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
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
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            {copy.password}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={copy.passwordPlaceholder}
            required
            minLength={6}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
          {mode === 'signup' && <p className="mt-1 text-xs text-slate-500">{copy.passwordHint}</p>}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-center text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          data-testid="login-submit"
          className="btn-press flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3.5 font-medium text-white shadow-sm transition-all hover:bg-sky-700 disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </form>

      <p className="text-center text-xs text-slate-400">
        {mode === 'signin' ? copy.signinHint : copy.signupHint}
      </p>

      <div className="border-t border-slate-200 pt-4">
        <Link
          href="/"
          className="block w-full text-center text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          {t('continue_without_signin')}
        </Link>
      </div>
    </div>
  );
}

export default function LoginClient() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-50 to-slate-50 p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-sm text-center">
            <div className="animate-pulse text-slate-400">{t('loading')}</div>
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </div>
  );
}
