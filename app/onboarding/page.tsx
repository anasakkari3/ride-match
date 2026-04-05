import { redirect } from 'next/navigation';
import { normalizeNextPath, requireAuthenticatedUser } from '@/lib/auth/onboarding';
import { getBrandDisplayName } from '@/lib/brand/config';
import { getServerLang } from '@/lib/i18n/server';
import { getRequiredProfileCompletionStatus } from '@/lib/services/user';
import ProfileForm from '@/app/(app)/profile/ProfileForm';

const COPY = {
  en: {
    eyebrow: 'One-time setup',
    title: 'Complete your profile',
    description:
      'Before entering OnWay, we need the minimum details people use to recognize and coordinate with you. You can update them later from your profile.',
    needed: 'Still needed',
    fieldLabels: {
      display_name: 'Display name',
      phone: 'Phone',
      city_or_area: 'City or area',
      age: 'Age',
      gender: 'Gender',
      is_driver: 'Driver status',
    },
  },
  ar: {
    eyebrow: 'إعداد لمرة واحدة',
    title: 'أكمل ملفك الشخصي',
    description:
      'قبل دخول بطريقك، نحتاج إلى الحد الأدنى من التفاصيل التي يعتمد عليها الناس للتعرّف عليك والتنسيق معك. يمكنك تعديلها لاحقًا من صفحة ملفك الشخصي.',
    needed: 'ما زال مطلوبًا',
    fieldLabels: {
      display_name: 'الاسم المعروض',
      phone: 'رقم الهاتف',
      city_or_area: 'المدينة أو المنطقة',
      age: 'العمر',
      gender: 'الجنس',
      is_driver: 'حالة السائق',
    },
  },
  he: {
    eyebrow: 'הגדרה חד-פעמית',
    title: 'השלימו את הפרופיל שלכם',
    description:
      'לפני שנכנסים אל בדרכך, אנחנו צריכים את הפרטים הבסיסיים שאנשים משתמשים בהם כדי לזהות אתכם ולתאם איתכם. תמיד תוכלו לעדכן אותם אחר כך מהפרופיל.',
    needed: 'עדיין חסר',
    fieldLabels: {
      display_name: 'שם תצוגה',
      phone: 'טלפון',
      city_or_area: 'עיר או אזור',
      age: 'גיל',
      gender: 'מגדר',
      is_driver: 'סטטוס נהג',
    },
  },
} as const;

export default async function OnboardingPage(props: {
  searchParams: Promise<{ next?: string | string[] | undefined }>;
}) {
  const user = await requireAuthenticatedUser();
  const lang = await getServerLang();
  const brandName = getBrandDisplayName(lang);
  const searchParams = await props.searchParams;
  const requestedNext = typeof searchParams.next === 'string' ? searchParams.next : null;
  const nextPath = normalizeNextPath(requestedNext);
  const completion = await getRequiredProfileCompletionStatus(user.id);

  if (completion.isComplete) {
    redirect(nextPath);
  }

  const profile = completion.profile;
  const copy = {
    ...COPY[lang],
    description: COPY[lang].description.replace(lang === 'en' ? 'OnWay' : lang === 'he' ? 'בדרכך' : 'بطريقك', brandName),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-100 px-4 py-10">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            {copy.title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {copy.description}
          </p>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            {copy.needed}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {completion.missingFields.map((field) => (
              <span
                key={field}
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900 shadow-sm"
              >
                {copy.fieldLabels[field]}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <ProfileForm
            userId={user.id}
            initialDisplayName={profile?.display_name ?? ''}
            initialAvatarUrl={profile?.avatar_url ?? ''}
            initialPhone={profile?.phone ?? ''}
            initialCityOrArea={profile?.city_or_area ?? ''}
            initialAge={profile?.age ?? null}
            initialGender={profile?.gender ?? ''}
            initialIsDriver={profile?.is_driver ?? null}
            initialHasDriverLicense={profile?.has_driver_license ?? null}
            initialGenderPreference={profile?.gender_preference ?? ''}
            mode="onboarding"
            redirectOnSuccess={nextPath}
            showAvatarField={false}
          />
        </div>
      </div>
    </div>
  );
}
