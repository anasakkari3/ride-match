'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { BRAND_NAME, brandCopy } from '@/lib/brand/config';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { getFirebaseFirestore } from '@/lib/firebase/config';
import type {
  BookingWithPassenger,
  TripPassengerGenderPreference,
  TripRulePresetKey,
  TripWithDriver,
  UsersRow,
} from '@/lib/types';
import type { Lang } from '@/lib/i18n/dictionaries';
import { sanitizeTripRulePresetKeys } from '@/lib/trips/trust';
import { isRecurringTrip, formatRecurringSummary } from '@/lib/trips/recurrence';
import {
  doesPassengerGenderMatchPreference,
  normalizeTripPassengerGenderPreference,
} from '@/lib/trips/comfort';
import {
  formatLocalizedDate,
  formatLocalizedDateTime,
  formatLocalizedTime,
  formatPriceLabel,
  formatRouteLabel,
  formatSeatAvailability,
  formatSeatCount,
  getRelativeDayLabel,
} from '@/lib/i18n/locale';
import { bookSeat, cancelBookingAction, updateTripStatusAction } from './actions';
import { getEffectiveTripStatus } from '@/lib/trips/lifecycle';
import { canStartTrip, canCompleteTrip } from '@/lib/trips/lifecycle-permissions';
import { DriverTrustSummary } from '@/app/(app)/DriverTrustSummary';
import CommunityBadge from '@/components/CommunityBadge';
import EmptyStateCard from '@/components/EmptyStateCard';
import { canDisplayDriverCancelAction } from '@/lib/trips/coordination';
import TripCoordinationPanel from './TripCoordinationPanel';
import ReportUserModal from './ReportUserModal';
import { DETAIL_COPY, localizeTripActionError } from './tripDetailCopy';

type Props = {
  trip: TripWithDriver;
  bookings: BookingWithPassenger[];
  currentUserId: string | null;
  currentUserGender: UsersRow['gender'] | null;
  communicationAccess: {
    canView: boolean;
    canSendMessages: boolean;
    canSendCoordination: boolean;
    isRestricted: boolean;
  };
  wasJustCreated?: boolean;
};

const SURFACE_COPY = {
  en: {
    communicationReady: 'Trip communication',
    communicationReadOnly: 'Trip updates',
    communicationReadyDesc:
      'Open the trip thread for pickup notes, structured updates, and any last-minute coordination.',
    communicationRestrictedDesc:
      'Direct chat is limited on this trip, but structured updates and cancellations still appear in the same thread.',
    communicationReadOnlyDesc:
      'Open the thread to review trip updates, coordination signals, and cancellations in one place.',
    passengerListHint: 'Confirmed riders and cancellations appear here as this trip changes.',
    rosterEmptyTitle: 'No passengers yet',
    rosterEmptyDesc:
      'This trip is already live in the community. Seats will appear here as riders book.',
  },
  ar: {
    communicationReady: 'تواصل الرحلة',
    communicationReadOnly: 'تحديثات الرحلة',
    communicationReadyDesc:
      'افتح محادثة الرحلة لملاحظات الالتقاء والتحديثات المنظمة وأي تنسيق أخير قبل الانطلاق.',
    communicationRestrictedDesc:
      'الدردشة المباشرة محدودة في هذه الرحلة، لكن التحديثات المنظمة وعمليات الإلغاء ما زالت تظهر في نفس المحادثة.',
    communicationReadOnlyDesc:
      'افتح المحادثة لمراجعة تحديثات الرحلة وإشارات التنسيق وعمليات الإلغاء في مكان واحد.',
    passengerListHint: 'تظهر هنا الحجوزات المؤكدة وعمليات الإلغاء كلما تغيّرت الرحلة.',
    rosterEmptyTitle: 'لا يوجد ركاب بعد',
    rosterEmptyDesc: 'هذه الرحلة منشورة الآن داخل المجتمع. ستظهر المقاعد هنا عندما يبدأ الركاب بالحجز.',
  },
  he: {
    communicationReady: 'תקשורת נסיעה',
    communicationReadOnly: 'עדכוני נסיעה',
    communicationReadyDesc:
      'פתחו את שרשור הנסיעה להערות איסוף, עדכונים מובנים וכל תיאום של הרגע האחרון.',
    communicationRestrictedDesc:
      'הצ׳אט הישיר מוגבל בנסיעה הזאת, אבל עדכונים מובנים וביטולים עדיין מופיעים באותו שרשור.',
    communicationReadOnlyDesc:
      'פתחו את השרשור כדי לעבור על עדכוני נסיעה, סימוני תיאום וביטולים במקום אחד.',
    passengerListHint: 'נוסעים מאושרים וביטולים יופיעו כאן ככל שהנסיעה תשתנה.',
    rosterEmptyTitle: 'עדיין אין נוסעים',
    rosterEmptyDesc: 'הנסיעה כבר פעילה בקהילה. מושבים יופיעו כאן ברגע שמישהו יזמין.',
  },
} as const;

const RECURRING_COPY = {
  en: { badge: 'Recurring', schedule: 'Schedule' },
  ar: { badge: 'متكررة', schedule: 'الجدول' },
  he: { badge: 'קבועה', schedule: 'לוח זמנים' },
} as const;

const TRUST_COPY = {
  en: {
    rideDetails: 'Ride details',
    rideDetailsDesc: 'These details help riders understand what to expect before they join.',
    driverGender: 'Driver gender',
    passengerPreference: 'Passenger preference',
    vehicle: 'Vehicle',
    driverNote: 'Driver note',
    tripRules: 'Trip rules',
    additionalNote: 'Additional note',
    noSpecialRules: 'No special ride rules were added for this trip.',
    bookingPreferenceGateTitle: 'This trip has a rider preference',
    bookingPreferenceGateDesc: (label: string) =>
      `You can view the trip details, but booking follows the driver's selected preference: ${label}.`,
    howCoordinationWorks: 'How coordination works',
    coordinationDescription:
      `${BRAND_NAME} helps people coordinate shared rides between users. The direct trip details, timing, meeting point, and ride conduct stay with the people taking part in it.`,
    supportDescription:
      'If something goes wrong, you can report it from inside the platform so the admins or support team can review it.',
    pricingDescription:
      'Any listed price is shown per seat. If there is a disagreement later, it can be escalated through the in-app report path.',
    bookingChecklist: 'Before you confirm',
    bookingChecklistDesc:
      'Take a quick look at the ride details, then confirm the acknowledgements below.',
    ackTripRules:
      'I read the ride details, driver notes, and any trip rules shown for this ride.',
    ackPlatformRole:
      `I understand that ${BRAND_NAME} helps coordinate the ride between users and is not the direct operator of the trip itself.`,
    ackSupportPath:
      'If a problem comes up, I can use the in-app report path so the admins or support team can review it.',
    driverGenderOptions: {
      man: 'Man',
      woman: 'Woman',
    },
    passengerPreferenceOptions: {
      any: 'Any riders',
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
    rideDetails: 'تفاصيل الرحلة',
    rideDetailsDesc: 'هذه التفاصيل تساعد الراكب يفهم ماذا يتوقع قبل الانضمام.',
    driverGender: 'جنس السائق',
    passengerPreference: 'تفضيل الركاب',
    vehicle: 'السيارة',
    driverNote: 'ملاحظة السائق',
    tripRules: 'قواعد الرحلة',
    additionalNote: 'ملاحظة إضافية',
    noSpecialRules: 'لا توجد قواعد خاصة مضافة لهذه الرحلة.',
    bookingPreferenceGateTitle: 'هذه الرحلة لها تفضيل للركاب',
    bookingPreferenceGateDesc: (label: string) =>
      `يمكنك مشاهدة تفاصيل الرحلة، لكن الحجز يلتزم بالتفضيل الذي حدده السائق: ${label}.`,
    howCoordinationWorks: 'كيف يتم التنسيق',
    coordinationDescription:
      `${BRAND_NAME} يساعد المستخدمين على تنسيق الرحلات المشتركة بينهم. تفاصيل الرحلة نفسها والتوقيت ونقطة اللقاء وطريقة التنقل تبقى بين أطراف الرحلة.`,
    supportDescription:
      'إذا حصلت مشكلة، يمكنك رفع بلاغ من داخل المنصة حتى تتمكن الإدارة أو فريق الدعم من مراجعتها.',
    pricingDescription:
      'أي سعر ظاهر هنا يكون لكل مقعد. وإذا حصل خلاف لاحقًا، يمكن تصعيده من خلال البلاغ داخل التطبيق.',
    bookingChecklist: 'قبل تأكيد الحجز',
    bookingChecklistDesc:
      'راجع تفاصيل الرحلة بسرعة، ثم أكّد الإقرارات التالية قبل إتمام الحجز.',
    ackTripRules: 'أقر أنني قرأت تفاصيل الرحلة وملاحظات السائق وأي قواعد ظاهرة لهذه الرحلة.',
    ackPlatformRole:
      `أفهم أن ${BRAND_NAME} يسهّل تنسيق الرحلة بين المستخدمين، وليس الجهة المشغلة المباشرة للرحلة نفسها.`,
    ackSupportPath:
      'إذا حصلت مشكلة، يمكنني استخدام مسار البلاغ داخل المنصة حتى تتمكن الإدارة أو الدعم من المراجعة.',
    driverGenderOptions: {
      man: 'ذكر',
      woman: 'أنثى',
    },
    passengerPreferenceOptions: {
      any: 'أي راكب',
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
    rideDetails: 'פרטי הנסיעה',
    rideDetailsDesc: 'הפרטים האלה עוזרים לנוסעים להבין למה לצפות לפני ההצטרפות.',
    driverGender: 'מגדר הנהג',
    passengerPreference: 'העדפת נוסעים',
    vehicle: 'רכב',
    driverNote: 'הערת הנהג',
    tripRules: 'כללי הנסיעה',
    additionalNote: 'הערה נוספת',
    noSpecialRules: 'לא נוספו כללים מיוחדים לנסיעה הזו.',
    bookingPreferenceGateTitle: 'לנסיעה הזו יש העדפת נוסעים',
    bookingPreferenceGateDesc: (label: string) =>
      `אפשר לראות את פרטי הנסיעה, אבל ההזמנה מכבדת את ההעדפה שהנהג בחר: ${label}.`,
    howCoordinationWorks: 'איך התיאום עובד',
    coordinationDescription:
      `${BRAND_NAME} עוזרת למשתמשים לתאם נסיעות משותפות ביניהם. פרטי הנסיעה עצמה, התזמון, נקודת המפגש ואופי הנסיעה נשארים בין משתתפי הנסיעה.`,
    supportDescription:
      'אם מתעוררת בעיה, אפשר לדווח מתוך הפלטפורמה כדי שהמנהלים או צוות התמיכה יוכלו לבדוק אותה.',
    pricingDescription:
      'כל מחיר שמופיע כאן הוא למושב. אם יש מחלוקת אחר כך, אפשר להסלים אותה דרך מסלול הדיווח בתוך האפליקציה.',
    bookingChecklist: 'לפני האישור',
    bookingChecklistDesc:
      'עברו בקצרה על פרטי הנסיעה ואז אשרו את ההצהרות הבאות לפני ההזמנה.',
    ackTripRules:
      'אני מאשר/ת שקראתי את פרטי הנסיעה, הערות הנהג וכללי הנסיעה שמופיעים כאן.',
    ackPlatformRole:
      `אני מבין/ה ש-${BRAND_NAME} מסייעת בתיאום בין משתמשים ואינה המפעילה הישירה של הנסיעה עצמה.`,
    ackSupportPath:
      'אם תתעורר בעיה, אוכל להשתמש במסלול הדיווח בתוך האפליקציה כדי שהמנהלים או התמיכה יבדקו אותה.',
    driverGenderOptions: {
      man: 'גבר',
      woman: 'אישה',
    },
    passengerPreferenceOptions: {
      any: 'כל נוסע',
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

function formatDeparture(isoString: string, lang: Lang, t: (key: string) => string) {
  const departure = new Date(isoString);
  const now = new Date();
  const diffMs = departure.getTime() - now.getTime();
  const isPast = departure < now;

  return {
    date: isPast
      ? formatLocalizedDate(lang, departure, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
      : getRelativeDayLabel(lang, departure, t),
    time: formatLocalizedTime(lang, departure),
    isPast,
    isSoon: !isPast && diffMs < 60 * 60 * 1000,
  };
}

function formatPerSeatPrice(
  priceCents: number | null | undefined,
  t: (key: string) => string,
  perSeatSuffix: string
) {
  const label = formatPriceLabel(priceCents, t);
  if (!label) return null;
  if (priceCents === 0) return label;
  return `${label} ${perSeatSuffix}`;
}

function upsertBooking(
  existingBookings: BookingWithPassenger[],
  canonicalBooking: BookingWithPassenger
) {
  const existingIndex = existingBookings.findIndex((booking) => booking.id === canonicalBooking.id);

  if (existingIndex === -1) {
    return [...existingBookings, canonicalBooking];
  }

  return existingBookings.map((booking) =>
    booking.id === canonicalBooking.id
      ? {
          ...booking,
          ...canonicalBooking,
        }
      : booking
  );
}

function passengerFromBookingSnapshot(booking: BookingWithPassenger) {
  const displayName =
    typeof booking.passenger_display_name === 'string'
      ? booking.passenger_display_name
      : null;
  const avatarUrl =
    typeof booking.passenger_avatar_url === 'string'
      ? booking.passenger_avatar_url
      : null;

  if (!displayName && !avatarUrl) {
    return null;
  }

  return {
    id: booking.passenger_id,
    display_name: displayName,
    avatar_url: avatarUrl,
    gender: null,
    rating_avg: 0,
    rating_count: 0,
  };
}

function getAsyncErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getAsyncErrorCode(error: unknown) {
  return error && typeof error === 'object' && 'code' in error
    ? String((error as { code?: unknown }).code)
    : undefined;
}

function getParticipantInitial(name: string | null | undefined, fallback: string) {
  const initial = name?.trim().charAt(0);
  return (initial || fallback || 'P').toUpperCase();
}

export default function TripDetailClient({
  trip: initialTrip,
  bookings: initialBookings,
  currentUserId,
  currentUserGender,
  communicationAccess,
  wasJustCreated = false,
}: Props) {
  const { t, lang } = useTranslation();
  const copy = DETAIL_COPY[lang] ?? DETAIL_COPY.en;
  const surfaceCopy = SURFACE_COPY[lang] ?? SURFACE_COPY.en;
  const trustCopy = brandCopy(TRUST_COPY[lang] ?? TRUST_COPY.en);
  const [trip, setTrip] = useState(initialTrip);
  const [bookings, setBookings] = useState(initialBookings);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(wasJustCreated ? copy.tripLiveNotice : null);
  const [showBookConfirm, setShowBookConfirm] = useState(false);
  const [showCancelTripConfirm, setShowCancelTripConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [bookingAcks, setBookingAcks] = useState({
    tripRules: false,
    platformRole: false,
    supportPath: false,
  });
  const [shouldWatchBookings, setShouldWatchBookings] = useState(
    currentUserId === initialTrip.driver_id ||
      initialBookings.some(
        (booking) => booking.passenger_id === currentUserId && booking.status === 'confirmed'
      )
  );
  // Same defensive pattern as ChatRoom: only let a permission-denied error
  // tear down the listener if we have already received at least one good
  // snapshot. A first-fire permission-denied is almost always a transient
  // auth-state race or a brief reconnect, and clearing the roster on it would
  // mirror the chat-redirect bug — silently wiping legitimate data the
  // server already authorized us to see.
  const hasObservedBookingsRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    let isRefreshing = false;
    const db = getFirebaseFirestore();
    const tripRef = doc(db, 'trips', initialTrip.id);

    const refreshTrip = async () => {
      if (isRefreshing) return;
      isRefreshing = true;
      try {
        const snapshot = await getDoc(tripRef);
        if (!isMounted || !snapshot.exists()) return;

        const data = snapshot.data();
        setTrip((prev) => ({ ...prev, ...data, id: snapshot.id }));
      } catch (refreshError) {
        console.warn('Trip refresh error:', getAsyncErrorMessage(refreshError));
      } finally {
        isRefreshing = false;
      }
    };

    void refreshTrip();
    const refreshInterval = window.setInterval(refreshTrip, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshInterval);
    };
  }, [initialTrip.id]);

  useEffect(() => {
    if (!shouldWatchBookings) return;
    hasObservedBookingsRef.current = false;
    let isMounted = true;
    let isRefreshing = false;

    const db = getFirebaseFirestore();
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('trip_id', '==', initialTrip.id)
    );

    const passengerMap = new Map(
      initialBookings.map((booking) => [booking.id, booking.passenger ?? null])
    );

    const refreshBookings = async () => {
      if (isRefreshing) return;
      isRefreshing = true;
      try {
        const snapshot = await getDocs(bookingsQuery);
        if (!isMounted) return;

        hasObservedBookingsRef.current = true;
        const nextBookings = snapshot.docs
          .map((bookingDoc) => {
            const data = bookingDoc.data() as BookingWithPassenger;
            const snapshotPassenger = passengerFromBookingSnapshot({
              ...data,
              id: bookingDoc.id,
            } as BookingWithPassenger);

            return {
              ...data,
              id: bookingDoc.id,
              passenger: passengerMap.get(bookingDoc.id) ?? snapshotPassenger,
            } as BookingWithPassenger;
          })
          .filter(
            (booking) => booking.status === 'confirmed' || booking.status === 'cancelled'
          );

        setBookings((prev) => {
          const previousPassengerMap = new Map(
            prev.map((booking) => [booking.id, booking.passenger ?? null])
          );

          return nextBookings.map((booking) => ({
            ...booking,
            passenger:
              booking.passenger ??
              previousPassengerMap.get(booking.id) ??
              passengerFromBookingSnapshot(booking),
          }));
        });
      } catch (refreshError) {
        if (getAsyncErrorCode(refreshError) === 'permission-denied') {
          // Only treat permission-denied as a real loss of access if we
          // previously saw at least one snapshot - otherwise it's an
          // initial-load race and we should keep the server-rendered roster.
          if (hasObservedBookingsRef.current) {
            setBookings([]);
            setShouldWatchBookings(false);
          }
          return;
        }
        console.warn('Booking refresh error:', getAsyncErrorMessage(refreshError));
      } finally {
        isRefreshing = false;
      }
    };

    void refreshBookings();
    const refreshInterval = window.setInterval(refreshBookings, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshInterval);
    };
  }, [initialBookings, initialTrip.id, shouldWatchBookings]);

  const effectiveStatus = getEffectiveTripStatus(trip);
  const isDriver = currentUserId === trip.driver_id;
  const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed');
  const myBooking = bookings.find(
    (booking) => booking.passenger_id === currentUserId && booking.status === 'confirmed'
  );
  const myCancelledBooking = bookings.find(
    (booking) => booking.passenger_id === currentUserId && booking.status === 'cancelled'
  );
  const hasBooked = Boolean(myBooking);
  const hasCancelled = Boolean(myCancelledBooking) && !hasBooked;
  const isScheduled = effectiveStatus === 'scheduled';
  const isFull = effectiveStatus === 'full';
  const isInProgress = effectiveStatus === 'in_progress';
  const isCompleted = effectiveStatus === 'completed';
  const isCancelled = effectiveStatus === 'cancelled';
  const isActiveTrip = isScheduled || isFull || isInProgress;
  const { date, time, isPast, isSoon } = formatDeparture(trip.departure_time, lang, t);
  const passengerPreference = normalizeTripPassengerGenderPreference(
    trip.passenger_gender_preference
  );
  const passengerPreferenceLabel =
    trustCopy.passengerPreferenceOptions[passengerPreference];
  const driverGenderLabel =
    trip.driver?.gender === 'man'
      ? trustCopy.driverGenderOptions.man
      : trip.driver?.gender === 'woman'
        ? trustCopy.driverGenderOptions.woman
        : null;
  const passengerPreferenceBlocksCurrentUser =
    passengerPreference !== 'any' &&
    !doesPassengerGenderMatchPreference(currentUserGender, passengerPreference);
  const canBook =
    !isDriver &&
    isScheduled &&
    !hasBooked &&
    !isPast &&
    !passengerPreferenceBlocksCurrentUser;
  const canViewTripUpdates =
    !hasCancelled && (communicationAccess.canView || isDriver || hasBooked);
  const isCommunicationRestricted = communicationAccess.isRestricted && canViewTripUpdates;
  const canSendTripMessages =
    canViewTripUpdates &&
    isActiveTrip &&
    !isCommunicationRestricted &&
    (isDriver || hasBooked);
  const showPassengerPreferenceGate =
    !isDriver &&
    !hasBooked &&
    !isPast &&
    isScheduled &&
    passengerPreferenceBlocksCurrentUser;
  const priceLabel = formatPerSeatPrice(trip.price_cents, t, copy.perSeatSuffix);
  const priceValueLabel = formatPriceLabel(trip.price_cents, t);
  const tripRuleKeys = sanitizeTripRulePresetKeys(trip.trip_rule_preset_keys ?? []);
  const vehicleDetails =
    [trip.vehicle_make_model?.trim(), trip.vehicle_color?.trim()].filter(Boolean).join(' · ') || null;
  const driverNote = trip.driver_note?.trim() || null;
  const additionalRideNote = trip.trip_rules_note?.trim() || null;

  // --- Recurring detection (defensive: falls back gracefully for old trips) --
  const isRecurring = isRecurringTrip({
    trip_mode: trip.trip_mode,
    recurring_days: trip.recurring_days,
    recurring_departure_time: trip.recurring_departure_time,
  });
  const recurringSummary = isRecurring
    ? formatRecurringSummary(trip.recurring_days, trip.recurring_departure_time, lang)
    : null;
  const recurringCopy = RECURRING_COPY[lang] ?? RECURRING_COPY.en;
  const bookingAcksComplete =
    bookingAcks.tripRules && bookingAcks.platformRole && bookingAcks.supportPath;
  const canCancelTrip = canDisplayDriverCancelAction({
    trip: {
      status: trip.status,
      seats_available: trip.seats_available,
      departure_time: trip.departure_time,
    },
    isDriver,
  });

  const statusConfig = {
    scheduled: { label: isPast ? copy.departed : t('scheduled'), color: 'bg-sky-500' },
    full: { label: t('full'), color: 'bg-amber-500' },
    in_progress: { label: t('in_progress'), color: 'bg-indigo-500' },
    completed: { label: t('completed'), color: 'bg-emerald-500' },
    cancelled: { label: t('cancelled'), color: 'bg-red-500' },
    draft: { label: t('draft'), color: 'bg-slate-500' },
  }[effectiveStatus];

  const resetBookingAcks = () => {
    setBookingAcks({
      tripRules: false,
      platformRole: false,
      supportPath: false,
    });
  };

  const handleBook = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const result = await bookSeat(trip.id, 1, bookingAcks);
      setTrip((prev) => ({
        ...prev,
        seats_available: result.seats_available,
        status: result.status,
      }));
      setBookings((prev) => upsertBooking(prev, result.booking));
      setShouldWatchBookings(true);

      setShowBookConfirm(false);
      resetBookingAcks();
      setNotice(copy.bookingReservedNotice);
    } catch (bookingError) {
      setError(
        localizeTripActionError(
          bookingError instanceof Error ? bookingError.message : copy.errors.genericBooking,
          lang
        )
      );
    }

    setLoading(false);
  };

  const handleCancelBooking = async () => {
    if (!myBooking) return;

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const result = await cancelBookingAction(myBooking.id);

      setTrip((prev) => ({
        ...prev,
        seats_available: Math.min(prev.seats_total, prev.seats_available + result.seats),
        status: result.status,
      }));
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === result.bookingId
            ? {
                ...booking,
                status: 'cancelled',
                cancelled_at: result.cancelledAt,
                cancelled_by: result.cancelledBy,
              }
            : booking
        )
      );
      setNotice(copy.bookingCancelledNotice);
    } catch (cancelError) {
      setError(
        localizeTripActionError(
          cancelError instanceof Error ? cancelError.message : copy.errors.genericCancel,
          lang
        )
      );
    }

    setLoading(false);
  };

  const handleTripStatus = async (status: 'in_progress' | 'completed' | 'cancelled') => {
    setStatusLoading(true);
    setError(null);
    setNotice(null);

    try {
      const updatedTrip = await updateTripStatusAction(trip.id, status);
      setTrip((prev) => ({
        ...prev,
        ...updatedTrip,
      }));
      setShowCancelTripConfirm(false);
      setNotice(
        status === 'in_progress'
          ? copy.startTripNotice
          : status === 'completed'
            ? copy.completedTripNotice
            : copy.cancelledTripNotice
      );
    } catch (statusError) {
      setError(
        localizeTripActionError(
          statusError instanceof Error ? statusError.message : copy.errors.genericUpdate,
          lang
        )
      );
    }

    setStatusLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className={`px-5 pt-5 pb-4 ${
          isCancelled
            ? 'bg-red-50 dark:bg-red-900/10'
            : isCompleted
              ? 'bg-emerald-50 dark:bg-emerald-900/10'
              : 'bg-gradient-to-br from-sky-50 to-white dark:from-sky-900/20 dark:to-slate-900'
        }`}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <CommunityBadge name={trip.community_name} type={trip.community_type} />
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-2xl font-black tabular-nums ${isSoon ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}
                  dir="ltr"
                >
                  {time}
                </span>
                <span className={`text-sm font-semibold ${
                  isSoon
                    ? 'text-amber-500'
                    : isPast
                      ? 'text-slate-400'
                      : 'text-sky-600 dark:text-sky-400'
                }`}>
                  {date}
                </span>
              </div>
              {isSoon && (
                <p className="mt-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  {copy.departingSoon}
                </p>
              )}
              {/* Recurring badge — shown below time/date, only when trip is recurring */}
              {isRecurring && (
                <div className="mt-2 inline-flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/50 px-3 py-1 text-xs font-bold text-violet-700 dark:text-violet-300">
                    ↻ {recurringCopy.badge}
                  </span>
                  {recurringSummary && (
                    <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
                      {recurringSummary}
                    </span>
                  )}
                </div>
              )}
              {trip.community_type === 'public' && (
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-2">
                  {copy.publicTrustNote}
                </p>
              )}
            </div>
            <span className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <div className="w-px h-5 bg-slate-300 dark:bg-slate-600" />
              <div className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500" />
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                  {copy.from}
                </p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug" dir="auto">
                  {trip.origin_name}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                  {copy.to}
                </p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug" dir="auto">
                  {trip.destination_name}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {trip.driver?.avatar_url ? (
              <Image
                src={trip.driver.avatar_url}
                alt={copy.driver}
                width={44}
                height={44}
                className="w-11 h-11 rounded-full border-2 border-slate-100 dark:border-slate-700 object-cover shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-sky-100 dark:bg-sky-900/30 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center text-sm font-bold text-sky-600 dark:text-sky-400 shrink-0">
                {(trip.driver?.display_name?.[0] ?? copy.driver[0] ?? 'D').toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {copy.driver}
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate" dir="auto">
                {trip.driver?.display_name ?? copy.communityMember}
              </p>
            </div>
          </div>
          <DriverTrustSummary
            ratingAvg={trip.driver?.rating_avg}
            ratingCount={trip.driver?.rating_count}
            completedDrives={trip.driver_completed_drives ?? 0}
            variant="full"
          />
        </div>

        {!isDriver && (
          <div className="px-5 pb-4 -mt-2">
            <button
              onClick={() => setShowReportModal(true)}
              data-testid="report-driver-button"
              className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors"
            >
              {copy.reportDriver}
            </button>
          </div>
        )}

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t('seats_available')}</p>
            <p className={`text-xl font-black ${
              isFull
                ? 'text-red-500 dark:text-red-400'
                : trip.seats_available <= 2
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-sky-600 dark:text-sky-400'
            }`}>
              {isFull ? t('full') : formatSeatAvailability(trip.seats_available, t)}
            </p>
          </div>
          {trip.price_cents != null && (
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                {copy.pricePerSeat}
              </p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400" dir="ltr">
                {priceValueLabel}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              {trustCopy.rideDetails}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {trustCopy.rideDetailsDesc}
            </p>
          </div>

          {driverGenderLabel && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {trustCopy.driverGender}
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {driverGenderLabel}
              </p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              {trustCopy.passengerPreference}
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {passengerPreferenceLabel}
            </p>
          </div>

          {vehicleDetails && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {trustCopy.vehicle}
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100" dir="auto">
                {vehicleDetails}
              </p>
            </div>
          )}

          {/* Recurring schedule row — only shown for recurring trips */}
          {isRecurring && recurringSummary && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {recurringCopy.schedule}
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 px-3 py-1.5 text-sm font-semibold text-violet-700 dark:text-violet-300">
                ↻ {recurringSummary}
              </span>
            </div>
          )}

          {driverNote && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {trustCopy.driverNote}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed" dir="auto">
                {driverNote}
              </p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              {trustCopy.tripRules}
            </p>
            {tripRuleKeys.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tripRuleKeys.map((ruleKey) => (
                  <span
                    key={ruleKey}
                    className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    {trustCopy.ruleOptions[ruleKey]}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {trustCopy.noSpecialRules}
              </p>
            )}
          </div>

          {additionalRideNote && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {trustCopy.additionalNote}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed" dir="auto">
                {additionalRideNote}
              </p>
            </div>
          )}
      </div>

      {showPassengerPreferenceGate && (
        <div
          data-testid="passenger-preference-blocked"
          className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-2"
        >
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            {trustCopy.bookingPreferenceGateTitle}
          </p>
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            {trustCopy.bookingPreferenceGateDesc(passengerPreferenceLabel)}
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {trustCopy.howCoordinationWorks}
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {trustCopy.coordinationDescription}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {trustCopy.supportDescription}
        </p>
        {trip.price_cents != null && (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {trustCopy.pricingDescription}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          {copy.whatSignalsMean}
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {copy.signalsDescription}
        </p>
      </div>

      {notice && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{notice}</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 p-4">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {isCommunicationRestricted && canViewTripUpdates && isActiveTrip && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            {copy.communicationLimitedTitle}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            {copy.communicationLimitedDescription}
          </p>
        </div>
      )}

      {!isDriver && hasBooked && (
        <div
          data-testid="existing-booking-card"
          className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 space-y-2"
        >
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300 uppercase tracking-widest">
            {copy.availableNow}
          </p>
          <p className="text-base font-bold text-emerald-900 dark:text-emerald-100">
            {copy.bookedStateTitle}
          </p>
          <p className="text-sm text-emerald-800/90 dark:text-emerald-200 leading-relaxed">
            {copy.bookedStateDescription}
          </p>
        </div>
      )}

      {canBook && (
        !showBookConfirm ? (
          <div className="rounded-2xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mb-1">
                  {copy.availableNow}
                </p>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('book_seat')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {copy.reserveSeatDescription(priceLabel)}
                </p>
              </div>
              <div className="shrink-0 rounded-full bg-sky-100 dark:bg-sky-900/40 px-3 py-1 text-xs font-bold text-sky-700 dark:text-sky-300">
                {formatSeatAvailability(trip.seats_available, t)}
              </div>
            </div>
            {trip.community_type === 'public' && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-3">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  {copy.publicBookingTitle}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  {copy.publicBookingDescription}
                </p>
                <Link
                  href="/profile"
                  className="inline-flex mt-2 text-xs font-medium text-amber-800 dark:text-amber-200 underline underline-offset-2"
                >
                  {copy.updateProfile}
                </Link>
              </div>
            )}
            <button
              onClick={() => {
                resetBookingAcks();
                setShowBookConfirm(true);
              }}
              data-testid="start-booking-button"
              className="w-full rounded-2xl bg-sky-600 dark:bg-sky-500 px-4 py-4 text-base font-bold text-white hover:bg-sky-700 dark:hover:bg-sky-600 transition-colors btn-press shadow-md"
            >
              {t('book_seat')}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/30 p-5 space-y-4">
            <div>
              <p className="text-sm font-bold text-sky-900 dark:text-sky-100 mb-1">{t('confirm_booking_title')}</p>
              <p className="text-xs text-sky-700 dark:text-sky-300 leading-relaxed">
                <span dir="auto">{formatRouteLabel(trip.origin_name, trip.destination_name)}</span>
                {priceLabel ? ` | ${priceLabel}` : ''}
              </p>
            </div>
            {(driverGenderLabel ||
              passengerPreference !== 'any' ||
              vehicleDetails ||
              driverNote ||
              tripRuleKeys.length > 0 ||
              additionalRideNote) && (
              <div className="rounded-2xl border border-sky-100 dark:border-sky-800/70 bg-white/80 dark:bg-slate-900/70 p-4 space-y-3">
                {driverGenderLabel && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {trustCopy.driverGender}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {driverGenderLabel}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {trustCopy.passengerPreference}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {passengerPreferenceLabel}
                  </p>
                </div>

                {vehicleDetails && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {trustCopy.vehicle}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100" dir="auto">
                      {vehicleDetails}
                    </p>
                  </div>
                )}

                {driverNote && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {trustCopy.driverNote}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed" dir="auto">
                      {driverNote}
                    </p>
                  </div>
                )}

                {tripRuleKeys.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {trustCopy.tripRules}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tripRuleKeys.map((ruleKey) => (
                        <span
                          key={ruleKey}
                          className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200"
                        >
                          {trustCopy.ruleOptions[ruleKey]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {additionalRideNote && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {trustCopy.additionalNote}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed" dir="auto">
                      {additionalRideNote}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="rounded-2xl border border-sky-100 dark:border-sky-800/70 bg-white/80 dark:bg-slate-900/70 p-4 space-y-3">
              <div>
                <p className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mb-1">
                  {trustCopy.bookingChecklist}
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {trustCopy.bookingChecklistDesc}
                </p>
              </div>

              <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                <input
                  id="ack-trip-rules"
                  type="checkbox"
                  checked={bookingAcks.tripRules}
                  onChange={(event) =>
                    setBookingAcks((prev) => ({
                      ...prev,
                      tripRules: event.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800"
                />
                <span>{trustCopy.ackTripRules}</span>
              </label>

              <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                <input
                  id="ack-platform-role"
                  type="checkbox"
                  checked={bookingAcks.platformRole}
                  onChange={(event) =>
                    setBookingAcks((prev) => ({
                      ...prev,
                      platformRole: event.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800"
                />
                <span>{trustCopy.ackPlatformRole}</span>
              </label>

              <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                <input
                  id="ack-support-path"
                  type="checkbox"
                  checked={bookingAcks.supportPath}
                  onChange={(event) =>
                    setBookingAcks((prev) => ({
                      ...prev,
                      supportPath: event.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800"
                />
                <span>{trustCopy.ackSupportPath}</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBook}
                disabled={loading || !bookingAcksComplete}
                data-testid="confirm-booking-button"
                className="flex-1 rounded-xl bg-sky-600 dark:bg-sky-500 px-4 py-3 font-bold text-white hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t('booking') : copy.confirmBooking}
              </button>
              <button
                onClick={() => {
                  resetBookingAcks();
                  setShowBookConfirm(false);
                }}
                className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )
      )}

      <TripCoordinationPanel
        tripId={trip.id}
        isDriver={isDriver}
        hasBooked={hasBooked}
        tripStatus={effectiveStatus}
        tripSeatsAvailable={trip.seats_available}
        tripDepartureTime={trip.departure_time}
        isMessageRestricted={isCommunicationRestricted}
        onCancelBooking={handleCancelBooking}
        cancelLoading={loading}
      />

      {canViewTripUpdates && (
        <Link
          href={`/trips/${trip.id}/chat`}
          data-testid="open-trip-chat-link"
          className="block rounded-3xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 p-4 shadow-sm card-hover transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:ring-sky-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 10h10" />
                <path d="M7 14h6" />
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-300">
                {canSendTripMessages ? surfaceCopy.communicationReady : surfaceCopy.communicationReadOnly}
              </p>
              <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
                {canSendTripMessages ? copy.openTripCommunication : copy.openTripUpdates}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {canSendTripMessages
                  ? surfaceCopy.communicationReadyDesc
                  : isCommunicationRestricted
                    ? surfaceCopy.communicationRestrictedDesc
                    : surfaceCopy.communicationReadOnlyDesc}
              </p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-400 rtl:rotate-180">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Link>
      )}

      {isCancelled && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-4 text-center space-y-2">
          <p className="text-sm font-bold text-red-700 dark:text-red-400">{copy.tripCancelledTitle}</p>
          <p className="text-xs text-red-600 dark:text-red-300" dir="auto">
            {copy.tripCancelledDescription(
              trip.driver?.display_name || copy.reportDriverFallback,
              trip.cancelled_at ? formatLocalizedDateTime(lang, trip.cancelled_at) : null
            )}
          </p>
        </div>
      )}

      {hasCancelled && !isCancelled && (
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 text-center space-y-2">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{copy.seatCancelledTitle}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {copy.seatCancelledDescription(
              myCancelledBooking?.cancelled_at
                ? formatLocalizedDateTime(lang, myCancelledBooking.cancelled_at)
                : null
            )}
          </p>
        </div>
      )}

      {isCompleted && !isDriver && hasBooked && (
        <Link
          href={`/trips/${trip.id}/rate`}
          className="block w-full rounded-2xl bg-amber-500 dark:bg-amber-600 px-4 py-4 text-center text-base font-bold text-white hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors btn-press shadow-md"
        >
          {t('rate_trip')} {'>'}
        </Link>
      )}

      {isDriver && isActiveTrip && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('driver_controls')}</p>

          {(isScheduled || isFull) && (
            <button
              onClick={() => handleTripStatus('in_progress')}
              disabled={statusLoading || !canStartTrip(currentUserId, trip).allowed}
              className="w-full rounded-2xl bg-indigo-600 dark:bg-indigo-500 px-4 py-4 text-base font-bold text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors btn-press"
            >
              {statusLoading ? t('loading') : copy.startTrip}
            </button>
          )}

          {isInProgress && (
            <button
              onClick={() => handleTripStatus('completed')}
              disabled={statusLoading || !canCompleteTrip(currentUserId, trip).allowed}
              className="w-full rounded-2xl bg-emerald-600 dark:bg-emerald-500 px-4 py-4 text-base font-bold text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 transition-colors btn-press"
            >
              {statusLoading ? t('loading') : t('complete_trip')}
            </button>
          )}

          {canCancelTrip && (
            !showCancelTripConfirm ? (
              <button
                onClick={() => setShowCancelTripConfirm(true)}
                disabled={statusLoading}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 disabled:opacity-50 transition-colors"
              >
                {t('cancel_trip')}
              </button>
            ) : (
              <div className="rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 space-y-3">
                <p className="text-sm font-bold text-red-800 dark:text-red-300">
                  {copy.cancelTripPromptTitle}
                </p>
                <p className="text-xs text-red-700 dark:text-red-400">
                  {copy.cancelTripPromptDescription}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTripStatus('cancelled')}
                    disabled={statusLoading}
                    className="flex-1 rounded-xl bg-red-600 dark:bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {statusLoading ? t('loading') : copy.confirmCancelTrip}
                  </button>
                  <button
                    onClick={() => setShowCancelTripConfirm(false)}
                    className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {copy.keepTrip}
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {(isDriver || hasBooked) && (bookings.length > 0 || isDriver) && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {t('passengers')} | {confirmedBookings.length}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {surfaceCopy.passengerListHint}
            </p>
          </div>

          {bookings.length === 0 ? (
            <EmptyStateCard
              title={surfaceCopy.rosterEmptyTitle}
              description={surfaceCopy.rosterEmptyDesc}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              className="border-dashed bg-slate-50/70 dark:bg-slate-950/30"
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {bookings.map((booking) => {
                const isPassengerCancelled = booking.status === 'cancelled';
                const passengerName = booking.passenger?.display_name ?? copy.communityMember;
                return (
                  <div key={booking.id} className={`flex items-center justify-between py-3 first:pt-0 last:pb-0 ${isPassengerCancelled ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-3">
                      {booking.passenger?.avatar_url ? (
                        <Image
                          src={booking.passenger.avatar_url}
                          alt={passengerName}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                        />
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isPassengerCancelled
                            ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                            : 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300'
                        }`}>
                          {getParticipantInitial(booking.passenger?.display_name, copy.passengerInitial)}
                        </div>
                      )}
                      <div>
                        <span
                          className={`text-sm font-medium ${isPassengerCancelled ? 'line-through text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}
                          dir="auto"
                        >
                          {passengerName}
                        </span>
                        {isPassengerCancelled && (
                          <span className="ml-2 text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                            {t('cancelled')}
                          </span>
                        )}
                        {isPassengerCancelled && booking.cancelled_at && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                            {formatLocalizedDateTime(lang, booking.cancelled_at)}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {formatSeatCount(booking.seats, t)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showReportModal && (
        <ReportUserModal
          isOpen={true}
          onClose={() => setShowReportModal(false)}
          tripId={trip.id}
          reportedUserId={trip.driver_id}
          reportedUserName={trip.driver?.display_name || copy.reportDriverFallback}
        />
      )}
    </div>
  );
}
