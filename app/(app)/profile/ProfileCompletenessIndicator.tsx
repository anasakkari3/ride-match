'use client';

import { useTranslation } from '@/lib/i18n/LanguageProvider';

type Props = {
  hasDisplayName: boolean;
  hasPhone: boolean;
  hasCityOrArea: boolean;
  hasAge: boolean;
  hasGender: boolean;
  hasIsDriver: boolean;
  showDriverLicense: boolean;
  hasDriverLicense: boolean;
};

const COPY = {
  en: {
    aria: 'Personal details completeness',
    checklist: 'Personal details checklist',
    eyebrow: 'Personal details',
    complete: 'Your editable personal details are up to date',
    incomplete: 'Finish the personal details people will rely on',
    helper: "Only editable profile fields count here. Verification placeholders and optional preferences do not. Driver's license only counts if you want to offer rides.",
    missing: 'Update the missing details in the form below, then save your profile.',
    labels: {
      displayName: 'Display name',
      phone: 'Phone number',
      city: 'City or area',
      age: 'Age',
      gender: 'Gender',
      driverStatus: 'Driver status',
      driverLicense: "Driver's license",
    },
  },
  ar: {
    aria: 'اكتمال التفاصيل الشخصية',
    checklist: 'قائمة التفاصيل الشخصية',
    eyebrow: 'التفاصيل الشخصية',
    complete: 'تفاصيلك الشخصية القابلة للتعديل مكتملة',
    incomplete: 'أكمل التفاصيل الشخصية التي سيعتمد عليها الآخرون',
    helper: 'يتم احتساب الحقول القابلة للتعديل فقط هنا. لا يتم احتساب عناصر التحقق المؤقتة أو التفضيلات الاختيارية. يتم احتساب رخصة القيادة فقط إذا كنت تريد عرض رحلات.',
    missing: 'أكمل التفاصيل الناقصة في النموذج أدناه ثم احفظ ملفك الشخصي.',
    labels: {
      displayName: 'الاسم المعروض',
      phone: 'رقم الهاتف',
      city: 'المدينة أو المنطقة',
      age: 'العمر',
      gender: 'الجنس',
      driverStatus: 'حالة السائق',
      driverLicense: 'رخصة القيادة',
    },
  },
  he: {
    aria: 'השלמת פרטים אישיים',
    checklist: 'רשימת פרטים אישיים',
    eyebrow: 'פרטים אישיים',
    complete: 'הפרטים האישיים הניתנים לעריכה מעודכנים',
    incomplete: 'השלימו את הפרטים האישיים שאנשים יסתמכו עליהם',
    helper: 'רק שדות פרופיל שניתנים לעריכה נספרים כאן. סמני אימות זמניים והעדפות אופציונליות לא נספרים. רישיון נהיגה נספר רק אם אתם רוצים להציע נסיעות.',
    missing: 'השלימו את הפרטים החסרים בטופס למטה ואז שמרו את הפרופיל.',
    labels: {
      displayName: 'שם תצוגה',
      phone: 'מספר טלפון',
      city: 'עיר או אזור',
      age: 'גיל',
      gender: 'מגדר',
      driverStatus: 'סטטוס נהג',
      driverLicense: 'רישיון נהיגה',
    },
  },
} as const;

export default function ProfileCompletenessIndicator({
  hasDisplayName,
  hasPhone,
  hasCityOrArea,
  hasAge,
  hasGender,
  hasIsDriver,
  showDriverLicense,
  hasDriverLicense,
}: Props) {
  const { lang } = useTranslation();
  const copy = COPY[lang];

  const fields = [
    { label: copy.labels.displayName, complete: hasDisplayName },
    { label: copy.labels.phone, complete: hasPhone },
    { label: copy.labels.city, complete: hasCityOrArea },
    { label: copy.labels.age, complete: hasAge },
    { label: copy.labels.gender, complete: hasGender },
    { label: copy.labels.driverStatus, complete: hasIsDriver },
    ...(showDriverLicense ? [{ label: copy.labels.driverLicense, complete: hasDriverLicense }] : []),
  ];

  const missingFields = fields.filter((field) => !field.complete);

  return (
    <div
      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3"
      role="region"
      aria-label={copy.aria}
    >
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          {copy.eyebrow}
        </p>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {missingFields.length === 0 ? copy.complete : copy.incomplete}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {copy.helper}
        </p>
      </div>

      <ul className="space-y-1.5" aria-label={copy.checklist}>
        {fields.map((field) => (
          <li key={field.label} className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${
                field.complete
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
              }`}
              aria-hidden="true"
            >
              {field.complete ? '+' : '-'}
            </span>
            <span className={field.complete ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}>
              {field.label}
            </span>
          </li>
        ))}
      </ul>

      {missingFields.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300">
          {copy.missing}
        </div>
      )}
    </div>
  );
}
