import Link from 'next/link';
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

const PRIVACY_COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    description: string;
    sections: Array<{ title: string; paragraphs?: string[]; bullets?: string[] }>;
    questionsTitle: string;
    questionsText: string;
    contactLabel: string;
    questionsSuffix: string;
  }
> = {
  en: {
    eyebrow: 'Privacy Policy',
    title: 'OnWay Privacy Policy',
    description:
      'This page describes the main categories of information OnWay uses to operate trip coordination, communities, and safety features.',
    sections: [
      {
        title: '1. Information we collect',
        bullets: [
          'Account information such as your authentication identity and email address.',
          'Profile details you choose to provide, including display name, phone, city or area, age, gender, driver status, license declaration, preferences, and avatar.',
          'Trip and community activity such as communities joined, trips posted, bookings, messages, reports, ratings, notifications, and safety-related actions.',
          'Operational event data needed to run the product, improve reliability, and investigate misuse.',
        ],
      },
      {
        title: '2. How we use information',
        bullets: [
          'To authenticate you and keep your account available.',
          'To display your profile and trip activity where the product requires it.',
          'To coordinate trips, bookings, communication, and trust signals inside communities.',
          'To prevent abuse, review reports, enforce product rules, and respond to safety concerns.',
          'To maintain service reliability, debug issues, and understand basic product usage.',
        ],
      },
      {
        title: '3. What other users can see',
        paragraphs: [
          'Other users may see parts of your information when it is necessary for the product to work. For example, members may see your display name, trip details, limited trust signals, and booking or coordination activity connected to shared trips or communities.',
          'Private or placeholder-only document fields are not treated as public verification badges.',
        ],
      },
      {
        title: '4. Sharing with service providers',
        paragraphs: [
          'OnWay relies on infrastructure and service providers needed to operate the app, including authentication, data storage, hosting, and analytics-related tooling. These providers may process data on our behalf to deliver the service.',
        ],
      },
      {
        title: '5. Retention',
        paragraphs: [
          'We keep information for as long as it is reasonably needed to operate the product, maintain trust and safety records, comply with legal obligations, or resolve disputes. Some records may remain for audit or moderation purposes even after account changes.',
        ],
      },
      {
        title: '6. Your choices',
        bullets: [
          'You can update your editable profile information from the profile area of the app.',
          'If your deployment enables account deletion, you can use the in-app deletion flow to request removal of your account and associated data.',
          'You can decide whether to provide optional profile fields and placeholder-only document metadata.',
        ],
      },
    ],
    questionsTitle: '7. Questions',
    questionsText: 'For privacy or data-use questions, visit the',
    contactLabel: 'Contact Us',
    questionsSuffix: 'page for the current support path.',
  },
  ar: {
    eyebrow: 'سياسة الخصوصية',
    title: 'سياسة الخصوصية في بطريقك',
    description:
      'توضح هذه الصفحة الفئات الرئيسية للمعلومات التي يستخدمها بطريقك لتشغيل تنسيق الرحلات والمجتمعات وميزات السلامة.',
    sections: [
      {
        title: '1. المعلومات التي نجمعها',
        bullets: [
          'معلومات الحساب مثل هوية المصادقة الخاصة بك وعنوان البريد الإلكتروني.',
          'تفاصيل الملف الشخصي التي تختار تقديمها، بما في ذلك الاسم المعروض ورقم الهاتف والمدينة أو المنطقة والعمر والجنس وحالة السائق والتصريح بالرخصة والتفضيلات والصورة الرمزية.',
          'نشاط الرحلات والمجتمعات مثل المجتمعات التي انضممت إليها، والرحلات التي نشرتها، والحجوزات، والرسائل، والبلاغات، والتقييمات، والإشعارات، والإجراءات المرتبطة بالسلامة.',
          'بيانات تشغيلية لازمة لتشغيل المنتج وتحسين الاعتمادية والتحقيق في إساءة الاستخدام.',
        ],
      },
      {
        title: '2. كيف نستخدم المعلومات',
        bullets: [
          'لمصادقتك والحفاظ على توفر حسابك.',
          'لعرض ملفك الشخصي ونشاطك في الرحلات عندما يتطلب المنتج ذلك.',
          'لتنسيق الرحلات والحجوزات والتواصل ومؤشرات الثقة داخل المجتمعات.',
          'لمنع الإساءة ومراجعة البلاغات وفرض قواعد المنتج والاستجابة للمخاوف المتعلقة بالسلامة.',
          'للحفاظ على اعتمادية الخدمة وتصحيح الأعطال وفهم الاستخدام الأساسي للمنتج.',
        ],
      },
      {
        title: '3. ما الذي يمكن للمستخدمين الآخرين رؤيته',
        paragraphs: [
          'قد يرى المستخدمون الآخرون أجزاءً من معلوماتك عندما يكون ذلك ضروريًا لعمل المنتج. على سبيل المثال، قد يرى الأعضاء اسمك المعروض وتفاصيل الرحلة وبعض مؤشرات الثقة المحدودة ونشاط الحجز أو التنسيق المرتبط بالرحلات أو المجتمعات المشتركة.',
          'حقول المستندات الخاصة أو المؤقتة لا تُعامل كشارات تحقق عامة.',
        ],
      },
      {
        title: '4. المشاركة مع مزودي الخدمة',
        paragraphs: [
          'يعتمد بطريقك على بنية تحتية ومزودي خدمات ضروريين لتشغيل التطبيق، بما في ذلك المصادقة وتخزين البيانات والاستضافة وأدوات مرتبطة بالتحليلات. وقد تعالج هذه الجهات البيانات نيابة عنا لتقديم الخدمة.',
        ],
      },
      {
        title: '5. الاحتفاظ بالبيانات',
        paragraphs: [
          'نحتفظ بالمعلومات طالما كان ذلك مطلوبًا بشكل معقول لتشغيل المنتج والحفاظ على سجلات الثقة والسلامة والامتثال للالتزامات القانونية أو حل النزاعات. قد تبقى بعض السجلات لأغراض التدقيق أو الإشراف حتى بعد تغييرات الحساب.',
        ],
      },
      {
        title: '6. خياراتك',
        bullets: [
          'يمكنك تحديث معلومات ملفك الشخصي القابلة للتعديل من قسم الملف الشخصي في التطبيق.',
          'إذا كان النشر الخاص بك يدعم حذف الحساب، يمكنك استخدام تدفق الحذف داخل التطبيق لطلب إزالة حسابك وبياناتك المرتبطة به.',
          'يمكنك أن تقرر ما إذا كنت تريد تقديم الحقول الاختيارية في الملف الشخصي وبيانات المستندات المؤقتة فقط.',
        ],
      },
    ],
    questionsTitle: '7. الأسئلة',
    questionsText: 'للأسئلة المتعلقة بالخصوصية أو استخدام البيانات، زر',
    contactLabel: 'صفحة اتصل بنا',
    questionsSuffix: 'للاطلاع على طريقة الدعم الحالية.',
  },
  he: {
    eyebrow: 'מדיניות פרטיות',
    title: 'מדיניות הפרטיות של בדרךך',
    description:
      'העמוד הזה מסביר את קטגוריות המידע העיקריות שבדרךך משתמשת בהן כדי להפעיל תיאום נסיעות, קהילות ויכולות בטיחות.',
    sections: [
      {
        title: '1. איזה מידע אנחנו אוספים',
        bullets: [
          'פרטי חשבון כמו זהות ההתחברות שלכם וכתובת האימייל.',
          'פרטי פרופיל שאתם בוחרים לספק, כולל שם תצוגה, טלפון, עיר או אזור, גיל, מגדר, סטטוס נהג, הצהרת רישיון, העדפות ותמונה.',
          'פעילות נסיעות וקהילות כמו קהילות שהצטרפתם אליהן, נסיעות שפרסמתם, הזמנות, הודעות, דיווחים, דירוגים, התראות ופעולות הקשורות לבטיחות.',
          'נתוני תפעול שנדרשים להפעלת המוצר, לשיפור האמינות ולחקירת שימוש לרעה.',
        ],
      },
      {
        title: '2. איך אנחנו משתמשים במידע',
        bullets: [
          'כדי לאמת אתכם ולהשאיר את החשבון שלכם זמין.',
          'כדי להציג את הפרופיל ואת פעילות הנסיעות שלכם במקומות שהמוצר דורש.',
          'כדי לתאם נסיעות, הזמנות, תקשורת וסימני אמון בתוך קהילות.',
          'כדי למנוע שימוש לרעה, לבדוק דיווחים, לאכוף את כללי המוצר ולהגיב לחששות בטיחות.',
          'כדי לשמור על אמינות השירות, לתקן תקלות ולהבין שימוש בסיסי במוצר.',
        ],
      },
      {
        title: '3. מה משתמשים אחרים יכולים לראות',
        paragraphs: [
          'משתמשים אחרים עשויים לראות חלקים מהמידע שלכם כשזה נחוץ כדי שהמוצר יעבוד. לדוגמה, חברים עשויים לראות את שם התצוגה שלכם, פרטי נסיעה, סימני אמון מוגבלים ופעילות הזמנה או תיאום שקשורה לנסיעות או לקהילות משותפות.',
          'שדות מסמכים פרטיים או זמניים אינם נחשבים לתגי אימות ציבוריים.',
        ],
      },
      {
        title: '4. שיתוף עם ספקי שירות',
        paragraphs: [
          'בדרךך נשענת על תשתיות ועל ספקי שירות שנחוצים להפעלת האפליקציה, כולל אימות, אחסון נתונים, אירוח וכלים הקשורים לניתוח שימוש. ספקים אלה עשויים לעבד מידע בשמנו כדי לספק את השירות.',
        ],
      },
      {
        title: '5. שמירת מידע',
        paragraphs: [
          'אנחנו שומרים מידע כל עוד הוא נחוץ באופן סביר להפעלת המוצר, לשמירה על רשומות אמון ובטיחות, לעמידה בדרישות חוקיות או לפתרון מחלוקות. חלק מהרשומות עשויות להישמר לצורכי ביקורת או ניהול גם אחרי שינויים בחשבון.',
        ],
      },
      {
        title: '6. הבחירות שלכם',
        bullets: [
          'אפשר לעדכן את פרטי הפרופיל הניתנים לעריכה מאזור הפרופיל באפליקציה.',
          'אם בפריסה שלכם יש אפשרות למחיקת חשבון, אפשר להשתמש בתהליך המחיקה בתוך האפליקציה כדי לבקש הסרה של החשבון ושל הנתונים המשויכים אליו.',
          'אפשר לבחור אם לספק שדות פרופיל אופציונליים ונתוני מסמכים זמניים בלבד.',
        ],
      },
    ],
    questionsTitle: '7. שאלות',
    questionsText: 'לשאלות על פרטיות או שימוש במידע, בקרו ב־',
    contactLabel: 'עמוד יצירת הקשר',
    questionsSuffix: 'כדי לראות את מסלול התמיכה העדכני.',
  },
};

export default async function PrivacyPage() {
  const lang = await getServerLang();
  const copy = PRIVACY_COPY[lang] ?? PRIVACY_COPY.en;
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
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{copy.questionsTitle}</h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {copy.questionsText}{' '}
          <Link href="/contact" className="text-sky-700 dark:text-sky-300 font-medium hover:underline">
            {copy.contactLabel}
          </Link>{' '}
          {copy.questionsSuffix}
        </p>
      </section>
    </PublicInfoPage>
  );
}
