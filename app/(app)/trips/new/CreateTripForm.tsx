'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import CommunityBadge from '@/components/CommunityBadge';
import type { CommunityType } from '@/lib/types';
import { createTrip } from './actions';
import { formatLocalizedDateTime, formatSeatCount } from '@/lib/i18n/locale';

type Props = {
  communityId: string;
  communityName: string;
  communityType: CommunityType;
  initialOriginName?: string;
  initialDestinationName?: string;
  backHref?: string;
};

function getMinDatetime(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5, 0, 0);

  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}`;
}

const COPY = {
  en: {
    required: 'Required',
    ridePublished: 'Ride published',
    openingTrip: 'Opening your trip now...',
    postingIn: 'Posting in',
    publicWarning: 'Public communities are more open, so confirm the route, timing, and rider details carefully before you publish.',
    beforePublish: 'Before you publish',
    beforePublishBullets: [
      'Passengers will see your route, departure time, seats, and optional price.',
      'Publishing a ride requires display name, phone, city or area, age, and driver-ready details.',
      'Document placeholder selections do not count as verification.',
      'Required fields are marked with an asterisk.',
      'After publishing, you will land on the trip page to review the ride and next steps.',
    ],
    reviewProfile: 'Review profile details',
    startingPoint: 'Starting point',
    startingPlaceholder: 'e.g. Tel Aviv Central Station',
    destination: 'Destination',
    destinationPlaceholder: 'e.g. Jerusalem Bus Station',
    departureTime: 'Departure time',
    earliestTime: 'Earliest time is 5 minutes from now.',
    seatsForPassengers: 'Seats for passengers',
    seatsHelper: 'Choose how many passengers can join you.',
    pricePerSeat: 'Price per seat',
    priceHelper: 'Leave blank if you want riders to ask before discussing cost.',
    freeRide: 'Free ride',
    markAsFree: 'Mark as free',
    passengersSeeFree: 'Passengers will see this ride as free.',
    preview: 'Preview',
    routePlaceholder: 'Your route will appear here',
    chooseDepartureTime: 'Choose a departure time',
    noPriceYet: 'No price shown yet',
    perSeat: 'per seat',
    publishRide: 'Publish this ride',
    publishingRide: 'Publishing your ride...',
    afterPublish: 'After publishing, you will land on the trip page to manage seats and confirm the plan.',
    backToRides: 'Back to rides',
    allRequired: 'Please fill in all required fields.',
    failedCreate: 'Failed to create trip. Please try again.',
  },
  ar: {
    required: 'مطلوب',
    ridePublished: 'تم نشر الرحلة',
    openingTrip: 'جارٍ فتح الرحلة الآن...',
    postingIn: 'سيتم النشر داخل',
    publicWarning: 'المجتمعات العامة أكثر انفتاحًا، لذلك تأكد من المسار والتوقيت وتفاصيل الركاب جيدًا قبل النشر.',
    beforePublish: 'قبل النشر',
    beforePublishBullets: [
      'سيرى الركاب المسار ووقت الانطلاق وعدد المقاعد والسعر الاختياري.',
      'نشر الرحلة يتطلب الاسم المعروض ورقم الهاتف والمدينة أو المنطقة والعمر وتفاصيل السائق الأساسية.',
      'اختيارات المستندات المؤقتة لا تُعتبر تحققًا.',
      'الحقول المطلوبة مميزة بعلامة النجمة.',
      'بعد النشر ستنتقل إلى صفحة الرحلة لمراجعتها ومعرفة الخطوات التالية.',
    ],
    reviewProfile: 'راجع تفاصيل الملف الشخصي',
    startingPoint: 'نقطة الانطلاق',
    startingPlaceholder: 'مثال: محطة تل أبيب المركزية',
    destination: 'الوجهة',
    destinationPlaceholder: 'مثال: محطة حافلات القدس',
    departureTime: 'وقت الانطلاق',
    earliestTime: 'أقرب وقت متاح هو بعد 5 دقائق من الآن.',
    seatsForPassengers: 'المقاعد المتاحة للركاب',
    seatsHelper: 'اختر عدد الركاب الذين يمكنهم الانضمام إليك.',
    pricePerSeat: 'السعر لكل مقعد',
    priceHelper: 'اتركه فارغًا إذا كنت تريد مناقشة التكلفة لاحقًا مع الركاب.',
    freeRide: 'رحلة مجانية',
    markAsFree: 'علّمها كمجانية',
    passengersSeeFree: 'سيظهر للركاب أن هذه الرحلة مجانية.',
    preview: 'المعاينة',
    routePlaceholder: 'سيظهر مسارك هنا',
    chooseDepartureTime: 'اختر وقت الانطلاق',
    noPriceYet: 'لا يوجد سعر معروض بعد',
    perSeat: 'لكل مقعد',
    publishRide: 'انشر هذه الرحلة',
    publishingRide: 'جارٍ نشر الرحلة...',
    afterPublish: 'بعد النشر ستنتقل إلى صفحة الرحلة لإدارة المقاعد وتأكيد الخطة.',
    backToRides: 'العودة إلى الرحلات',
    allRequired: 'يرجى تعبئة كل الحقول المطلوبة.',
    failedCreate: 'تعذر إنشاء الرحلة. حاول مرة أخرى.',
  },
  he: {
    required: 'חובה',
    ridePublished: 'הנסיעה פורסמה',
    openingTrip: 'פותחים עכשיו את הנסיעה...',
    postingIn: 'הפרסום יופיע בתוך',
    publicWarning: 'קהילות ציבוריות פתוחות יותר, לכן כדאי לאשר היטב את המסלול, התזמון ופרטי הנוסעים לפני הפרסום.',
    beforePublish: 'לפני הפרסום',
    beforePublishBullets: [
      'הנוסעים יראו את המסלול, זמן היציאה, מספר המושבים והמחיר האופציונלי.',
      'פרסום נסיעה דורש שם תצוגה, טלפון, עיר או אזור, גיל ופרטי נהג בסיסיים.',
      'בחירת מסמכים זמניים לא נחשבת לאימות.',
      'שדות חובה מסומנים בכוכבית.',
      'אחרי הפרסום תעברו לעמוד הנסיעה כדי לבדוק את הפרטים והצעדים הבאים.',
    ],
    reviewProfile: 'בדקו את פרטי הפרופיל',
    startingPoint: 'נקודת מוצא',
    startingPlaceholder: 'למשל: התחנה המרכזית תל אביב',
    destination: 'יעד',
    destinationPlaceholder: 'למשל: התחנה המרכזית ירושלים',
    departureTime: 'שעת יציאה',
    earliestTime: 'הזמן המוקדם ביותר הוא בעוד 5 דקות.',
    seatsForPassengers: 'מושבים לנוסעים',
    seatsHelper: 'בחרו כמה נוסעים יכולים להצטרף אליכם.',
    pricePerSeat: 'מחיר למושב',
    priceHelper: 'השאירו ריק אם אתם מעדיפים לדבר על העלות אחר כך.',
    freeRide: 'נסיעה בחינם',
    markAsFree: 'סמנו כחינם',
    passengersSeeFree: 'הנוסעים יראו שהנסיעה הזו בחינם.',
    preview: 'תצוגה מקדימה',
    routePlaceholder: 'המסלול שלכם יופיע כאן',
    chooseDepartureTime: 'בחרו שעת יציאה',
    noPriceYet: 'עדיין לא מוצג מחיר',
    perSeat: 'למושב',
    publishRide: 'פרסמו את הנסיעה',
    publishingRide: 'מפרסמים את הנסיעה...',
    afterPublish: 'אחרי הפרסום תעברו לעמוד הנסיעה כדי לנהל מושבים ולאשר את התכנון.',
    backToRides: 'חזרה לנסיעות',
    allRequired: 'אנא מלאו את כל שדות החובה.',
    failedCreate: 'יצירת הנסיעה נכשלה. נסו שוב.',
  },
} as const;

function localizeCreateTripError(message: string, lang: keyof typeof COPY) {
  const map = {
    en: {
      'Origin and destination are required': 'Origin and destination are required.',
      'Departure time must be in the future': 'Departure time must be in the future.',
      'You must belong to this community to create a trip': 'You must belong to this community to create a trip.',
    },
    ar: {
      'Origin and destination are required': 'نقطة الانطلاق والوجهة مطلوبتان.',
      'Departure time must be in the future': 'يجب أن يكون وقت الانطلاق في المستقبل.',
      'You must belong to this community to create a trip': 'يجب أن تكون عضوًا في هذا المجتمع لإنشاء رحلة.',
    },
    he: {
      'Origin and destination are required': 'המוצא והיעד הם שדות חובה.',
      'Departure time must be in the future': 'שעת היציאה חייבת להיות בעתיד.',
      'You must belong to this community to create a trip': 'עליכם להשתייך לקהילה הזו כדי ליצור נסיעה.',
    },
  } as const;

  const normalized = message.replace(/\.$/, '');
  return map[lang][normalized as keyof (typeof map)[typeof lang]] ?? message;
}

export default function CreateTripForm({
  communityId,
  communityName,
  communityType,
  initialOriginName = '',
  initialDestinationName = '',
  backHref = '/app',
}: Props) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const copy = COPY[lang];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [originName, setOriginName] = useState(initialOriginName);
  const [destinationName, setDestinationName] = useState(initialDestinationName);
  const [departureTime, setDepartureTime] = useState('');
  const [seats, setSeats] = useState(3);
  const [isFree, setIsFree] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [touched, setTouched] = useState({ origin: false, destination: false, time: false });

  const minDatetime = getMinDatetime();
  const originError = touched.origin && !originName.trim() ? copy.required : null;
  const destinationError = touched.destination && !destinationName.trim() ? copy.required : null;
  const timeError = touched.time && !departureTime ? copy.required : null;

  const routePreview =
    originName.trim() && destinationName.trim()
      ? `${originName.trim()} → ${destinationName.trim()}`
      : copy.routePlaceholder;
  const pricePreview = isFree
    ? t('free')
    : priceInput
      ? `$${Number(priceInput || '0').toFixed(2)} ${copy.perSeat}`
      : copy.noPriceYet;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ origin: true, destination: true, time: true });

    if (!originName.trim() || !destinationName.trim() || !departureTime) {
      setError(copy.allRequired);
      return;
    }

    const departureDate = new Date(departureTime);
    if (departureDate <= new Date()) {
      setError(t('time_in_future'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const priceCents = isFree
        ? 0
        : priceInput
          ? Math.round(parseFloat(priceInput) * 100)
          : null;

      const trip = await createTrip({
        communityId,
        originLat: 0,
        originLng: 0,
        originName: originName.trim(),
        destinationLat: 0,
        destinationLng: 0,
        destinationName: destinationName.trim(),
        departureTime: departureDate.toISOString(),
        seatsTotal: seats,
        priceCents,
      });

      setSuccess(true);
      router.replace(`/trips/${trip.id}?created=1`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? localizeCreateTripError(submitError.message, lang)
          : copy.failedCreate
      );
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xl font-bold mx-auto">
          OK
        </div>
        <p className="text-base font-bold text-slate-900 dark:text-slate-100">{copy.ridePublished}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{copy.openingTrip}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{copy.postingIn}</p>
        <CommunityBadge name={communityName} type={communityType} />
        {communityType === 'public' && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            {copy.publicWarning}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{copy.beforePublish}</p>
        <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
          {copy.beforePublishBullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
        <Link
          href="/profile"
          className="inline-flex mt-3 text-sm font-medium text-sky-700 dark:text-sky-300 hover:text-sky-800 dark:hover:text-sky-200"
        >
          {copy.reviewProfile}
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-4 pt-4 pb-3">
          <label
            htmlFor="origin"
            className="block text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-1"
          >
            {copy.startingPoint} <span className="text-red-400 ml-0.5">*</span>
          </label>
          <input
            id="origin"
            type="text"
            value={originName}
            onChange={(event) => setOriginName(event.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, origin: true }))}
            placeholder={copy.startingPlaceholder}
            className="w-full bg-transparent text-[15px] font-medium text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none"
            autoComplete="off"
          />
          {originError && <p className="text-[10px] text-red-500 mt-1">{originError}</p>}
        </div>

        <div className="flex items-center px-4">
          <div className="flex flex-col items-center mr-3">
            <div className="w-2 h-2 rounded-full bg-sky-500" />
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 my-0.5" />
            <div className="w-2 h-2 rounded-full border-2 border-emerald-500" />
          </div>
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
        </div>

        <div className="px-4 pt-3 pb-4">
          <label
            htmlFor="destination"
            className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1"
          >
            {copy.destination} <span className="text-red-400 ml-0.5">*</span>
          </label>
          <input
            id="destination"
            type="text"
            value={destinationName}
            onChange={(event) => setDestinationName(event.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, destination: true }))}
            placeholder={copy.destinationPlaceholder}
            className="w-full bg-transparent text-[15px] font-medium text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none"
            autoComplete="off"
          />
          {destinationError && <p className="text-[10px] text-red-500 mt-1">{destinationError}</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-4">
        <div>
          <label htmlFor="departure" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {copy.departureTime} <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {copy.earliestTime}
          </p>
        </div>
        <input
          id="departure"
          type="datetime-local"
          value={departureTime}
          min={minDatetime}
          onChange={(event) => setDepartureTime(event.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, time: true }))}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
        />
        {timeError && <p className="text-xs text-red-500">{timeError}</p>}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {copy.seatsForPassengers}
          </label>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {copy.seatsHelper}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSeats((prev) => Math.max(1, prev - 1))}
            disabled={seats <= 1}
            className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-lg font-bold flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
          >
            -
          </button>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 w-8 text-center tabular-nums">
            {seats}
          </span>
          <button
            type="button"
            onClick={() => setSeats((prev) => Math.min(8, prev + 1))}
            disabled={seats >= 8}
            className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-lg font-bold flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
          >
            +
          </button>
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
            {formatSeatCount(seats, t)}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {copy.pricePerSeat}
              <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t('optional')}</span>
            </label>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {copy.priceHelper}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsFree((prev) => !prev);
              setPriceInput('');
            }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
              isFree
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-50'
            }`}
          >
            {isFree ? copy.freeRide : copy.markAsFree}
          </button>
        </div>

        {!isFree && (
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={priceInput}
              onChange={(event) => setPriceInput(event.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
            />
          </div>
        )}

        {isFree && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {copy.passengersSeeFree}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{copy.preview}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{routePreview}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="rounded-full bg-white dark:bg-slate-800 px-3 py-1">{communityName}</span>
          <span className="rounded-full bg-white dark:bg-slate-800 px-3 py-1">
            {departureTime ? formatLocalizedDateTime(lang, departureTime) : copy.chooseDepartureTime}
          </span>
          <span className="rounded-full bg-white dark:bg-slate-800 px-3 py-1">
            {formatSeatCount(seats, t)}
          </span>
          <span className="rounded-full bg-white dark:bg-slate-800 px-3 py-1">{pricePreview}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 px-4 py-3">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <button
          type="submit"
          disabled={loading}
          data-testid="publish-trip-button"
          className="w-full rounded-2xl bg-sky-600 dark:bg-sky-500 px-4 py-4 text-base font-bold text-white hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-50 transition-colors btn-press shadow-md"
        >
          {loading ? copy.publishingRide : copy.publishRide}
        </button>
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          {copy.afterPublish}
        </p>
        <Link
          href={backHref}
          className="block text-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        >
          {copy.backToRides}
        </Link>
      </div>
    </form>
  );
}
