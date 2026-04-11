import type { Lang } from '@/lib/i18n/dictionaries';

export type DetailCopy = {
  tripLiveNotice: string;
  departed: string;
  departingSoon: string;
  publicTrustNote: string;
  from: string;
  to: string;
  driver: string;
  communityMember: string;
  reportDriver: string;
  pricePerSeat: string;
  whatSignalsMean: string;
  signalsDescription: string;
  communicationLimitedTitle: string;
  communicationLimitedDescription: string;
  availableNow: string;
  reserveSeatDescription: (priceLabel: string | null) => string;
  publicBookingTitle: string;
  publicBookingDescription: string;
  updateProfile: string;
  confirmBooking: string;
  bookedStateTitle: string;
  bookedStateDescription: string;
  openTripCommunication: string;
  openTripUpdates: string;
  tripCancelledTitle: string;
  tripCancelledDescription: (driverName: string, date: string | null) => string;
  seatCancelledTitle: string;
  seatCancelledDescription: (date: string | null) => string;
  startTrip: string;
  cancelTripPromptTitle: string;
  cancelTripPromptDescription: string;
  confirmCancelTrip: string;
  keepTrip: string;
  passengerInitial: string;
  reportDriverFallback: string;
  startTripNotice: string;
  completedTripNotice: string;
  cancelledTripNotice: string;
  bookingReservedNotice: string;
  bookingCancelledNotice: string;
  perSeatSuffix: string;
  errors: {
    unauthorized: string;
    tripNotFound: string;
    bookingNotFound: string;
    bookingRejected: string;
    alreadyBooked: string;
    cannotBookBlockedUser: string;
    womenOnly: string;
    menOnly: string;
    alreadyDeparted: string;
    wholeSeatRequired: string;
    singleSeatOnly: string;
    notEnoughSeats: string;
    bookingAlreadyCancelled: string;
    basicProfileRequired: string;
    tripUpdateNotAllowed: string;
    invalidTripTransition: string;
    startTooEarly: string;
    completeRequiresInProgress: string;
    genericBooking: string;
    genericCancel: string;
    genericUpdate: string;
  };
};

export const DETAIL_COPY: Record<Lang, DetailCopy> = {
  en: {
    tripLiveNotice: 'Your trip is live and visible to your community.',
    departed: 'Departed',
    departingSoon: 'Departing soon',
    publicTrustNote:
      'Public community: anyone can join, so trust is lower here than in verified communities.',
    from: 'From',
    to: 'To',
    driver: 'Driver',
    communityMember: 'Community member',
    reportDriver: 'Report this driver',
    pricePerSeat: 'Price per seat',
    whatSignalsMean: 'What these signals mean',
    signalsDescription:
      'Received rating shows the feedback this person has received from other trip participants across completed trips. Completed drives count finished trips this person has driven. Profile setup is shown separately and does not change either number.',
    communicationLimitedTitle: 'Trip communication is limited',
    communicationLimitedDescription:
      'A block setting disables direct messages on this shared trip. Structured trip updates, cancellations, and trip status still remain visible.',
    availableNow: 'Available now',
    reserveSeatDescription: (priceLabel) =>
      `Reserve 1 seat now${priceLabel ? ` for ${priceLabel}` : ''}. The trip will then appear in your trip communication inbox.`,
    publicBookingTitle: 'Public community booking',
    publicBookingDescription:
      'Booking here requires a basic profile with display name, phone, city or area, and age.',
    updateProfile: 'Update profile',
    confirmBooking: 'Confirm booking',
    bookedStateTitle: 'Seat booked',
    bookedStateDescription:
      'You already hold one seat on this trip. You can coordinate below or cancel the booking if your plans change.',
    openTripCommunication: 'Open trip communication',
    openTripUpdates: 'Open trip updates',
    tripCancelledTitle: 'Trip cancelled',
    tripCancelledDescription: (driverName, date) =>
      `${driverName} cancelled this ride${date ? ` on ${date}` : ''}.`,
    seatCancelledTitle: 'Seat cancelled',
    seatCancelledDescription: (date) =>
      `You released your seat${date ? ` on ${date}` : ''}.`,
    startTrip: 'Start trip',
    cancelTripPromptTitle: 'Cancel this trip?',
    cancelTripPromptDescription: 'Everyone will see that this trip was cancelled.',
    confirmCancelTrip: 'Yes, cancel trip',
    keepTrip: 'Keep trip',
    passengerInitial: 'P',
    reportDriverFallback: 'Driver',
    startTripNotice: 'Trip started. Trip communication remains available while the trip is active.',
    completedTripNotice: 'Trip marked as completed.',
    cancelledTripNotice: 'Trip cancelled. Participants can still see the cancellation here.',
    bookingReservedNotice: 'Seat reserved. The trip now appears in your trip communication inbox.',
    bookingCancelledNotice: 'Ride cancelled. Your released seat is now visible on this trip.',
    perSeatSuffix: 'per seat',
    errors: {
      unauthorized: 'You do not have permission to perform this action.',
      tripNotFound: 'Trip not found.',
      bookingNotFound: 'Booking not found.',
      bookingRejected: 'This booking could not be completed.',
      alreadyBooked: 'You already booked this trip.',
      cannotBookBlockedUser: 'You cannot book a trip with this user.',
      womenOnly: 'This trip is limited to women riders.',
      menOnly: 'This trip is limited to men riders.',
      alreadyDeparted: 'This trip has already departed.',
      wholeSeatRequired: 'You must book at least one whole seat.',
      singleSeatOnly: 'Only one seat per user is supported right now.',
      notEnoughSeats: 'There are not enough seats available.',
      bookingAlreadyCancelled: 'This booking was already cancelled.',
      basicProfileRequired: 'Complete your basic profile before booking in the public community.',
      tripUpdateNotAllowed: 'You cannot change this trip right now.',
      invalidTripTransition: 'This trip status change is not allowed.',
      startTooEarly: 'You can only start the trip within 30 minutes of departure.',
      completeRequiresInProgress: 'The trip must be in progress before it can be completed.',
      genericBooking: 'Booking failed.',
      genericCancel: 'Cancelling the booking failed.',
      genericUpdate: 'Updating the trip failed.',
    },
  },
  ar: {
    tripLiveNotice: 'أصبحت الرحلة منشورة الآن ومرئية لمجتمعك.',
    departed: 'غادرت',
    departingSoon: 'المغادرة قريبة',
    publicTrustNote: 'مجتمع عام: يمكن لأي شخص الانضمام، لذلك مستوى الثقة هنا أقل من المجتمعات الموثقة.',
    from: 'من',
    to: 'إلى',
    driver: 'السائق',
    communityMember: 'عضو مجتمع',
    reportDriver: 'الإبلاغ عن هذا السائق',
    pricePerSeat: 'السعر لكل مقعد',
    whatSignalsMean: 'ماذا تعني هذه المؤشرات',
    signalsDescription:
      'يوضح التقييم المستلم آراء المشاركين الآخرين في الرحلات المكتملة. ويُظهر عدد الرحلات المكتملة عدد الرحلات التي قادها هذا الشخص حتى النهاية. إعداد الملف الشخصي يظهر بشكل منفصل ولا يغيّر أيًّا من هذين الرقمين.',
    communicationLimitedTitle: 'التواصل في هذه الرحلة محدود.',
    communicationLimitedDescription:
      'إعدادات الحظر تمنع الرسائل المباشرة في هذه الرحلة المشتركة، لكن تحديثات الرحلة المنظمة وحالات الإلغاء وحالة الرحلة نفسها ستظل ظاهرة.',
    availableNow: 'متاح الآن',
    reserveSeatDescription: (priceLabel) =>
      `احجز مقعدًا واحدًا الآن${priceLabel ? ` مقابل ${priceLabel}` : ''}. ستظهر الرحلة بعد ذلك في صندوق تواصل الرحلات لديك.`,
    publicBookingTitle: 'الحجز في المجتمع العام',
    publicBookingDescription:
      'يتطلب الحجز هنا إكمال بيانات ملفك الشخصي.',
    updateProfile: 'تحديث الملف الشخصي',
    confirmBooking: 'تأكيد الحجز',
    bookedStateTitle: 'تم تأكيد حجزك.',
    bookedStateDescription:
      'لديك بالفعل مقعد واحد في هذه الرحلة. يمكنك متابعة التنسيق بالأسفل أو إلغاء الحجز إذا تغيّرت خططك.',
    openTripCommunication: 'فتح تواصل الرحلة',
    openTripUpdates: 'فتح تحديثات الرحلة',
    tripCancelledTitle: 'تم إلغاء الرحلة',
    tripCancelledDescription: (driverName, date) =>
      `${driverName} ألغى هذه الرحلة${date ? ` بتاريخ ${date}` : ''}.`,
    seatCancelledTitle: 'تم إلغاء المقعد',
    seatCancelledDescription: (date) =>
      `لقد أفرغت مقعدك${date ? ` بتاريخ ${date}` : ''}.`,
    startTrip: 'بدء الرحلة',
    cancelTripPromptTitle: 'إلغاء هذه الرحلة؟',
    cancelTripPromptDescription: 'سيتمكن الجميع من رؤية أن هذه الرحلة قد أُلغيت.',
    confirmCancelTrip: 'نعم، ألغِ الرحلة',
    keepTrip: 'الاحتفاظ بالرحلة',
    passengerInitial: 'ر',
    reportDriverFallback: 'السائق',
    startTripNotice: 'بدأت الرحلة. يظل تواصل الرحلة متاحًا ما دامت الرحلة نشطة.',
    completedTripNotice: 'تم تعليم الرحلة كمكتملة.',
    cancelledTripNotice: 'تم إلغاء الرحلة. لا يزال بإمكان المشاركين رؤية الإلغاء هنا.',
    bookingReservedNotice: 'تم حجز المقعد. ستظهر الرحلة الآن في صندوق تواصل الرحلات لديك.',
    bookingCancelledNotice: 'تم إلغاء الرحلة. المقعد الذي أفرغته أصبح ظاهرًا الآن في هذه الرحلة.',
    perSeatSuffix: 'لكل مقعد',
    errors: {
      unauthorized: 'ليست لديك صلاحية لتنفيذ هذا الإجراء.',
      tripNotFound: 'لم يتم العثور على الرحلة.',
      bookingNotFound: 'لم يتم العثور على الحجز.',
      bookingRejected: 'لم نتمكن من إتمام هذا الحجز.',
      alreadyBooked: 'لقد قمت بحجز هذه الرحلة بالفعل.',
      cannotBookBlockedUser: 'لا يمكنك حجز رحلة مع هذا المستخدم.',
      womenOnly: 'هذه الرحلة مخصصة للراكبات فقط.',
      menOnly: 'هذه الرحلة مخصصة للركاب الذكور فقط.',
      alreadyDeparted: 'هذه الرحلة غادرت بالفعل.',
      wholeSeatRequired: 'يجب حجز مقعد كامل واحد على الأقل.',
      singleSeatOnly: 'يمكنك حجز مقعد واحد فقط في هذه الرحلة.',
      notEnoughSeats: 'لا توجد مقاعد كافية متاحة.',
      bookingAlreadyCancelled: 'تم إلغاء هذا الحجز بالفعل.',
      basicProfileRequired: 'أكمل بياناتك الشخصية قبل استخدام هذه الميزة.',
      tripUpdateNotAllowed: 'لا يمكنك تعديل هذه الرحلة الآن.',
      invalidTripTransition: 'لا يمكن تغيير حالة هذه الرحلة بهذه الطريقة.',
      startTooEarly: 'يمكنك بدء الرحلة فقط خلال 30 دقيقة من موعد الانطلاق.',
      completeRequiresInProgress: 'يجب أن تكون الرحلة قيد التنفيذ قبل تعليمها كمكتملة.',
      genericBooking: 'فشل الحجز.',
      genericCancel: 'فشل إلغاء الحجز.',
      genericUpdate: 'فشل تحديث الرحلة.',
    },
  },
  he: {
    tripLiveNotice: 'הנסיעה שלך פעילה עכשיו וגלויה לקהילה שלך.',
    departed: 'יצאה',
    departingSoon: 'היציאה מתקרבת',
    publicTrustNote: 'קהילה ציבורית: כל אחד יכול להצטרף, ולכן רמת האמון כאן נמוכה יותר מקהילות מאומתות.',
    from: 'מ',
    to: 'אל',
    driver: 'נהג',
    communityMember: 'חבר קהילה',
    reportDriver: 'דווח על הנהג הזה',
    pricePerSeat: 'מחיר למושב',
    whatSignalsMean: 'מה המשמעות של הסימנים האלה',
    signalsDescription:
      'הדירוג שהתקבל משקף את המשוב שהאדם הזה קיבל ממשתתפים אחרים בנסיעות שהושלמו. מספר הנסיעות שהושלמו כנהג מציג כמה נסיעות הסתיימו כשהוא נהג. מצב הפרופיל מוצג בנפרד ואינו משנה אף אחד מהמספרים האלה.',
    communicationLimitedTitle: 'התקשורת בנסיעה מוגבלת',
    communicationLimitedDescription:
      'הגדרת חסימה מבטלת הודעות ישירות בנסיעה המשותפת הזו, אבל עדכוני נסיעה מובנים, ביטולים וסטטוס הנסיעה עדיין נשארים גלויים.',
    availableNow: 'זמין עכשיו',
    reserveSeatDescription: (priceLabel) =>
      `הזמן עכשיו מושב אחד${priceLabel ? ` עבור ${priceLabel}` : ''}. לאחר מכן הנסיעה תופיע בתיבת התקשורת שלך.`,
    publicBookingTitle: 'הזמנה בקהילה ציבורית',
    publicBookingDescription:
      'הזמנה כאן דורשת פרופיל בסיסי שכולל שם תצוגה, טלפון, עיר או אזור וגיל.',
    updateProfile: 'עדכון פרופיל',
    confirmBooking: 'אשר הזמנה',
    bookedStateTitle: 'המושב שלך שמור',
    bookedStateDescription:
      'כבר שמור לך מושב אחד בנסיעה הזו. אפשר לנהל את התיאום למטה או לבטל אם התוכניות השתנו.',
    openTripCommunication: 'פתח תקשורת נסיעה',
    openTripUpdates: 'פתח עדכוני נסיעה',
    tripCancelledTitle: 'הנסיעה בוטלה',
    tripCancelledDescription: (driverName, date) =>
      `${driverName} ביטל את הנסיעה הזו${date ? ` ב־${date}` : ''}.`,
    seatCancelledTitle: 'המושב בוטל',
    seatCancelledDescription: (date) =>
      `שחררת את המושב שלך${date ? ` ב־${date}` : ''}.`,
    startTrip: 'התחל נסיעה',
    cancelTripPromptTitle: 'לבטל את הנסיעה הזאת?',
    cancelTripPromptDescription: 'כולם יראו שהנסיעה הזאת בוטלה.',
    confirmCancelTrip: 'כן, בטל את הנסיעה',
    keepTrip: 'השאר את הנסיעה',
    passengerInitial: 'נ',
    reportDriverFallback: 'נהג',
    startTripNotice: 'הנסיעה התחילה. תקשורת הנסיעה תישאר זמינה כל עוד הנסיעה פעילה.',
    completedTripNotice: 'הנסיעה סומנה כהושלמה.',
    cancelledTripNotice: 'הנסיעה בוטלה. המשתתפים עדיין יכולים לראות כאן את הביטול.',
    bookingReservedNotice: 'המושב הוזמן. הנסיעה מופיעה עכשיו בתיבת התקשורת שלך.',
    bookingCancelledNotice: 'ההזמנה בוטלה. המושב ששחררת גלוי עכשיו בנסיעה הזו.',
    perSeatSuffix: 'למושב',
    errors: {
      unauthorized: 'אין לך הרשאה לבצע את הפעולה הזו.',
      tripNotFound: 'הנסיעה לא נמצאה.',
      bookingNotFound: 'ההזמנה לא נמצאה.',
      bookingRejected: 'לא ניתן היה להשלים את ההזמנה הזאת.',
      alreadyBooked: 'כבר הזמנת את הנסיעה הזו.',
      cannotBookBlockedUser: 'אי אפשר להזמין נסיעה עם המשתמש הזה.',
      womenOnly: 'הנסיעה הזו מיועדת לנוסעות בלבד.',
      menOnly: 'הנסיעה הזו מיועדת לנוסעים גברים בלבד.',
      alreadyDeparted: 'הנסיעה הזאת כבר יצאה.',
      wholeSeatRequired: 'צריך להזמין לפחות מושב שלם אחד.',
      singleSeatOnly: 'כרגע נתמך מושב אחד בלבד לכל משתמש.',
      notEnoughSeats: 'אין מספיק מושבים זמינים.',
      bookingAlreadyCancelled: 'ההזמנה הזאת כבר בוטלה.',
      basicProfileRequired: 'יש להשלים פרופיל בסיסי לפני שמזמינים בקהילה הציבורית.',
      tripUpdateNotAllowed: 'אי אפשר לשנות את הנסיעה הזאת כרגע.',
      invalidTripTransition: 'אי אפשר לשנות את סטטוס הנסיעה בצורה הזאת.',
      startTooEarly: 'אפשר להתחיל את הנסיעה רק בתוך 30 דקות מזמן היציאה.',
      completeRequiresInProgress: 'הנסיעה חייבת להיות בתהליך לפני שאפשר להשלים אותה.',
      genericBooking: 'ההזמנה נכשלה.',
      genericCancel: 'ביטול ההזמנה נכשל.',
      genericUpdate: 'עדכון הנסיעה נכשל.',
    },
  },
};

export function localizeTripActionError(message: string, lang: Lang) {
  const copy = DETAIL_COPY[lang] ?? DETAIL_COPY.en;
  const normalized = message.trim().toLowerCase();

  if (normalized.includes('trip not found')) return copy.errors.tripNotFound;
  if (normalized.includes('booking not found')) return copy.errors.bookingNotFound;
  if (normalized.includes('already booked this trip') || normalized.includes('duplicate_booking')) {
    return copy.errors.alreadyBooked;
  }
  if (normalized.includes('booking rejected')) return copy.errors.bookingRejected;
  if (normalized.includes('cannot book a trip with this user')) return copy.errors.cannotBookBlockedUser;
  if (normalized.includes('limited to women riders')) return copy.errors.womenOnly;
  if (normalized.includes('limited to men riders')) return copy.errors.menOnly;
  if (normalized.includes('already departed')) return copy.errors.alreadyDeparted;
  if (normalized.includes('must book at least 1 whole seat')) return copy.errors.wholeSeatRequired;
  if (normalized.includes('only one seat per user is supported right now')) {
    return copy.errors.singleSeatOnly;
  }
  if (normalized.includes('not enough seats available')) return copy.errors.notEnoughSeats;
  if (normalized.includes('booking already cancelled')) return copy.errors.bookingAlreadyCancelled;
  if (normalized.includes('complete your basic profile before booking in the public community') ||
      normalized.includes('profile_incomplete')) {
    return copy.errors.basicProfileRequired;
  }
  if (normalized.includes('acknowledgements are required') || normalized.includes('booking acknowledgements')) {
    if (lang === 'ar') return 'يجب الموافقة على شروط الحجز الثلاثة قبل تأكيد الحجز.';
    if (lang === 'he') return copy.errors.genericBooking;
    return 'Booking acknowledgements are required before confirming.';
  }
  if (normalized.includes('unauthorized') || normalized.includes('permission')) {
    return copy.errors.unauthorized;
  }
  if (normalized.includes('trip update not allowed')) return copy.errors.tripUpdateNotAllowed;
  if (normalized.includes('cannot move trip from')) return copy.errors.invalidTripTransition;
  if (normalized.includes('trip cannot be started more than 30 minutes before departure')) {
    return copy.errors.startTooEarly;
  }
  if (normalized.includes('trip must be in progress before it can be completed')) {
    return copy.errors.completeRequiresInProgress;
  }
  if (normalized === 'booking failed') return copy.errors.genericBooking;
  if (normalized === 'cancel failed') return copy.errors.genericCancel;
  if (normalized === 'failed to update trip') return copy.errors.genericUpdate;

  return lang === 'en' ? message : copy.errors.genericUpdate;
}
