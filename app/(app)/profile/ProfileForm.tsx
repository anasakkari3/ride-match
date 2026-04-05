'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { updateProfile } from './actions';
import type { DocumentPlaceholderStatus } from '@/lib/types';

type Props = {
  userId: string;
  initialDisplayName: string;
  initialAvatarUrl: string;
  initialPhone: string;
  initialCityOrArea: string;
  initialAge: number | null;
  initialGender: string;
  initialIsDriver: boolean | null;
  initialHasDriverLicense?: boolean | null;
  initialGenderPreference?: string | null;
  initialLicenseImageStatus?: DocumentPlaceholderStatus;
  initialInsuranceImageStatus?: DocumentPlaceholderStatus;
  initialLicenseDeclared?: boolean;
  initialInsuranceDeclared?: boolean;
  mode?: 'profile' | 'onboarding';
  redirectOnSuccess?: string;
  showAvatarField?: boolean;
};

type DocumentPlaceholderCardProps = {
  title: string;
  description: string;
  inputLabel: string;
  status: DocumentPlaceholderStatus;
  localFileName: string | null;
  inputKey: number;
  selectedText: (fileName: string) => string;
  placeholderSavedText: string;
  noPlaceholderText: string;
  statusProvidedLabel: string;
  statusMissingLabel: string;
  footer: string;
  clearLabel: string;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
};

function DocumentPlaceholderCard({
  title,
  description,
  inputLabel,
  status,
  localFileName,
  inputKey,
  selectedText,
  placeholderSavedText,
  noPlaceholderText,
  statusProvidedLabel,
  statusMissingLabel,
  footer,
  clearLabel,
  onFileChange,
  onClear,
}: DocumentPlaceholderCardProps) {
  const hasPlaceholder = status === 'provided_placeholder';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
          hasPlaceholder
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
        }`}>
          {hasPlaceholder ? statusProvidedLabel : statusMissingLabel}
        </span>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 px-3 py-3 text-xs text-slate-600 dark:text-slate-300">
        {localFileName
          ? selectedText(localFileName)
          : hasPlaceholder
            ? placeholderSavedText
            : noPlaceholderText}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {inputLabel}
        </label>
        <input
          key={inputKey}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-sky-700 dark:file:bg-sky-900/40 dark:file:text-sky-300"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {footer}
        </p>
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {clearLabel}
        </button>
      </div>
    </div>
  );
}

const COPY = {
  en: {
    phone: 'Phone',
    city: 'City or area',
    age: 'Age',
    gender: 'Gender',
    genderSelect: 'Select gender',
    genderOptions: {
      woman: 'Woman',
      man: 'Man',
      nonBinary: 'Non-binary',
      preferNotToSay: 'Prefer not to say',
    },
    driverQuestion: 'Are you a driver?',
    driverYesTitle: 'Yes',
    driverYesDesc: 'I can offer rides as a driver.',
    driverNoTitle: 'No',
    driverNoDesc: 'I am only looking for rides right now.',
    licenseTitle: "Driver's license",
    licenseRequired: 'Required if you want to offer rides.',
    licenseOptional: 'Optional unless you decide to offer rides later.',
    licenseYesDesc: "I have a valid driver's license.",
    licenseNoDesc: "I cannot offer rides that require a licensed driver.",
    genderPreference: 'Gender preference',
    genderPreferenceHint: 'Optional. Leave it blank if you have no preference.',
    genderPreferenceOptions: {
      none: 'No preference',
      women: 'Prefer women',
      men: 'Prefer men',
      nonBinary: 'Prefer non-binary riders',
      sameAsMe: 'Prefer the same gender as me',
    },
    verificationEyebrow: 'Verification placeholders',
    verificationTitle: 'Future document verification',
    verificationDesc: 'This is not a real upload flow yet. You can choose a file and save a placeholder state now, but the actual document image stays on this device and is never uploaded or stored by the app.',
    licenseImageTitle: 'Driver license image',
    licenseImageDesc: 'Future placeholder for a driver license image. Useful when full verification is added later.',
    licenseImageInput: 'Choose local driver license image',
    insuranceImageTitle: 'Car insurance image',
    insuranceImageDesc: 'Future placeholder for a vehicle insurance image. Relevant if you plan to drive.',
    insuranceImageInput: 'Choose local car insurance image',
    placeholderProvided: 'Placeholder saved',
    placeholderMissing: 'Not provided',
    selectedLocal: (fileName: string) => `Selected locally: ${fileName}. Saving will only store placeholder metadata.`,
    placeholderSavedText: 'A placeholder is on file for this document. No actual image is stored yet.',
    noPlaceholderText: 'No placeholder saved yet. Choosing a file here will not upload it.',
    placeholderFooter: 'Placeholder only. Verification uploads are not fully activated yet.',
    clear: 'Clear',
    onboardingSaved: 'Profile saved. Redirecting...',
    finishSetup: 'Finish setup',
    required: 'Required',
  },
  ar: {
    phone: 'رقم الهاتف',
    city: 'المدينة أو المنطقة',
    age: 'العمر',
    gender: 'الجنس',
    genderSelect: 'اختر الجنس',
    genderOptions: {
      woman: 'امرأة',
      man: 'رجل',
      nonBinary: 'غير ثنائي',
      preferNotToSay: 'أفضل عدم الإجابة',
    },
    driverQuestion: 'هل أنت سائق؟',
    driverYesTitle: 'نعم',
    driverYesDesc: 'يمكنني عرض رحلات كسائق.',
    driverNoTitle: 'لا',
    driverNoDesc: 'أنا أبحث عن رحلات فقط في الوقت الحالي.',
    licenseTitle: 'رخصة القيادة',
    licenseRequired: 'مطلوبة إذا كنت تريد عرض رحلات.',
    licenseOptional: 'اختيارية إلى أن تقرر عرض رحلات لاحقًا.',
    licenseYesDesc: 'لدي رخصة قيادة سارية.',
    licenseNoDesc: 'لا أستطيع عرض رحلات تتطلب سائقًا مرخّصًا.',
    genderPreference: 'تفضيل الجنس',
    genderPreferenceHint: 'اختياري. اتركه فارغًا إذا لم يكن لديك تفضيل.',
    genderPreferenceOptions: {
      none: 'لا يوجد تفضيل',
      women: 'أفضل النساء',
      men: 'أفضل الرجال',
      nonBinary: 'أفضل الركاب غير الثنائيين',
      sameAsMe: 'أفضل نفس جنسي',
    },
    verificationEyebrow: 'عناصر تحقق مؤقتة',
    verificationTitle: 'تحقق مستقبلي من المستندات',
    verificationDesc: 'هذا ليس مسار رفع حقيقي بعد. يمكنك اختيار ملف الآن وحفظ حالة مؤقتة فقط، لكن صورة المستند الفعلية تبقى على هذا الجهاز ولا يتم رفعها أو تخزينها داخل التطبيق.',
    licenseImageTitle: 'صورة رخصة القيادة',
    licenseImageDesc: 'عنصر مؤقت لصورة رخصة القيادة عند إضافة التحقق الكامل لاحقًا.',
    licenseImageInput: 'اختر صورة محلية لرخصة القيادة',
    insuranceImageTitle: 'صورة تأمين السيارة',
    insuranceImageDesc: 'عنصر مؤقت لصورة تأمين المركبة، وهو مهم إذا كنت تنوي القيادة.',
    insuranceImageInput: 'اختر صورة محلية لتأمين السيارة',
    placeholderProvided: 'تم حفظ الحالة المؤقتة',
    placeholderMissing: 'غير متوفر',
    selectedLocal: (fileName: string) => `تم اختيار الملف محليًا: ${fileName}. عند الحفظ سيتم تخزين بيانات حالة مؤقتة فقط.`,
    placeholderSavedText: 'توجد حالة مؤقتة محفوظة لهذا المستند. لا يتم تخزين أي صورة فعلية بعد.',
    noPlaceholderText: 'لا توجد حالة مؤقتة محفوظة بعد. اختيار ملف هنا لن يرفعه.',
    placeholderFooter: 'هذا مجرد عنصر مؤقت. رفع مستندات التحقق غير مفعّل بالكامل بعد.',
    clear: 'مسح',
    onboardingSaved: 'تم حفظ الملف الشخصي. جارٍ التحويل...',
    finishSetup: 'إنهاء الإعداد',
    required: 'مطلوب',
  },
  he: {
    phone: 'טלפון',
    city: 'עיר או אזור',
    age: 'גיל',
    gender: 'מגדר',
    genderSelect: 'בחרו מגדר',
    genderOptions: {
      woman: 'אישה',
      man: 'גבר',
      nonBinary: 'לא בינארי',
      preferNotToSay: 'מעדיף לא לציין',
    },
    driverQuestion: 'האם אתם נהגים?',
    driverYesTitle: 'כן',
    driverYesDesc: 'אני יכול להציע נסיעות כנהג.',
    driverNoTitle: 'לא',
    driverNoDesc: 'כרגע אני רק מחפש נסיעות.',
    licenseTitle: 'רישיון נהיגה',
    licenseRequired: 'נדרש אם אתם רוצים להציע נסיעות.',
    licenseOptional: 'אופציונלי עד שתחליטו להציע נסיעות בהמשך.',
    licenseYesDesc: 'יש לי רישיון נהיגה בתוקף.',
    licenseNoDesc: 'אני לא יכול להציע נסיעות שדורשות נהג מורשה.',
    genderPreference: 'העדפת מגדר',
    genderPreferenceHint: 'אופציונלי. השאירו ריק אם אין לכם העדפה.',
    genderPreferenceOptions: {
      none: 'ללא העדפה',
      women: 'מעדיף נשים',
      men: 'מעדיף גברים',
      nonBinary: 'מעדיף נוסעים לא בינאריים',
      sameAsMe: 'מעדיף אותו מגדר כמוני',
    },
    verificationEyebrow: 'סימוני אימות זמניים',
    verificationTitle: 'אימות מסמכים בעתיד',
    verificationDesc: 'זה עדיין לא מסלול העלאה אמיתי. אפשר לבחור קובץ ולשמור רק מצב זמני, אבל תמונת המסמך עצמה נשארת במכשיר הזה ולא נשלחת או נשמרת באפליקציה.',
    licenseImageTitle: 'תמונת רישיון נהיגה',
    licenseImageDesc: 'מקום שמור עתידי לתמונת רישיון נהיגה כשיתווסף אימות מלא.',
    licenseImageInput: 'בחרו תמונת רישיון מקומית',
    insuranceImageTitle: 'תמונת ביטוח רכב',
    insuranceImageDesc: 'מקום שמור עתידי לתמונת ביטוח רכב, רלוונטי אם אתם מתכננים לנהוג.',
    insuranceImageInput: 'בחרו תמונת ביטוח רכב מקומית',
    placeholderProvided: 'נשמר סימון זמני',
    placeholderMissing: 'לא סופק',
    selectedLocal: (fileName: string) => `נבחר מקומית: ${fileName}. בשמירה יישמר רק מצב זמני.`,
    placeholderSavedText: 'יש סימון זמני שמור למסמך הזה. עדיין לא נשמרת תמונה אמיתית.',
    noPlaceholderText: 'עדיין אין סימון זמני שמור. בחירת קובץ כאן לא תעלה אותו.',
    placeholderFooter: 'זהו סימון זמני בלבד. העלאות אימות עדיין לא פעילות במלואן.',
    clear: 'נקה',
    onboardingSaved: 'הפרופיל נשמר. מעבירים אתכם...',
    finishSetup: 'סיום ההגדרה',
    required: 'חובה',
  },
} as const;

function localizeProfileError(message: string, lang: keyof typeof COPY) {
  const map = {
    en: {
      'Display name is required.': 'Display name is required.',
      'Phone is required.': 'Phone is required.',
      'City or area is required.': 'City or area is required.',
      'Age is required.': 'Age is required.',
      'Please choose a valid gender.': 'Please choose a valid gender.',
      'Please choose whether you are a driver.': 'Please choose whether you are a driver.',
      "Drivers must confirm they have a valid driver's license.": "Drivers must confirm they have a valid driver's license.",
      "Please choose whether you have a driver's license.": "Please choose whether you have a driver's license.",
      'Please choose a valid gender preference.': 'Please choose a valid gender preference.',
    },
    ar: {
      'Display name is required.': 'الاسم المعروض مطلوب.',
      'Phone is required.': 'رقم الهاتف مطلوب.',
      'City or area is required.': 'المدينة أو المنطقة مطلوبة.',
      'Age is required.': 'العمر مطلوب.',
      'Please choose a valid gender.': 'يرجى اختيار جنس صحيح.',
      'Please choose whether you are a driver.': 'يرجى تحديد ما إذا كنت سائقًا.',
      "Drivers must confirm they have a valid driver's license.": 'يجب على السائقين تأكيد امتلاكهم لرخصة قيادة سارية.',
      "Please choose whether you have a driver's license.": 'يرجى تحديد ما إذا كانت لديك رخصة قيادة.',
      'Please choose a valid gender preference.': 'يرجى اختيار تفضيل جنس صحيح.',
    },
    he: {
      'Display name is required.': 'שם התצוגה הוא שדה חובה.',
      'Phone is required.': 'מספר טלפון הוא שדה חובה.',
      'City or area is required.': 'עיר או אזור הם שדה חובה.',
      'Age is required.': 'גיל הוא שדה חובה.',
      'Please choose a valid gender.': 'בחרו מגדר תקין.',
      'Please choose whether you are a driver.': 'בחרו אם אתם נהגים.',
      "Drivers must confirm they have a valid driver's license.": 'נהגים חייבים לאשר שיש להם רישיון נהיגה תקף.',
      "Please choose whether you have a driver's license.": 'בחרו אם יש לכם רישיון נהיגה.',
      'Please choose a valid gender preference.': 'בחרו העדפת מגדר תקינה.',
    },
  } as const;

  return map[lang][message as keyof (typeof map)[typeof lang]] ?? message;
}

export default function ProfileForm({
  userId,
  initialDisplayName,
  initialAvatarUrl,
  initialPhone,
  initialCityOrArea,
  initialAge,
  initialGender,
  initialIsDriver,
  initialHasDriverLicense = null,
  initialGenderPreference = '',
  initialLicenseImageStatus = 'not_provided',
  initialInsuranceImageStatus = 'not_provided',
  initialLicenseDeclared = false,
  initialInsuranceDeclared = false,
  mode = 'profile',
  redirectOnSuccess,
  showAvatarField = true,
}: Props) {
  const { t, lang } = useTranslation();
  const copy = COPY[lang];
  const isOnboarding = mode === 'onboarding';
  const showExtendedPersonalDetails = mode === 'profile';
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [phone, setPhone] = useState(initialPhone);
  const [cityOrArea, setCityOrArea] = useState(initialCityOrArea);
  const [age, setAge] = useState(initialAge ? String(initialAge) : '');
  const [gender, setGender] = useState(initialGender);
  const [isDriver, setIsDriver] = useState<boolean | null>(initialIsDriver);
  const [hasDriverLicense, setHasDriverLicense] = useState<boolean | null>(initialHasDriverLicense);
  const [genderPreference, setGenderPreference] = useState(initialGenderPreference ?? '');
  const [licenseImageStatus, setLicenseImageStatus] = useState<DocumentPlaceholderStatus>(initialLicenseImageStatus);
  const [insuranceImageStatus, setInsuranceImageStatus] = useState<DocumentPlaceholderStatus>(initialInsuranceImageStatus);
  const [licenseDeclared, setLicenseDeclared] = useState(initialLicenseDeclared);
  const [insuranceDeclared, setInsuranceDeclared] = useState(initialInsuranceDeclared);
  const [licenseLocalFileName, setLicenseLocalFileName] = useState<string | null>(null);
  const [insuranceLocalFileName, setInsuranceLocalFileName] = useState<string | null>(null);
  const [licenseInputKey, setLicenseInputKey] = useState(0);
  const [insuranceInputKey, setInsuranceInputKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLicensePlaceholderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLicenseLocalFileName(file.name);
    setLicenseImageStatus('provided_placeholder');
    setLicenseDeclared(true);
    setSuccess(false);
  };

  const handleInsurancePlaceholderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setInsuranceLocalFileName(file.name);
    setInsuranceImageStatus('provided_placeholder');
    setInsuranceDeclared(true);
    setSuccess(false);
  };

  const clearLicensePlaceholder = () => {
    setLicenseLocalFileName(null);
    setLicenseImageStatus('not_provided');
    setLicenseDeclared(false);
    setLicenseInputKey((value) => value + 1);
    setSuccess(false);
  };

  const clearInsurancePlaceholder = () => {
    setInsuranceLocalFileName(null);
    setInsuranceImageStatus('not_provided');
    setInsuranceDeclared(false);
    setInsuranceInputKey((value) => value + 1);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      await updateProfile(userId, {
        displayName,
        avatarUrl,
        phone,
        cityOrArea,
        age: age.trim().length > 0 ? Number(age) : null,
        gender,
        isDriver,
        ...(showExtendedPersonalDetails
          ? {
              hasDriverLicense,
              genderPreference,
              licenseImageStatus,
              insuranceImageStatus,
              licenseDeclared,
              insuranceDeclared,
            }
          : {}),
      });

      if (redirectOnSuccess) {
        window.location.href = redirectOnSuccess;
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? localizeProfileError(err.message, lang) : t('failed_to_save'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {t('display_name')}
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); setSuccess(false); }}
          required
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {copy.phone}
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setSuccess(false); }}
          required
          autoComplete="tel"
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {copy.city}
        </label>
        <input
          type="text"
          value={cityOrArea}
          onChange={(e) => { setCityOrArea(e.target.value); setSuccess(false); }}
          required
          autoComplete="address-level2"
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {copy.age}
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={age}
            onChange={(e) => { setAge(e.target.value); setSuccess(false); }}
            required
            inputMode="numeric"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {copy.gender}
          </label>
          <select
            value={gender}
            onChange={(e) => { setGender(e.target.value); setSuccess(false); }}
            required
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          >
            <option value="">{copy.genderSelect}</option>
            <option value="woman">{copy.genderOptions.woman}</option>
            <option value="man">{copy.genderOptions.man}</option>
            <option value="non-binary">{copy.genderOptions.nonBinary}</option>
            <option value="prefer_not_to_say">{copy.genderOptions.preferNotToSay}</option>
          </select>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {copy.driverQuestion}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
            isDriver === true
              ? 'border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-sky-900/20'
              : 'border-slate-300 dark:border-slate-700'
          }`}>
            <input
              type="radio"
              name="is_driver"
              checked={isDriver === true}
              onChange={() => { setIsDriver(true); setSuccess(false); }}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-slate-900 dark:text-white">{copy.driverYesTitle}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                {copy.driverYesDesc}
              </span>
            </span>
          </label>

          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
            isDriver === false
              ? 'border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-sky-900/20'
              : 'border-slate-300 dark:border-slate-700'
          }`}>
            <input
              type="radio"
              name="is_driver"
              checked={isDriver === false}
              onChange={() => { setIsDriver(false); setSuccess(false); }}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-slate-900 dark:text-white">{copy.driverNoTitle}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                {copy.driverNoDesc}
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {showExtendedPersonalDetails && (
        <>
          <fieldset className="space-y-2">
            <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {copy.licenseTitle}
            </legend>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isDriver === true ? copy.licenseRequired : copy.licenseOptional}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                hasDriverLicense === true
                  ? 'border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-sky-900/20'
                  : 'border-slate-300 dark:border-slate-700'
              }`}>
                <input
                  type="radio"
                  name="has_driver_license"
                  checked={hasDriverLicense === true}
                  onChange={() => { setHasDriverLicense(true); setSuccess(false); }}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900 dark:text-white">{t('yes')}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {copy.licenseYesDesc}
                  </span>
                </span>
              </label>

              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                hasDriverLicense === false
                  ? 'border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-sky-900/20'
                  : 'border-slate-300 dark:border-slate-700'
              }`}>
                <input
                  type="radio"
                  name="has_driver_license"
                  checked={hasDriverLicense === false}
                  onChange={() => { setHasDriverLicense(false); setSuccess(false); }}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900 dark:text-white">{t('no')}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {copy.licenseNoDesc}
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {copy.genderPreference}
            </label>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              {copy.genderPreferenceHint}
            </p>
            <select
              value={genderPreference}
              onChange={(e) => { setGenderPreference(e.target.value); setSuccess(false); }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
            >
              <option value="">{copy.genderPreferenceOptions.none}</option>
              <option value="women">{copy.genderPreferenceOptions.women}</option>
              <option value="men">{copy.genderPreferenceOptions.men}</option>
              <option value="non-binary">{copy.genderPreferenceOptions.nonBinary}</option>
              <option value="same_as_me">{copy.genderPreferenceOptions.sameAsMe}</option>
            </select>
          </div>

          <section className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/60 p-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {copy.verificationEyebrow}
              </p>
              <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {copy.verificationTitle}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {copy.verificationDesc}
              </p>
            </div>

            <DocumentPlaceholderCard
              title={copy.licenseImageTitle}
              description={copy.licenseImageDesc}
              inputLabel={copy.licenseImageInput}
              status={licenseImageStatus}
              localFileName={licenseLocalFileName}
              inputKey={licenseInputKey}
              selectedText={copy.selectedLocal}
              placeholderSavedText={copy.placeholderSavedText}
              noPlaceholderText={copy.noPlaceholderText}
              statusProvidedLabel={copy.placeholderProvided}
              statusMissingLabel={copy.placeholderMissing}
              footer={copy.placeholderFooter}
              clearLabel={copy.clear}
              onFileChange={handleLicensePlaceholderChange}
              onClear={clearLicensePlaceholder}
            />

            <DocumentPlaceholderCard
              title={copy.insuranceImageTitle}
              description={copy.insuranceImageDesc}
              inputLabel={copy.insuranceImageInput}
              status={insuranceImageStatus}
              localFileName={insuranceLocalFileName}
              inputKey={insuranceInputKey}
              selectedText={copy.selectedLocal}
              placeholderSavedText={copy.placeholderSavedText}
              noPlaceholderText={copy.noPlaceholderText}
              statusProvidedLabel={copy.placeholderProvided}
              statusMissingLabel={copy.placeholderMissing}
              footer={copy.placeholderFooter}
              clearLabel={copy.clear}
              onFileChange={handleInsurancePlaceholderChange}
              onClear={clearInsurancePlaceholder}
            />
          </section>
        </>
      )}

      {showAvatarField && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {t('avatar_url')}
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => { setAvatarUrl(e.target.value); setSuccess(false); }}
            placeholder="https://..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          />
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900/50 p-3">
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
            {isOnboarding ? copy.onboardingSaved : t('profile_updated')}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 p-3">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-sky-600 dark:bg-sky-500 px-4 py-3 font-medium text-white hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-50 transition-colors btn-press"
      >
        {loading ? t('saving') : isOnboarding ? copy.finishSetup : t('save')}
      </button>
    </form>
  );
}
