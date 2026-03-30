'use client';

import { useState } from 'react';
import { sendCoordinationAction } from './actions';
import {
  canDisplayPassengerCancelAction,
  getAvailableCoordinationActions,
  type CoordinationActionKey,
} from '@/lib/trips/coordination';
import type { TripsRow } from '@/lib/types';

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

const PASSENGER_ACTIONS: CoordinationButtonConfig[] = [
  {
    action: 'PASSENGER_HERE',
    label: "I'm here",
    description: 'Signal that you are at the pickup point.',
  },
  {
    action: 'PASSENGER_LATE',
    label: 'Running late',
    description: 'Signal that you are delayed and still coming.',
  },
];

const DRIVER_ACTIONS: CoordinationButtonConfig[] = [
  {
    action: 'DRIVER_CONFIRMED',
    label: 'Trip confirmed',
    description: 'Confirm to passengers that this trip is still proceeding.',
  },
];

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
  const actions = (isDriver ? DRIVER_ACTIONS : PASSENGER_ACTIONS).filter((config) =>
    availableActionKeys.includes(config.action)
  );
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
        setFeedback('Could not send that update right now.');
      } else {
        setFeedback('Trip update sent. It now appears in trip communication.');
      }
    } catch {
      setFeedback('Could not send that update right now.');
    }

    setLoadingAction(null);
  };

  return (
    <section aria-label="Coordination actions" className="space-y-3">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          {isDriver ? 'Trip updates' : 'Pickup updates'}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {isMessageRestricted
            ? 'Use structured updates for this shared trip. Direct messages are limited, but these trip updates still go through.'
            : 'Use structured updates for time-sensitive coordination. Free-form chat is still available for anything else.'}
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
                  {loadingAction === config.action ? 'Sending...' : 'Send'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!isDriver && canCancelSeat && (
        showCancelConfirm ? (
          <div className="rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 space-y-3">
            <p className="text-sm font-bold text-red-800 dark:text-red-300">Cancel your seat?</p>
            <p className="text-xs text-red-700 dark:text-red-400">
              The trip will remain visible, and everyone will see that you cancelled.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancelBooking}
                disabled={cancelLoading}
                className="flex-1 rounded-xl bg-red-600 dark:bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {cancelLoading ? 'Cancelling...' : 'Yes, cancel ride'}
              </button>
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Keep ride
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            className="w-full text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors py-1 text-center"
          >
            Cancel ride
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
