'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import CommunityBadge from '@/components/CommunityBadge';
import type {
  CommunityType,
  TripPassengerGenderPreference,
  TripRulePresetKey,
  WeekdayIndex,
} from '@/lib/types';
import {
  MAX_DRIVER_NOTE_LENGTH,
  MAX_TRIP_RULES_NOTE_LENGTH,
  MAX_VEHICLE_COLOR_LENGTH,
  MAX_VEHICLE_MAKE_MODEL_LENGTH,
  TRIP_RULE_PRESET_KEYS,
  sanitizeTripRulePresetKeys,
} from '@/lib/trips/trust';
import { formatRecurringSummary, sanitizeWeekdays, isValidTimeString } from '@/lib/trips/recurrence';
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
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

// Weekday order for display: Mon-Fri-Sat-Sun (Mon-first for usability)
const WEEKDAY_DISPLAY_ORDER: WeekdayIndex[] = [1, 2, 3, 4, 5, 6, 0];

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
    tripModeSection: 'Trip type',
    tripModeHelper: 'One-time for a single trip. Recurring for a regular route you run on specific days each week.',
    oneTime: 'One-time',
    recurring: 'Recurring',
    departureTime: 'Departure time',
    earliestTime: 'Earliest time is 5 minutes from now.',
    recurringDays: 'Days of the week',
    recurringDaysHelper: 'Select all days this route runs.',
    recurringDaysRequired: 'Select at least one day.',
    recurringTime: 'Departure time (fixed)',
    recurringTimeHelper: 'This time applies every selected day.',
    recurringTimeRequired: 'Enter a valid departure time.',
    recurringPreview: 'Recurring schedule',
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
    weekdays: { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' } as Record<WeekdayIndex, string>,
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
    tripModeSection: 'نوع الرحلة',
    tripModeHelper: 'لمرة واحدة لرحلة فردية. متكررة لمسار تديره بانتظام في أيام محددة كل أسبوع.',
    oneTime: 'مرة واحدة',
    recurring: 'متكررة',
    departureTime: 'وقت الانطلاق',
    earliestTime: 'يمكنك اختيار وقت بعد 5 دقائق من الآن.',
    recurringDays: 'أيام الأسبوع',
    recurringDaysHelper: 'اختر الأيام التي ستتكرر فيها هذه الرحلة.',
    recurringDaysRequired: 'اختر يومًا واحدًا على الأقل.',
    recurringTime: 'وقت الانطلاق (ثابت)',
    recurringTimeHelper: 'سيتم استخدام هذا الوقت لكل يوم تم اختياره.',
    recurringTimeRequired: 'أدخل وقت انطلاق صحيحًا.',
    recurringPreview: 'جدول متكرر',
    seatsForPassengers: 'المقاعد المتاحة للركاب',
    seatsHelper: 'اختر عدد الركاب الذين يمكنهم الانضمام إليك.',
    pricePerSeat: 'السعر لكل مقعد (اختياري)',
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
    allRequired: 'أكمل جميع الحقول المطلوبة قبل المتابعة.',
    failedCreate: 'لم نتمكن من إنشاء الرحلة. حاول مرة أخرى.',
    weekdays: { 0: 'أحد', 1: 'اثنين', 2: 'ثلاثاء', 3: 'أربعاء', 4: 'خميس', 5: 'جمعة', 6: 'سبت' } as Record<WeekdayIndex, string>,
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
    tripModeSection: 'סוג נסיעה',
    tripModeHelper: 'חד-פעמית לנסיעה בודדת. קבועה למסלול שאתם מפעילים בימים קבועים בשבוע.',
    oneTime: 'חד-פעמית',
    recurring: 'קבועה',
    departureTime: 'שעת יציאה',
    earliestTime: 'הזמן המוקדם ביותר הוא בעוד 5 דקות.',
    recurringDays: 'ימי השבוע',
    recurringDaysHelper: 'בחרו את כל הימים שהמסלול הזה פועל בהם.',
    recurringDaysRequired: 'בחרו יום אחד לפחות.',
    recurringTime: 'שעת יציאה (קבועה)',
    recurringTimeHelper: 'שעה זו חלה על כל יום שנבחר.',
    recurringTimeRequired: 'הזינו שעת יציאה תקינה.',
    recurringPreview: 'לוח זמנים קבוע',
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
    weekdays: { 0: 'ראש', 1: 'שני', 2: 'שלי', 3: 'רביע', 4: 'חמי', 5: 'שיש', 6: 'שבת' } as Record<WeekdayIndex, string>,
  },
} as const;

const TRUST_COPY = {
  en: {
    vehicleSection: 'Vehicle details',
    vehicleSectionHelper: 'Riders use this to recognize you and feel more certain before joining.',
    vehicleMakeModel: 'Vehicle make and model',
    vehicleMakeModelPlaceholder: 'e.g. Toyota Corolla',
    vehicleColor: 'Vehicle color',
    vehicleColorPlaceholder: 'e.g. White',
    passengerPreferenceSection: 'Who can join this ride',
    passengerPreferenceHelper: 'Keep this simple. Riders will see it before booking, and booking will respect it.',
    passengerPreferenceLabel: 'Passenger preference',
    rideNotesSection: 'Driver note and trip rules',
    rideNotesSectionHelper: 'Keep it simple and human. Clear notes lower confusion and help riders decide faster.',
    driverNote: 'Short note about you',
    driverNotePlaceholder: 'e.g. I usually leave on time and call when I reach the meeting point.',
    driverNoteHelper: 'Optional. Use this to help riders recognize you or understand the vibe of the ride.',
    tripRules: 'Trip rules',
    tripRulesHelper: 'Pick the rules that matter for this ride. Riders will review them before booking.',
    additionalRuleNote: 'Additional note',
    additionalRuleNotePlaceholder: 'Anything riders should know before joining this ride?',
    additionalRuleNoteHelper: 'Optional. Use this for meeting point details, timing expectations, or anything specific to this ride.',
    priceDisputeNote: 'Any listed price is shown per seat only. If a disagreement or issue comes up later, riders can contact the admins from inside the platform.',
    vehicleLabel: 'Vehicle',
    passengerPreferencePreviewLabel: 'Passengers',
    driverNoteLabel: 'Driver note',
    tripRulesLabel: 'Trip rules',
    additionalNoteLabel: 'Additional note',
    vehiclePreviewFallback: 'Vehicle details will appear here',
    noRulesSelected: 'No ride rules selected yet',
    selectedRules: (count: number) => `${count} ride rule${count === 1 ? '' : 's'} selected`,
    passengerPreferenceOptions: {
      any: 'Any',
      men_only: 'Men only',
      women_only: 'Women only',
    } satisfies Record<TripPassengerGenderPreference, string>,
    ruleOptions: {
      no_delay: 'Please do not be late',
      wait_5_minutes: 'I wait up to 5 minutes',
      no_smoking: 'No smoking',
      prefer_quiet: 'Quiet ride preferred',
      fixed_meeting_point: 'Meeting point is fixed',
      confirm_attendance: 'Please confirm before departure',
    } satisfies Record<TripRulePresetKey, string>,
  },
  ar: {
    vehicleSection: 'تفاصيل السيارة',
    vehicleSectionHelper: 'هذه التفاصيل تساعد الركاب على التعرف عليك والشعور بوضوح أكبر قبل الحجز.',
    vehicleMakeModel: 'نوع وموديل السيارة',
    vehicleMakeModelPlaceholder: 'مثال: Toyota Corolla',
    vehicleColor: 'لون السيارة (اختياري)',
    vehicleColorPlaceholder: 'مثال: أبيض',
    passengerPreferenceSection: 'من يمكنه الانضمام لهذه الرحلة',
    passengerPreferenceHelper: 'خليها واضحة وبسيطة. الراكب سيشاهدها قبل الحجز، والحجز سيلتزم بها.',
    passengerPreferenceLabel: 'تفضيل الركاب',
    rideNotesSection: 'ملاحظات السائق وقواعد الرحلة',
    rideNotesSectionHelper: 'خليها بسيطة وواضحة. الملاحظات الواضحة تقلل الارتباك وتساعد الركاب يقرروا أسرع.',
    driverNote: 'نبذة قصيرة عنك (اختياري)',
    driverNotePlaceholder: 'مثال: عادةً أنطلق على الوقت وأتصل عند وصولي لنقطة اللقاء.',
    driverNoteHelper: 'يفيد الركاب في التعرف عليك أو فهم طبيعة الرحلة.',
    tripRules: 'قواعد الرحلة',
    tripRulesHelper: 'اختر القواعد التي تهمك في هذه الرحلة. سيطّلع عليها الركاب قبل الحجز.',
    additionalRuleNote: 'ملاحظة إضافية (اختياري)',
    additionalRuleNotePlaceholder: 'هل هناك شيء مهم يجب أن يعرفه الراكب قبل الانضمام؟',
    additionalRuleNoteHelper: 'استخدمه لنقطة اللقاء أو توقعات الوقت أو أي تفصيل خاص بهذه الرحلة.',
    priceDisputeNote: 'أي سعر ظاهر هنا يكون لكل مقعد فقط. وإذا حصل خلاف أو مشكلة لاحقًا، يمكن للركاب التوجه للإدارة من داخل المنصة.',
    vehicleLabel: 'السيارة',
    passengerPreferencePreviewLabel: 'الركاب',
    driverNoteLabel: 'ملاحظة السائق',
    tripRulesLabel: 'قواعد الرحلة',
    additionalNoteLabel: 'ملاحظة إضافية',
    vehiclePreviewFallback: 'ستظهر تفاصيل السيارة هنا',
    noRulesSelected: 'لم يتم اختيار قواعد للرحلة بعد',
    selectedRules: (count: number) => `تم اختيار ${count} من قواعد الرحلة`,
    passengerPreferenceOptions: {
      any: 'أي',
      men_only: 'ذكور فقط',
      women_only: 'إناث فقط',
    } satisfies Record<TripPassengerGenderPreference, string>,
    ruleOptions: {
      no_delay: 'الرجاء عدم التأخير',
      wait_5_minutes: 'أنتظر 5 دقائق كحد أقصى',
      no_smoking: 'ممنوع التدخين',
      prefer_quiet: 'يفضّل الهدوء',
      fixed_meeting_point: 'نقطة اللقاء ثابتة',
      confirm_attendance: 'الرجاء تأكيد الحضور',
    } satisfies Record<TripRulePresetKey, string>,
  },
  he: {
    vehicleSection: 'פרטי הרכב',
    vehicleSectionHelper: 'הפרטים האלה עוזרים לנוסעים לזהות אתכם ולהרגיש בטוחים יותר לפני ההזמנה.',
    vehicleMakeModel: 'סוג ודגם הרכב',
    vehicleMakeModelPlaceholder: 'למשל: Toyota Corolla',
    vehicleColor: 'צבע הרכב',
    vehicleColorPlaceholder: 'למשל: לבן',
    passengerPreferenceSection: 'מי יכול להצטרף לנסיעה',
    passengerPreferenceHelper: 'שמרו על זה ברור ופשוט. הנוסעים יראו זאת לפני ההזמנה, וההזמנה תכבד את הבחירה הזו.',
    passengerPreferenceLabel: 'העדפת נוסעים',
    rideNotesSection: 'הערת נהג וכללי הנסיעה',
    rideNotesSectionHelper: 'שמרו על זה פשוט וברור. הערות ברורות מפחיתות בלבול ועוזרות לנוסעים להחליט מהר יותר.',
    driverNote: 'הערה קצרה עליכם',
    driverNotePlaceholder: 'למשל: אני יוצא בזמן ומתקשר כשאני מגיע לנקודת המפגש.',
    driverNoteHelper: 'אופציונלי. עוזר לנוסעים לזהות אתכם או להבין את אופי הנסיעה.',
    tripRules: 'כללי הנסיעה',
    tripRulesHelper: 'בחרו את הכללים החשובים לנסיעה הזו. הנוסעים יראו אותם לפני ההזמנה.',
    additionalRuleNote: 'הערה נוספת',
    additionalRuleNotePlaceholder: 'יש משהו חשוב שהנוסעים צריכים לדעת לפני ההצטרפות?',
    additionalRuleNoteHelper: 'אופציונלי. השתמשו בזה לנקודת מפגש, ציפיות לגבי זמן או כל פרט אחר לנסיעה הזו.',
    priceDisputeNote: 'כל מחיר שמופיע כאן הוא למושב בלבד. אם יש מחלוקת או בעיה בהמשך, הנוסעים יכולים לפנות למנהלים מתוך הפלטפורמה.',
    vehicleLabel: 'רכב',
    passengerPreferencePreviewLabel: 'נוסעים',
    driverNoteLabel: 'הערת הנהג',
    tripRulesLabel: 'כללי הנסיעה',
    additionalNoteLabel: 'הערה נוספת',
    vehiclePreviewFallback: 'פרטי הרכב יופיעו כאן',
    noRulesSelected: 'עדיין לא נבחרו כללי נסיעה',
    selectedRules: (count: number) => `נבחרו ${count} כללי נסיעה`,
    passengerPreferenceOptions: {
      any: 'הכול',
      men_only: 'גברים בלבד',
      women_only: 'נשים בלבד',
    } satisfies Record<TripPassengerGenderPreference, string>,
    ruleOptions: {
      no_delay: 'בבקשה לא לאחר',
      wait_5_minutes: 'אני מחכה עד 5 דקות',
      no_smoking: 'אין לעשן',
      prefer_quiet: 'עדיפה נסיעה שקטה',
      fixed_meeting_point: 'נקודת המפגש קבועה',
      confirm_attendance: 'נא לאשר הגעה לפני היציאה',
    } satisfies Record<TripRulePresetKey, string>,
  },
} as const;

function localizeCreateTripError(message: string, lang: keyof typeof COPY) {
  const map = {
    en: {
      'Origin and destination are required': 'Origin and destination are required.',
      'Vehicle make and model are required': 'Vehicle make and model are required.',
      'Departure time must be in the future': 'Departure time must be in the future.',
      'Vehicle make and model is too long': 'Vehicle make and model is too long.',
      'Vehicle color is too long': 'Vehicle color is too long.',
      'Driver note is too long': 'Driver note is too long.',
      'Trip rules note is too long': 'Trip rules note is too long.',
      'Passenger gender preference is invalid': 'Passenger preference is invalid.',
      'One or more trip rules are invalid': 'One or more trip rules are invalid.',
      'You must belong to this community to create a trip': 'You must belong to this community to create a trip.',
    },
    ar: {
      'Origin and destination are required': 'نقطة الانطلاق والوجهة مطلوبتان.',
      'Vehicle make and model are required': 'نوع وموديل السيارة مطلوبان.',
      'Departure time must be in the future': 'يجب أن يكون وقت الانطلاق في المستقبل.',
      'Vehicle make and model is too long': 'تفاصيل نوع وموديل السيارة طويلة أكثر من اللازم.',
      'Vehicle color is too long': 'تفصيل لون السيارة طويل أكثر من اللازم.',
      'Driver note is too long': 'ملاحظة السائق طويلة أكثر من اللازم.',
      'Trip rules note is too long': 'الملاحظة الإضافية لقواعد الرحلة طويلة أكثر من اللازم.',
      'Passenger gender preference is invalid': 'تفضيل الركاب غير صالح.',
      'One or more trip rules are invalid': 'هناك قاعدة واحدة أو أكثر غير صالحة.',
      'You must belong to this community to create a trip': 'يجب أن تكون عضوًا في هذا المجتمع لإنشاء رحلة.',
      'Departure time is required for one-time trips': 'أدخل وقت الانطلاق قبل المتابعة.',
      'Departure time is invalid': 'وقت الانطلاق غير صحيح. اختر وقتًا صالحًا.',
      'Trips must offer at least 1 seat': 'يجب أن تتضمن الرحلة مقعدًا واحدًا على الأقل.',
      'Price must be a positive whole number of cents': 'السعر غير صحيح. أدخل رقمًا صحيحًا أو اترك الحقل فارغًا.',
      'Recurring departure time must be in HH:MM format': 'صيغة وقت الانطلاق غير صحيحة. أدخل الوقت بتنسيق HH:MM.',
    },
    he: {
      'Origin and destination are required': 'המוצא והיעד הם שדות חובה.',
      'Vehicle make and model are required': 'סוג ודגם הרכב הם שדות חובה.',
      'Departure time must be in the future': 'שעת היציאה חייבת להיות בעתיד.',
      'Vehicle make and model is too long': 'פירוט סוג ודגם הרכב ארוך מדי.',
      'Vehicle color is too long': 'פירוט צבע הרכב ארוך מדי.',
      'Driver note is too long': 'הערת הנהג ארוכה מדי.',
      'Trip rules note is too long': 'ההערה הנוספת לכללי הנסיעה ארוכה מדי.',
      'Passenger gender preference is invalid': 'העדפת הנוסעים אינה תקינה.',
      'One or more trip rules are invalid': 'כלל נסיעה אחד או יותר אינו תקין.',
      'You must belong to this community to create a trip': 'עליכם להשתייך לקהילה הזו כדי ליצור נסיעה.',
    },
  } as const;

  const normalized = message.replace(/\.$/, '');
  const staticResult = (map[lang] as Record<string, string>)[normalized];
  if (staticResult) return staticResult;

  // Arabic-only: handle dynamic server error messages
  if (lang === 'ar') {
    if (normalized.includes('driver-ready profile') || normalized.includes('Missing or incomplete')) {
      return 'أكمل بياناتك الشخصية قبل استخدام هذه الميزة.';
    }
    if (normalized.includes('Public community drivers can only have one active trip')) {
      return 'لا يمكنك نشر أكثر من رحلة نشطة في المجتمع العام. أغلق الرحلة الحالية أولًا.';
    }
    if (normalized.includes('Recurring trips must select between')) {
      return 'عدد أيام الرحلة المتكررة غير صالح. حدد الأيام الصحيحة.';
    }
    if (normalized.includes('Could not compute a valid next occurrence')) {
      return 'لا يمكن حساب موعد الرحلة القادمة. تأكد من أن الأيام المختارة تتضمن وقتًا مستقبليًا.';
    }
    return COPY.ar.failedCreate;
  }

  return message;
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
  const trustCopy = TRUST_COPY[lang];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Trip mode
  const [tripMode, setTripMode] = useState<'one_time' | 'recurring'>('one_time');

  // Route
  const [originName, setOriginName] = useState(initialOriginName);
  const [destinationName, setDestinationName] = useState(initialDestinationName);

  // One-time departure
  const [departureTime, setDepartureTime] = useState('');

  // Recurring
  const [recurringDays, setRecurringDays] = useState<WeekdayIndex[]>([]);
  const [recurringDepartureTime, setRecurringDepartureTime] = useState('');

  // Vehicle + trust
  const [vehicleMakeModel, setVehicleMakeModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [passengerGenderPreference, setPassengerGenderPreference] =
    useState<TripPassengerGenderPreference>('any');
  const [driverNote, setDriverNote] = useState('');
  const [tripRulesNote, setTripRulesNote] = useState('');
  const [selectedRuleKeys, setSelectedRuleKeys] = useState<TripRulePresetKey[]>([]);

  // Seats + price
  const [seats, setSeats] = useState(3);
  const [isFree, setIsFree] = useState(false);
  const [priceInput, setPriceInput] = useState('');

  // Touch tracking
  const [touched, setTouched] = useState({
    origin: false,
    destination: false,
    time: false,
    vehicle: false,
    recurringDays: false,
    recurringTime: false,
  });

  const minDatetime = getMinDatetime();
  const selectedRules = sanitizeTripRulePresetKeys(selectedRuleKeys);

  // Validation
  const originError = touched.origin && !originName.trim() ? copy.required : null;
  const destinationError = touched.destination && !destinationName.trim() ? copy.required : null;
  const timeError = touched.time && tripMode === 'one_time' && !departureTime ? copy.required : null;
  const vehicleError = touched.vehicle && !vehicleMakeModel.trim() ? copy.required : null;
  const recurringDaysError = touched.recurringDays && tripMode === 'recurring' && recurringDays.length === 0
    ? copy.recurringDaysRequired
    : null;
  const recurringTimeError = touched.recurringTime && tripMode === 'recurring' && !isValidTimeString(recurringDepartureTime)
    ? copy.recurringTimeRequired
    : null;

  // Preview values
  const routePreview =
    originName.trim() && destinationName.trim()
      ? `${originName.trim()} → ${destinationName.trim()}`
      : copy.routePlaceholder;
  const vehiclePreview =
    [vehicleMakeModel.trim(), vehicleColor.trim()].filter(Boolean).join(' · ') ||
    trustCopy.vehiclePreviewFallback;
  const passengerPreferencePreview = trustCopy.passengerPreferenceOptions[passengerGenderPreference];
  const pricePreview = isFree
    ? t('free')
    : priceInput
      ? `$${Number(priceInput || '0').toFixed(2)} ${copy.perSeat}`
      : copy.noPriceYet;

  // Recurring summary for preview
  const recurringSummary =
    tripMode === 'recurring'
      ? formatRecurringSummary(recurringDays, recurringDepartureTime, lang)
      : null;

  const toggleRuleKey = (ruleKey: TripRulePresetKey) => {
    setSelectedRuleKeys((current) =>
      current.includes(ruleKey)
        ? current.filter((key) => key !== ruleKey)
        : [...current, ruleKey]
    );
  };

  const toggleRecurringDay = (day: WeekdayIndex) => {
    setRecurringDays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const allTouched = {
      origin: true,
      destination: true,
      time: true,
      vehicle: true,
      recurringDays: true,
      recurringTime: true,
    };
    setTouched(allTouched);

    const isRecurring = tripMode === 'recurring';

    // Validate
    if (!originName.trim() || !destinationName.trim() || !vehicleMakeModel.trim()) {
      setError(copy.allRequired);
      return;
    }
    if (!isRecurring && !departureTime) {
      setError(copy.allRequired);
      return;
    }
    if (isRecurring) {
      if (recurringDays.length === 0) {
        setError(copy.recurringDaysRequired);
        return;
      }
      if (!isValidTimeString(recurringDepartureTime)) {
        setError(copy.recurringTimeRequired);
        return;
      }
    }

    if (!isRecurring) {
      const departureDate = new Date(departureTime);
      if (departureDate <= new Date()) {
        setError(t('time_in_future'));
        return;
      }
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
        vehicleMakeModel: vehicleMakeModel.trim(),
        vehicleColor: vehicleColor.trim() || null,
        passengerGenderPreference,
        driverNote: driverNote.trim() || null,
        tripRulePresetKeys: selectedRules,
        tripRulesNote: tripRulesNote.trim() || null,
        seatsTotal: seats,
        priceCents,
        // Mode-specific fields
        tripMode,
        ...(isRecurring
          ? {
              recurringDays: sanitizeWeekdays(recurringDays),
              recurringDepartureTime,
            }
          : {
              departureTime: new Date(departureTime).toISOString(),
            }),
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
      {/* Community context */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{copy.postingIn}</p>
        <CommunityBadge name={communityName} type={communityType} />
        {communityType === 'public' && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">{copy.publicWarning}</p>
        )}
      </div>

      {/* Before you publish */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{copy.beforePublish}</p>
        <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
          {copy.beforePublishBullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
        <div className="mt-3 rounded-xl border border-sky-100 bg-white px-3 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
          {trustCopy.priceDisputeNote}
        </div>
        <Link
          href="/profile"
          className="inline-flex mt-3 text-sm font-medium text-sky-700 dark:text-sky-300 hover:text-sky-800 dark:hover:text-sky-200"
        >
          {copy.reviewProfile}
        </Link>
      </div>

      {/* Route */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-4 pt-4 pb-3">
          <label htmlFor="origin" className="block text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-1">
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
          <label htmlFor="destination" className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
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

      {/* Trip mode selector */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{copy.tripModeSection}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{copy.tripModeHelper}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTripMode('one_time')}
            aria-pressed={tripMode === 'one_time'}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
              tripMode === 'one_time'
                ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-600 dark:bg-sky-900/30 dark:text-sky-300'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {copy.oneTime}
          </button>
          <button
            type="button"
            onClick={() => setTripMode('recurring')}
            aria-pressed={tripMode === 'recurring'}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
              tripMode === 'recurring'
                ? 'border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-600 dark:bg-violet-900/30 dark:text-violet-300'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            ↻ {copy.recurring}
          </button>
        </div>
      </div>

      {/* Departure — one_time */}
      {tripMode === 'one_time' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-4">
          <div>
            <label htmlFor="departure" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {copy.departureTime} <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{copy.earliestTime}</p>
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
      )}

      {/* Departure — recurring */}
      {tripMode === 'recurring' && (
        <div className="rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-white dark:bg-slate-900 p-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              ↻ {copy.recurring}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{copy.recurringDaysHelper}</p>
          </div>

          {/* Weekday chips */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              {copy.recurringDays} <span className="text-red-400">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_DISPLAY_ORDER.map((day) => {
                const isSelected = recurringDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleRecurringDay(day)}
                    aria-pressed={isSelected}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                      isSelected
                        ? 'border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-600 dark:bg-violet-900/30 dark:text-violet-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {copy.weekdays[day]}
                  </button>
                );
              })}
            </div>
            {recurringDaysError && (
              <p className="text-xs text-red-500 mt-1">{recurringDaysError}</p>
            )}
          </div>

          {/* Fixed time */}
          <div>
            <label htmlFor="recurring-time" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
              {copy.recurringTime} <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">{copy.recurringTimeHelper}</p>
            <input
              id="recurring-time"
              type="time"
              value={recurringDepartureTime}
              onChange={(event) => setRecurringDepartureTime(event.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, recurringTime: true }))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-colors"
            />
            {recurringTimeError && (
              <p className="text-xs text-red-500 mt-1">{recurringTimeError}</p>
            )}
          </div>

          {/* Recurring summary preview */}
          {recurringSummary && (
            <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 px-4 py-3">
              <p className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-widest mb-1">{copy.recurringPreview}</p>
              <p className="text-sm font-semibold text-violet-800 dark:text-violet-200">{recurringSummary}</p>
            </div>
          )}
        </div>
      )}

      {/* Vehicle details */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{trustCopy.vehicleSection}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{trustCopy.vehicleSectionHelper}</p>
        </div>
        <div>
          <label htmlFor="vehicle-make-model" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
            {trustCopy.vehicleMakeModel} <span className="text-red-400">*</span>
          </label>
          <input
            id="vehicle-make-model"
            data-testid="vehicle-make-model-input"
            type="text"
            maxLength={MAX_VEHICLE_MAKE_MODEL_LENGTH}
            value={vehicleMakeModel}
            onChange={(event) => setVehicleMakeModel(event.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, vehicle: true }))}
            placeholder={trustCopy.vehicleMakeModelPlaceholder}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          />
          {vehicleError && <p className="text-xs text-red-500 mt-1">{vehicleError}</p>}
        </div>
        <div>
          <label htmlFor="vehicle-color" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
            {trustCopy.vehicleColor}
            <span className="ml-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('optional')}</span>
          </label>
          <input
            id="vehicle-color"
            type="text"
            maxLength={MAX_VEHICLE_COLOR_LENGTH}
            value={vehicleColor}
            onChange={(event) => setVehicleColor(event.target.value)}
            placeholder={trustCopy.vehicleColorPlaceholder}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Driver notes + rules */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{trustCopy.rideNotesSection}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{trustCopy.rideNotesSectionHelper}</p>
        </div>
        <div>
          <label htmlFor="driver-note" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
            {trustCopy.driverNote}
            <span className="ml-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('optional')}</span>
          </label>
          <textarea
            id="driver-note"
            rows={3}
            maxLength={MAX_DRIVER_NOTE_LENGTH}
            value={driverNote}
            onChange={(event) => setDriverNote(event.target.value)}
            placeholder={trustCopy.driverNotePlaceholder}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          />
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400 dark:text-slate-500">{trustCopy.driverNoteHelper}</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{driverNote.length}/{MAX_DRIVER_NOTE_LENGTH}</span>
          </div>
        </div>
        <div>
          <p className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{trustCopy.tripRules}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">{trustCopy.tripRulesHelper}</p>
          <div className="flex flex-wrap gap-2">
            {TRIP_RULE_PRESET_KEYS.map((ruleKey) => {
              const isSelected = selectedRules.includes(ruleKey);
              return (
                <button
                  key={ruleKey}
                  type="button"
                  onClick={() => toggleRuleKey(ruleKey)}
                  aria-pressed={isSelected}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                      : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {trustCopy.ruleOptions[ruleKey]}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label htmlFor="trip-rules-note" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
            {trustCopy.additionalRuleNote}
            <span className="ml-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('optional')}</span>
          </label>
          <textarea
            id="trip-rules-note"
            rows={3}
            maxLength={MAX_TRIP_RULES_NOTE_LENGTH}
            value={tripRulesNote}
            onChange={(event) => setTripRulesNote(event.target.value)}
            placeholder={trustCopy.additionalRuleNotePlaceholder}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          />
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400 dark:text-slate-500">{trustCopy.additionalRuleNoteHelper}</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{tripRulesNote.length}/{MAX_TRIP_RULES_NOTE_LENGTH}</span>
          </div>
        </div>
      </div>

      {/* Passenger preference */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{trustCopy.passengerPreferenceSection}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{trustCopy.passengerPreferenceHelper}</p>
        </div>
        <div>
          <label htmlFor="passenger-gender-preference" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
            {trustCopy.passengerPreferenceLabel}
          </label>
          <select
            id="passenger-gender-preference"
            value={passengerGenderPreference}
            onChange={(event) => setPassengerGenderPreference(event.target.value as TripPassengerGenderPreference)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          >
            <option value="any">{trustCopy.passengerPreferenceOptions.any}</option>
            <option value="men_only">{trustCopy.passengerPreferenceOptions.men_only}</option>
            <option value="women_only">{trustCopy.passengerPreferenceOptions.women_only}</option>
          </select>
        </div>
      </div>

      {/* Seats */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{copy.seatsForPassengers}</label>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{copy.seatsHelper}</p>
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
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 w-8 text-center tabular-nums">{seats}</span>
          <button
            type="button"
            onClick={() => setSeats((prev) => Math.min(8, prev + 1))}
            disabled={seats >= 8}
            className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-lg font-bold flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
          >
            +
          </button>
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">{formatSeatCount(seats, t)}</span>
        </div>
      </div>

      {/* Price */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {copy.pricePerSeat}
              <span className="ml-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('optional')}</span>
            </label>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{copy.priceHelper}</p>
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
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{copy.passengersSeeFree}</p>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{copy.preview}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{routePreview}</p>

        {/* Recurring mode badge in preview */}
        {tripMode === 'recurring' && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 px-3 py-1 text-xs font-bold text-violet-700 dark:text-violet-300">
              ↻ {copy.recurring}
              {recurringSummary && (
                <span className="font-normal">· {recurringSummary}</span>
              )}
            </span>
          </div>
        )}

        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="rounded-full bg-white dark:bg-slate-800 px-3 py-1">{communityName}</span>
          {tripMode === 'one_time' && (
            <span className="rounded-full bg-white dark:bg-slate-800 px-3 py-1">
              {departureTime ? formatLocalizedDateTime(lang, departureTime) : copy.chooseDepartureTime}
            </span>
          )}
          <span className="rounded-full bg-white dark:bg-slate-800 px-3 py-1">{formatSeatCount(seats, t)}</span>
          <span className="rounded-full bg-white dark:bg-slate-800 px-3 py-1">{pricePreview}</span>
          <span className="rounded-full bg-white dark:bg-slate-800 px-3 py-1">
            {trustCopy.vehicleLabel}: {vehiclePreview}
          </span>
          <span className="rounded-full bg-white dark:bg-slate-800 px-3 py-1">
            {trustCopy.passengerPreferencePreviewLabel}: {passengerPreferencePreview}
          </span>
          <span className="rounded-full bg-white dark:bg-slate-800 px-3 py-1">
            {selectedRules.length > 0 ? trustCopy.selectedRules(selectedRules.length) : trustCopy.noRulesSelected}
          </span>
        </div>

        {(driverNote.trim() || tripRulesNote.trim() || selectedRules.length > 0) && (
          <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            {driverNote.trim() && (
              <p dir="auto">
                <span className="font-semibold">{trustCopy.driverNoteLabel}:</span> {driverNote.trim()}
              </p>
            )}
            {selectedRules.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedRules.map((ruleKey) => (
                  <span key={ruleKey} className="rounded-full bg-white dark:bg-slate-800 px-3 py-1 font-medium">
                    {trustCopy.ruleOptions[ruleKey]}
                  </span>
                ))}
              </div>
            )}
            {tripRulesNote.trim() && (
              <p dir="auto">
                <span className="font-semibold">{trustCopy.additionalNoteLabel}:</span> {tripRulesNote.trim()}
              </p>
            )}
          </div>
        )}
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
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">{copy.afterPublish}</p>
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
