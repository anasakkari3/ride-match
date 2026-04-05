import PublicInfoPage from '@/components/public/PublicInfoPage';
import type { Lang } from '@/lib/i18n/dictionaries';
import { formatLocalizedDate } from '@/lib/i18n/locale';
import { getServerLang } from '@/lib/i18n/server';

function Section({
  title,
  paragraphs,
  bullets,
}: {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
      {paragraphs?.map((paragraph) => (
        <p key={paragraph} className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {paragraph}
        </p>
      ))}
      {bullets && (
        <ul className="space-y-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed list-disc pl-5 rtl:pl-0 rtl:pr-5">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

const TERMS_COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    description: string;
    sections: Array<{ title: string; paragraphs?: string[]; bullets?: string[] }>;
  }
> = {
  en: {
    eyebrow: 'Terms and Conditions',
    title: 'OnWay Terms and Conditions',
    description:
      'These terms explain the basic rules for using OnWay as an early-stage community trip coordination product.',
    sections: [
      {
        title: '1. What OnWay does',
        paragraphs: [
          'OnWay helps communities coordinate shared trips, seat availability, bookings, and trip communication. It is a coordination tool, not a transportation company, taxi service, insurer, or payment processor.',
          'When you use the product, you are responsible for the trips you post, the bookings you make, and the decisions you take based on information shared by other users.',
        ],
      },
      {
        title: '2. Accounts and profile information',
        paragraphs: [
          'You agree to provide accurate account and profile information and to keep it reasonably up to date.',
        ],
        bullets: [
          'Do not impersonate another person or organization.',
          'Do not share account access in a way that could create safety or trust problems.',
          'If you offer rides, you are responsible for honestly declaring whether you are a driver and whether you hold a valid driver license.',
        ],
      },
      {
        title: '3. Trip posting and booking rules',
        bullets: [
          'Only post trips you genuinely plan to take.',
          'Only book seats you actually intend to use.',
          'Use accurate route, timing, seat, and price information.',
          'Treat other members respectfully during booking, coordination, and travel.',
          'Follow local laws and community rules that apply to transport, driving, and cost sharing.',
        ],
      },
      {
        title: '4. Driver responsibilities',
        paragraphs: [
          'Drivers are responsible for operating their vehicle lawfully and safely. Any declaration about licensing or vehicle documents in the product is provided by the user unless the product clearly says otherwise.',
          'Placeholder document selections in the profile are not verification and do not create any verified status.',
        ],
      },
      {
        title: '5. Pricing and payments',
        paragraphs: [
          'If a trip includes a price, that amount is set by the user posting the trip. OnWay currently supports coordination around pricing, but it does not currently process rider payments inside the product unless a separate flow is explicitly introduced later.',
        ],
      },
      {
        title: '6. Safety, moderation, and availability',
        bullets: [
          'We may restrict or remove content, bookings, trips, or accounts that appear abusive, unsafe, misleading, or unlawful.',
          'We may update, limit, or suspend features while the product is still in an early phase.',
          'Do not rely on OnWay for emergency support or urgent safety response.',
        ],
      },
      {
        title: '7. Liability',
        paragraphs: [
          'OnWay is provided on an as-is basis. To the extent allowed by law, OnWay is not responsible for user conduct, trip outcomes, route choices, payment disputes, delays, accidents, vehicle condition, or losses caused by reliance on user-submitted content.',
        ],
      },
      {
        title: '8. Changes and contact',
        paragraphs: [
          'We may update these terms as the product evolves. Continued use after an update means you accept the revised version.',
          'For support or policy questions, use the contact guidance on the Contact Us page.',
        ],
      },
    ],
  },
  ar: {
    eyebrow: 'الشروط والأحكام',
    title: 'شروط وأحكام بطريقك',
    description:
      'توضح هذه الشروط القواعد الأساسية لاستخدام بطريقك كمنتج ناشئ لتنسيق الرحلات داخل المجتمعات.',
    sections: [
      {
        title: '1. ما الذي يقدمه بطريقك',
        paragraphs: [
          'يساعد بطريقك المجتمعات على تنسيق الرحلات المشتركة، وتوفر المقاعد، والحجوزات، والتواصل المرتبط بالرحلة. وهو أداة للتنسيق فقط، وليس شركة نقل أو خدمة سيارات أجرة أو شركة تأمين أو معالج مدفوعات.',
          'عند استخدامك للمنتج، فأنت مسؤول عن الرحلات التي تنشرها، والحجوزات التي تجريها، والقرارات التي تتخذها بناءً على المعلومات التي يشاركها المستخدمون الآخرون.',
        ],
      },
      {
        title: '2. الحسابات ومعلومات الملف الشخصي',
        paragraphs: ['أنت توافق على تقديم معلومات صحيحة عن الحساب والملف الشخصي والحفاظ عليها محدثة بشكل معقول.'],
        bullets: [
          'لا تنتحل شخصية فرد أو جهة أخرى.',
          'لا تشارك الوصول إلى حسابك بطريقة قد تخلق مشاكل تتعلق بالأمان أو الثقة.',
          'إذا كنت تعرض رحلات، فأنت مسؤول عن التصريح بصدق عمّا إذا كنت سائقًا وما إذا كنت تحمل رخصة قيادة سارية.',
        ],
      },
      {
        title: '3. قواعد نشر الرحلات والحجز',
        bullets: [
          'انشر فقط الرحلات التي تنوي فعلًا القيام بها.',
          'احجز فقط المقاعد التي تنوي استخدامها فعليًا.',
          'استخدم معلومات دقيقة للمسار والوقت وعدد المقاعد والسعر.',
          'تعامل باحترام مع بقية الأعضاء أثناء الحجز والتنسيق والسفر.',
          'التزم بالقوانين المحلية وقواعد المجتمع المتعلقة بالنقل والقيادة وتقاسم التكاليف.',
        ],
      },
      {
        title: '4. مسؤوليات السائق',
        paragraphs: [
          'السائقون مسؤولون عن قيادة مركباتهم بشكل قانوني وآمن. أي تصريح يتعلق بالرخصة أو وثائق المركبة داخل المنتج يعتمد على ما يقدمه المستخدم ما لم يذكر المنتج بوضوح خلاف ذلك.',
          'خيارات المستندات المؤقتة في الملف الشخصي ليست عملية تحقق فعلية ولا تمنح أي حالة موثقة.',
        ],
      },
      {
        title: '5. الأسعار والمدفوعات',
        paragraphs: [
          'إذا تضمنت الرحلة سعرًا، فإن المبلغ يحدده المستخدم الذي نشر الرحلة. يدعم بطريقك حاليًا تنسيق الأسعار، لكنه لا يعالج مدفوعات الركاب داخل المنتج حاليًا ما لم تتم إضافة تدفق منفصل بشكل صريح لاحقًا.',
        ],
      },
      {
        title: '6. السلامة والإشراف وتوفر الخدمة',
        bullets: [
          'قد نقوم بتقييد أو إزالة المحتوى أو الحجوزات أو الرحلات أو الحسابات التي تبدو مسيئة أو غير آمنة أو مضللة أو غير قانونية.',
          'قد نحدّث الميزات أو نقيّدها أو نعلّقها بينما لا يزال المنتج في مرحلة مبكرة.',
          'لا تعتمد على بطريقك للدعم الطارئ أو الاستجابة السريعة للمخاطر الواقعية.',
        ],
      },
      {
        title: '7. المسؤولية',
        paragraphs: [
          'يتم تقديم بطريقك كما هو. وبالقدر الذي يسمح به القانون، لا يتحمل بطريقك مسؤولية سلوك المستخدمين أو نتائج الرحلات أو اختيار المسارات أو نزاعات الدفع أو التأخيرات أو الحوادث أو حالة المركبة أو الخسائر الناتجة عن الاعتماد على محتوى يقدمه المستخدمون.',
        ],
      },
      {
        title: '8. التحديثات والتواصل',
        paragraphs: [
          'قد نقوم بتحديث هذه الشروط مع تطور المنتج. استمرارك في الاستخدام بعد أي تحديث يعني قبولك للنسخة المعدلة.',
          'للاستفسارات المتعلقة بالدعم أو السياسات، استخدم الإرشادات الموجودة في صفحة اتصل بنا.',
        ],
      },
    ],
  },
  he: {
    eyebrow: 'תנאים והגבלות',
    title: 'התנאים וההגבלות של בדרךך',
    description:
      'התנאים האלה מסבירים את הכללים הבסיסיים לשימוש ב"בדרךך" כמוצר מוקדם לתיאום נסיעות קהילתי.',
    sections: [
      {
        title: '1. מה המוצר עושה',
        paragraphs: [
          'בדרךך עוזרת לקהילות לתאם נסיעות משותפות, זמינות מושבים, הזמנות ותקשורת סביב הנסיעה. זו מערכת תיאום בלבד, ולא חברת תחבורה, שירות מוניות, חברת ביטוח או מעבד תשלומים.',
          'כאשר משתמשים במוצר, האחריות על הנסיעות שמפרסמים, ההזמנות שמבצעים וההחלטות שמקבלים על סמך מידע של משתמשים אחרים היא שלכם.',
        ],
      },
      {
        title: '2. חשבונות ומידע בפרופיל',
        paragraphs: ['אתם מתחייבים לספק מידע נכון על החשבון והפרופיל ולעדכן אותו באופן סביר כשצריך.'],
        bullets: [
          'אל תתחזו לאדם או לארגון אחר.',
          'אל תשתפו גישה לחשבון שלכם בצורה שעלולה ליצור בעיות אמון או בטיחות.',
          'אם אתם מציעים נסיעות, האחריות על הצהרה כנה אם אתם נהגים ואם יש לכם רישיון נהיגה בתוקף היא עליכם.',
        ],
      },
      {
        title: '3. כללי פרסום נסיעות והזמנות',
        bullets: [
          'פרסמו רק נסיעות שאתם באמת מתכוונים לבצע.',
          'הזמינו רק מושבים שאתם באמת מתכוונים להשתמש בהם.',
          'הזינו מידע מדויק על המסלול, הזמנים, מספר המושבים והמחיר.',
          'התנהגו בכבוד כלפי חברי הקהילה האחרים במהלך ההזמנה, התיאום והנסיעה.',
          'פעלו לפי החוקים המקומיים וכללי הקהילה שחלים על תחבורה, נהיגה וחלוקת עלויות.',
        ],
      },
      {
        title: '4. אחריות הנהג',
        paragraphs: [
          'נהגים אחראים להפעיל את הרכב שלהם כחוק ובבטחה. כל הצהרה על רישוי או מסמכי רכב במוצר מבוססת על מידע שהמשתמש מספק, אלא אם נאמר במפורש אחרת.',
          'סימוני מסמכים זמניים בפרופיל אינם אימות אמיתי ואינם יוצרים סטטוס מאומת.',
        ],
      },
      {
        title: '5. מחירים ותשלומים',
        paragraphs: [
          'אם לנסיעה יש מחיר, הסכום נקבע על ידי המשתמש שפרסם אותה. בדרךך תומכת כרגע בתיאום סביב המחיר, אבל אינה מעבדת תשלומי נוסעים בתוך המוצר אלא אם יתווסף בעתיד תהליך נפרד במפורש.',
        ],
      },
      {
        title: '6. בטיחות, ניהול ותמיכה במוצר',
        bullets: [
          'אנחנו עשויים להגביל או להסיר תוכן, הזמנות, נסיעות או חשבונות שנראים פוגעניים, לא בטוחים, מטעים או בלתי חוקיים.',
          'אנחנו עשויים לעדכן, להגביל או להשעות יכולות בזמן שהמוצר עדיין בשלב מוקדם.',
          'אל תסתמכו על בדרךך לצורך תמיכה חירומית או תגובת בטיחות דחופה.',
        ],
      },
      {
        title: '7. אחריות משפטית',
        paragraphs: [
          'בדרךך מסופקת כפי שהיא. ככל שהחוק מאפשר, בדרךך אינה אחראית להתנהגות משתמשים, תוצאות נסיעה, בחירת מסלול, מחלוקות תשלום, עיכובים, תאונות, מצב הרכב או נזקים שנגרמו מהסתמכות על תוכן שהוזן על ידי משתמשים.',
        ],
      },
      {
        title: '8. שינויים ויצירת קשר',
        paragraphs: [
          'אנחנו עשויים לעדכן את התנאים האלה ככל שהמוצר מתפתח. המשך השימוש לאחר עדכון פירושו קבלה של הגרסה המעודכנת.',
          'לשאלות על מדיניות או תמיכה, השתמשו בהנחיות שבעמוד יצירת הקשר.',
        ],
      },
    ],
  },
};

export default async function TermsPage() {
  const lang = await getServerLang();
  const copy = TERMS_COPY[lang] ?? TERMS_COPY.en;
  const lastUpdated = formatLocalizedDate(lang, '2026-04-05', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <PublicInfoPage
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
      lastUpdated={lastUpdated}
    >
      {copy.sections.map((section) => (
        <Section
          key={section.title}
          title={section.title}
          paragraphs={section.paragraphs}
          bullets={section.bullets}
        />
      ))}
    </PublicInfoPage>
  );
}
