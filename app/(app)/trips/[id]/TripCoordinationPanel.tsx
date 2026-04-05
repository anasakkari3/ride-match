'use client';

import { useState } from 'react';
import { sendCoordinationAction } from './actions';
import {
  canDisplayPassengerCancelAction,
  getAvailableCoordinationActions,
  type CoordinationActionKey,
} from '@/lib/trips/coordination';
import type { TripsRow } from '@/lib/types';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

type Props = {
  tripId: string;
  isDriver: boolean;
  hasBooked: boolean;
  tripStatus: TripsRow['status'];
  tripSeatsAvailable: number;
  tripDepartureTime: string;
  isMessageRestricted: boolean;
  onCancelBooking: () => void;
  cancelLoading: boolean;
};

type CoordinationButtonConfig = {
  action: CoordinationActionKey;
  label: string;
  description: string;
};

const COPY = {
  en: {
    passengerActions: [
      { action: 'PASSENGER_HERE', label: "I'm here", description: 'Signal that you are at the pickup point.' },
      { action: 'PASSENGER_LATE', label: 'Running late', description: 'Signal that you are delayed and still coming.' },
    ],
    driverActions: [
      { action: 'DRIVER_CONFIRMED', label: 'Trip confirmed', description: 'Confirm to passengers that this trip is still proceeding.' },
    ],
    titleDriver: 'Trip updates',
    titlePassenger: 'Pickup updates',
    restricted: 'Use structured updates for this shared trip. Direct messages are limited, but these trip updates still go through.',
    open: 'Use structured updates for time-sensitive coordination. Free-form chat is still available for anything else.',
    send: 'Send',
    sending: 'Sending...',
    feedbackError: 'Could not send that update right now.',
    feedbackSuccess: 'Trip update sent. It now appears in trip communication.',
    cancelSeat: 'Cancel ride',
    cancelSeatQuestion: 'Cancel your seat?',
    cancelSeatDesc: 'The trip will remain visible, and everyone will see that you cancelled.',
    confirmCancel: 'Yes, cancel ride',
    keepRide: 'Keep ride',
    cancelling: 'Cancelling...',
  },
  ar: {
    passengerActions: [
      { action: 'PASSENGER_HERE', label: 'أنا عند نقطة الالتقاء', description: 'أرسل تحديثًا بأنك وصلت إلى نقطة الالتقاء.' },
      { action: 'PASSENGER_LATE', label: 'سأتأخر قليلًا', description: 'أرسل تحديثًا بأنك متأخر لكنك ما زلت قادمًا.' },
    ],
    driverActions: [
      { action: 'DRIVER_CONFIRMED', label: 'تم تأكيد الرحلة', description: 'أكّد للركاب أن الرحلة ما زالت قائمة.' },
    ],
    titleDriver: 'تحديثات الرحلة',
    titlePassenger: 'تحديثات الالتقاء',
    restricted: 'استخدم التحديثات المهيكلة لهذه الرحلة المشتركة. الرسائل المباشرة محدودة، لكن هذه التحديثات ما تزال تصل.',
    open: 'استخدم التحديثات المهيكلة للتنسيق السريع. ما زالت الدردشة الحرة متاحة لأي شيء آخر.',
    send: 'إرسال',
    sending: 'جارٍ الإرسال...',
    feedbackError: 'تعذر إرسال هذا التحديث الآن.',
    feedbackSuccess: 'تم إرسال تحديث الرحلة، وهو ظاهر الآن داخل تواصل الرحلة.',
    cancelSeat: 'إلغاء الرحلة',
    cancelSeatQuestion: 'إلغاء مقعدك؟',
    cancelSeatDesc: 'ستبقى الرحلة ظاهرة، وسيرى الجميع أنك ألغيت الحجز.',
    confirmCancel: 'نعم، ألغِ الرحلة',
    keepRide: 'الاحتفاظ بالحجز',
    cancelling: 'جارٍ الإلغاء...',
  },
  he: {
    passengerActions: [
      { action: 'PASSENGER_HERE', label: 'הגעתי לנקודת האיסוף', description: 'שלחו עדכון שהגעתם לנקודת האיסוף.' },
      { action: 'PASSENGER_LATE', label: 'אני מתעכב', description: 'שלחו עדכון שאתם מתעכבים אבל עדיין בדרך.' },
    ],
    driverActions: [
      { action: 'DRIVER_CONFIRMED', label: 'הנסיעה אושרה', description: 'אשרו לנוסעים שהנסיעה עדיין מתקיימת.' },
    ],
    titleDriver: 'עדכוני נסיעה',
    titlePassenger: 'עדכוני איסוף',
    restricted: 'השתמשו בעדכונים מובנים לנסיעה המשותפת הזאת. הודעות ישירות מוגבלות, אבל העדכונים האלה עדיין נשלחים.',
    open: 'השתמשו בעדכונים מובנים לתיאום רגיש לזמן. צ׳אט חופשי עדיין זמין לכל דבר אחר.',
    send: 'שליחה',
    sending: 'שולח...',
    feedbackError: 'לא הצלחנו לשלוח את העדכון הזה כרגע.',
    feedbackSuccess: 'עדכון הנסיעה נשלח והוא מופיע עכשיו בתקשורת הנסיעה.',
    cancelSeat: 'בטלו את הנסיעה',
    cancelSeatQuestion: 'לבטל את המושב שלכם?',
    cancelSeatDesc: 'הנסיעה תישאר גלויה, וכולם יראו שביטלתם.',
    confirmCancel: 'כן, בטלו את הנסיעה',
    keepRide: 'להשאיר את ההזמנה',
    cancelling: 'מבטל...',
  },
} as const;

export default function TripCoordinationPanel({
  tripId,
  isDriver,
  hasBooked,
  tripStatus,
  tripSeatsAvailable,
  tripDepartureTime,
  isMessageRestricted,
  onCancelBooking,
  cancelLoading,
}: Props) {
  const { lang } = useTranslation();
  const copy = COPY[lang];
  const [loadingAction, setLoadingAction] = useState<CoordinationActionKey | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const coordinationTrip = {
    status: tripStatus,
    seats_available: tripSeatsAvailable,
    departure_time: tripDepartureTime,
  };
  const availableActionKeys = getAvailableCoordinationActions({
    trip: coordinationTrip,
    isDriver,
    hasConfirmedBooking: hasBooked,
  });
  const actions = (isDriver ? copy.driverActions : copy.passengerActions).filter((config) =>
    availableActionKeys.includes(config.action)
  ) as CoordinationButtonConfig[];
  const canCancelSeat = canDisplayPassengerCancelAction({
    trip: coordinationTrip,
    hasConfirmedBooking: hasBooked,
  });

  if (!isDriver && !hasBooked) return null;
  if (actions.length === 0 && !canCancelSeat) return null;

  const handleSend = async (action: CoordinationActionKey) => {
    setLoadingAction(action);
    setFeedback(null);

    try {
      const result = await sendCoordinationAction(tripId, action);
      if (!result.ok) {
        setFeedback(copy.feedbackError);
      } else {
        setFeedback(copy.feedbackSuccess);
      }
    } catch {
      setFeedback(copy.feedbackError);
    }

    setLoadingAction(null);
  };

  return (
    <section aria-label={isDriver ? copy.titleDriver : copy.titlePassenger} className="space-y-3">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          {isDriver ? copy.titleDriver : copy.titlePassenger}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {isMessageRestricted ? copy.restricted : copy.open}
        </p>
      </div>

      {actions.length > 0 && (
        <div className="grid gap-2">
          {actions.map((config) => (
            <button
              key={config.action}
              type="button"
              onClick={() => handleSend(config.action)}
              disabled={loadingAction === config.action}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-60"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {config.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {config.description}
                  </p>
                </div>
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                  {loadingAction === config.action ? copy.sending : copy.send}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!isDriver && canCancelSeat && (
        showCancelConfirm ? (
          <div className="rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 space-y-3">
            <p className="text-sm font-bold text-red-800 dark:text-red-300">{copy.cancelSeatQuestion}</p>
            <p className="text-xs text-red-700 dark:text-red-400">
              {copy.cancelSeatDesc}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancelBooking}
                disabled={cancelLoading}
                data-testid="confirm-cancel-booking-button"
                className="flex-1 rounded-xl bg-red-600 dark:bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {cancelLoading ? copy.cancelling : copy.confirmCancel}
              </button>
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {copy.keepRide}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            data-testid="start-cancel-booking-button"
            className="w-full text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors py-1 text-center"
          >
            {copy.cancelSeat}
          </button>
        )
      )}

      {feedback && (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-2">
          <p className="text-xs text-slate-600 dark:text-slate-300">{feedback}</p>
        </div>
      )}
    </section>
  );
}
