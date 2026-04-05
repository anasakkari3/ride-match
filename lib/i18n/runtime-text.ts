import type { NotificationsRow, TripCoordinationAction } from '@/lib/types';
import type { Lang } from './dictionaries';

const SELF_LABEL: Record<Lang, string> = {
  en: 'You',
  ar: 'أنت',
  he: 'אתם',
};

function seatLabel(lang: Lang, count: number) {
  if (lang === 'ar') {
    return count === 1 ? 'مقعد' : 'مقاعد';
  }

  if (lang === 'he') {
    return count === 1 ? 'מושב' : 'מושבים';
  }

  return count === 1 ? 'seat' : 'seats';
}

function actorName(lang: Lang, name: string, isSelf: boolean) {
  return isSelf ? SELF_LABEL[lang] : name;
}

export function getCoordinationActionText(
  action: TripCoordinationAction,
  lang: Lang,
  actor: string,
  isSelf = false
) {
  const subject = actorName(lang, actor, isSelf);

  switch (action) {
    case 'PASSENGER_HERE':
      return {
        en: `${subject} is at the pickup point`,
        ar: `${subject} عند نقطة الالتقاء`,
        he: `${subject} כבר בנקודת האיסוף`,
      }[lang];
    case 'PASSENGER_LATE':
      return {
        en: `${subject} is running late`,
        ar: `${subject} متأخر قليلًا`,
        he: `${subject} מתעכב בדרך`,
      }[lang];
    case 'DRIVER_CONFIRMED':
      return {
        en: `${subject} confirmed the trip`,
        ar: `${subject} أكد استمرار الرحلة`,
        he: `${subject} אישר שהנסיעה מתקיימת`,
      }[lang];
    case 'DRIVER_CANCELED_TRIP':
      return {
        en: `${subject} cancelled the trip`,
        ar: `${subject} ألغى الرحلة`,
        he: `${subject} ביטל את הנסיעה`,
      }[lang];
    case 'PASSENGER_CANCELED_SEAT':
      return {
        en: `${subject} cancelled a seat`,
        ar: `${subject} ألغى مقعده`,
        he: `${subject} ביטל את המושב שלו`,
      }[lang];
    default:
      return '';
  }
}

function localizeLegacyNotification(notification: NotificationsRow, lang: Lang) {
  const title = notification.title;
  const body = notification.body;

  const newBooking = body.match(/^(.+?) booked (\d+) seat\(s\) on your trip\.$/);
  if (title === 'New Booking' && newBooking) {
    const [, name, seatsRaw] = newBooking;
    const seats = Number(seatsRaw);
    return {
      title: {
        en: 'New booking',
        ar: 'حجز جديد',
        he: 'הזמנה חדשה',
      }[lang],
      body: {
        en: `${name} booked ${seats} ${seatLabel(lang, seats)} on your trip.`,
        ar: `${name} حجز ${seats} ${seatLabel(lang, seats)} في رحلتك.`,
        he: `${name} הזמין ${seats} ${seatLabel(lang, seats)} בנסיעה שלך.`,
      }[lang],
    };
  }

  const bookingCancelledPassenger = body.match(/^(.+?) cancelled your booking\.$/);
  if (title === 'Booking Cancelled' && bookingCancelledPassenger) {
    const [, name] = bookingCancelledPassenger;
    return {
      title: {
        en: 'Booking cancelled',
        ar: 'تم إلغاء الحجز',
        he: 'ההזמנה בוטלה',
      }[lang],
      body: {
        en: `${name} cancelled your booking.`,
        ar: `${name} ألغى حجزك.`,
        he: `${name} ביטל את ההזמנה שלך.`,
      }[lang],
    };
  }

  const bookingCancelledDriver = body.match(/^(.+?) cancelled their booking for (\d+) seat\(s\)\.$/);
  if (title === 'Booking Cancelled' && bookingCancelledDriver) {
    const [, name, seatsRaw] = bookingCancelledDriver;
    const seats = Number(seatsRaw);
    return {
      title: {
        en: 'Booking cancelled',
        ar: 'تم إلغاء الحجز',
        he: 'ההזמנה בוטלה',
      }[lang],
      body: {
        en: `${name} cancelled their booking for ${seats} ${seatLabel(lang, seats)}.`,
        ar: `${name} ألغى حجزه لـ ${seats} ${seatLabel(lang, seats)}.`,
        he: `${name} ביטל את ההזמנה שלו עבור ${seats} ${seatLabel(lang, seats)}.`,
      }[lang],
    };
  }

  const newMessage = body.match(/^(.+?):\s([\s\S]+)$/);
  if (title === 'New trip message' && newMessage) {
    const [, name, content] = newMessage;
    return {
      title: {
        en: 'New trip message',
        ar: 'رسالة جديدة في الرحلة',
        he: 'הודעה חדשה בנסיעה',
      }[lang],
      body: {
        en: `${name}: ${content}`,
        ar: `${name}: ${content}`,
        he: `${name}: ${content}`,
      }[lang],
    };
  }

  const tripCancelled = body === 'A trip you booked has been cancelled by the driver.';
  if (title === 'Trip Cancelled' && tripCancelled) {
    return {
      title: {
        en: 'Trip cancelled',
        ar: 'تم إلغاء الرحلة',
        he: 'הנסיעה בוטלה',
      }[lang],
      body: {
        en: 'A trip you booked has been cancelled by the driver.',
        ar: 'رحلة قمت بحجزها أُلغيَت من قبل السائق.',
        he: 'נסיעה שהזמנת בוטלה על ידי הנהג.',
      }[lang],
    };
  }

  const communityApproved = body.match(/^Your request to join (.+?) was approved(?:\. Note: (.+))?\.$/);
  if (title === 'Community request approved' && communityApproved) {
    const [, communityName, note] = communityApproved;
    return {
      title: {
        en: 'Community request approved',
        ar: 'تمت الموافقة على طلب المجتمع',
        he: 'בקשת הקהילה אושרה',
      }[lang],
      body: {
        en: note
          ? `Your request to join ${communityName} was approved. Note: ${note}`
          : `Your request to join ${communityName} was approved.`,
        ar: note
          ? `تمت الموافقة على طلبك للانضمام إلى ${communityName}. ملاحظة: ${note}`
          : `تمت الموافقة على طلبك للانضمام إلى ${communityName}.`,
        he: note
          ? `הבקשה שלך להצטרף אל ${communityName} אושרה. הערה: ${note}`
          : `הבקשה שלך להצטרף אל ${communityName} אושרה.`,
      }[lang],
    };
  }

  const communityDeclined = body.match(/^Your request to join (.+?) was declined(?:\. Note: (.+))?\.$/);
  if (title === 'Community request declined' && communityDeclined) {
    const [, communityName, note] = communityDeclined;
    return {
      title: {
        en: 'Community request declined',
        ar: 'تم رفض طلب المجتمع',
        he: 'בקשת הקהילה נדחתה',
      }[lang],
      body: {
        en: note
          ? `Your request to join ${communityName} was declined. Note: ${note}`
          : `Your request to join ${communityName} was declined.`,
        ar: note
          ? `تم رفض طلبك للانضمام إلى ${communityName}. ملاحظة: ${note}`
          : `تم رفض طلبك للانضمام إلى ${communityName}.`,
        he: note
          ? `הבקשה שלך להצטרף אל ${communityName} נדחתה. הערה: ${note}`
          : `הבקשה שלך להצטרף אל ${communityName} נדחתה.`,
      }[lang],
    };
  }

  const reportUpdate = body.match(/^Your report about (.+?) was (reviewed|resolved)(?:\. Note: (.+))?\.$/);
  if ((title === 'Report reviewed' || title === 'Report resolved') && reportUpdate) {
    const [, targetName, status, note] = reportUpdate;
    const statusText =
      lang === 'ar'
        ? status === 'resolved'
          ? 'تمت معالجته'
          : 'تمت مراجعته'
        : lang === 'he'
          ? status === 'resolved'
            ? 'טופל'
            : 'נבדק'
          : status;

    return {
      title: {
        en: status === 'resolved' ? 'Report resolved' : 'Report reviewed',
        ar: status === 'resolved' ? 'تمت معالجة البلاغ' : 'تمت مراجعة البلاغ',
        he: status === 'resolved' ? 'הדיווח טופל' : 'הדיווח נבדק',
      }[lang],
      body: {
        en: note
          ? `Your report about ${targetName} was ${status}. Note: ${note}`
          : `Your report about ${targetName} was ${status}.`,
        ar: note
          ? `تم ${statusText} البلاغ الذي قدمته عن ${targetName}. ملاحظة: ${note}`
          : `تم ${statusText} البلاغ الذي قدمته عن ${targetName}.`,
        he: note
          ? `הדיווח שלך על ${targetName} ${statusText}. הערה: ${note}`
          : `הדיווח שלך על ${targetName} ${statusText}.`,
      }[lang],
    };
  }

  const coordinationByTitle: Record<string, TripCoordinationAction> = {
    'Passenger arrived': 'PASSENGER_HERE',
    'Passenger running late': 'PASSENGER_LATE',
    'Trip confirmed': 'DRIVER_CONFIRMED',
  };
  const coordinationAction = coordinationByTitle[title];
  if (coordinationAction) {
    const name = body.replace(/ is at the pickup point| is running late| confirmed the trip is still on/, '');
    return {
      title: {
        en:
          coordinationAction === 'PASSENGER_HERE'
            ? 'Passenger arrived'
            : coordinationAction === 'PASSENGER_LATE'
              ? 'Passenger running late'
              : 'Trip confirmed',
        ar:
          coordinationAction === 'PASSENGER_HERE'
            ? 'وصول الراكب'
            : coordinationAction === 'PASSENGER_LATE'
              ? 'الراكب متأخر'
              : 'تم تأكيد الرحلة',
        he:
          coordinationAction === 'PASSENGER_HERE'
            ? 'הנוסע הגיע'
            : coordinationAction === 'PASSENGER_LATE'
              ? 'הנוסע מתעכב'
              : 'הנסיעה אושרה',
      }[lang],
      body: getCoordinationActionText(coordinationAction, lang, name, false),
    };
  }

  return {
    title,
    body,
  };
}

export function getLocalizedNotificationContent(
  notification: NotificationsRow,
  lang: Lang
) {
  return localizeLegacyNotification(notification, lang);
}
