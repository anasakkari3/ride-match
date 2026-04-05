import PublicInfoPage from '@/components/public/PublicInfoPage';
import type { Lang } from '@/lib/i18n/dictionaries';
import { formatLocalizedDate } from '@/lib/i18n/locale';
import { getServerLang } from '@/lib/i18n/server';

function ContactCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-5">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">{body}</p>
    </div>
  );
}

const CONTACT_COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    description: string;
    cards: Array<{ title: string; body: string }>;
    supportTitle: string;
    supportParagraphs: string[];
  }
> = {
  en: {
    eyebrow: 'Contact Us',
    title: 'How to Reach OnWay Support',
    description:
      'OnWay is currently set up for lightweight support. This page explains the right contact path depending on the kind of issue you have.',
    cards: [
      {
        title: 'Trip or community issue',
        body: 'If your question is about a booking, a trip, a membership decision, or a local community rule, contact the organizer or admin of the community where the issue happened first. They usually have the context needed to help fastest.',
      },
      {
        title: 'Account or privacy request',
        body: 'If you need help with your account, profile data, or a privacy-related request, contact the team operating your OnWay deployment. In many pilots, this is the organization, school, workplace, or local community that invited you to use the app.',
      },
      {
        title: 'Safety concern',
        body: 'Use in-app blocking and reporting tools for product-related safety concerns. Do not use this page for emergencies or urgent real-world danger. If someone is at immediate risk, contact local emergency services right away.',
      },
    ],
    supportTitle: 'Current support model',
    supportParagraphs: [
      'OnWay does not offer live chat, phone support, or a built-in contact form yet. Support is intentionally lightweight at this stage so the product can stay simple while the core ride coordination flow matures.',
      'The organization running this deployment may publish additional support details here over time, but the contact paths above are the current official routes for help.',
    ],
  },
  ar: {
    eyebrow: 'اتصل بنا',
    title: 'كيفية الوصول إلى دعم بطريقك',
    description:
      'يعمل بطريقك حاليًا وفق نموذج دعم خفيف. توضح هذه الصفحة المسار المناسب للتواصل بحسب نوع المشكلة التي لديك.',
    cards: [
      {
        title: 'مشكلة في رحلة أو مجتمع',
        body: 'إذا كان سؤالك يتعلق بحجز أو رحلة أو قرار عضوية أو قاعدة محلية داخل المجتمع، فتواصل أولًا مع المنظم أو مشرف المجتمع الذي حدثت فيه المشكلة. غالبًا لديهم السياق الذي يساعد بشكل أسرع.',
      },
      {
        title: 'طلب متعلق بالحساب أو الخصوصية',
        body: 'إذا كنت تحتاج إلى مساعدة بشأن حسابك أو بيانات ملفك الشخصي أو طلب متعلق بالخصوصية، فتواصل مع الجهة التي تشغّل نسخة بطريقك الخاصة بك. في كثير من التجارب المبكرة تكون هذه الجهة هي المؤسسة أو المدرسة أو مكان العمل أو المجتمع المحلي الذي دعاك لاستخدام التطبيق.',
      },
      {
        title: 'مخاوف تتعلق بالسلامة',
        body: 'استخدم أدوات الحظر والإبلاغ داخل التطبيق عند وجود مخاوف تتعلق بالسلامة داخل المنتج. لا تستخدم هذه الصفحة للطوارئ أو للخطر الواقعي العاجل. إذا كان هناك شخص في خطر فوري، فاتصل بخدمات الطوارئ المحلية فورًا.',
      },
    ],
    supportTitle: 'نموذج الدعم الحالي',
    supportParagraphs: [
      'لا يوفّر بطريقك حاليًا دردشة مباشرة أو دعمًا هاتفيًا أو نموذج تواصل مدمجًا. تم الإبقاء على الدعم بسيطًا عمدًا في هذه المرحلة حتى يبقى المنتج واضحًا بينما يتطور تدفق تنسيق الرحلات الأساسي.',
      'قد تنشر الجهة التي تدير هذا النشر تفاصيل دعم إضافية هنا مع الوقت، لكن مسارات التواصل أعلاه هي القنوات الرسمية الحالية للمساعدة.',
    ],
  },
  he: {
    eyebrow: 'יצירת קשר',
    title: 'איך להגיע לתמיכה של בדרךך',
    description:
      'בדרךך פועלת כרגע עם מודל תמיכה קליל. העמוד הזה מסביר לאיזה ערוץ לפנות לפי סוג הבעיה שיש לכם.',
    cards: [
      {
        title: 'בעיה בנסיעה או בקהילה',
        body: 'אם השאלה שלכם קשורה להזמנה, לנסיעה, להחלטת חברות או לכלל מקומי של קהילה, פנו קודם למארגן או למנהל של הקהילה שבה הבעיה קרתה. בדרך כלל יש להם את ההקשר שיאפשר לעזור הכי מהר.',
      },
      {
        title: 'בקשה על חשבון או פרטיות',
        body: 'אם אתם צריכים עזרה עם החשבון, נתוני הפרופיל או בקשה שקשורה לפרטיות, פנו לצוות שמפעיל את פריסת בדרךך שלכם. בהרבה פיילוטים זהו הארגון, בית הספר, מקום העבודה או הקהילה המקומית שהזמינו אתכם להשתמש באפליקציה.',
      },
      {
        title: 'חשש בטיחותי',
        body: 'השתמשו בכלי החסימה והדיווח שבתוך האפליקציה עבור חששות בטיחותיים שקשורים למוצר. אל תשתמשו בעמוד הזה למצבי חירום או סכנה מיידית בעולם האמיתי. אם מישהו נמצא בסיכון מיידי, פנו מיד לשירותי החירום המקומיים.',
      },
    ],
    supportTitle: 'מודל התמיכה הנוכחי',
    supportParagraphs: [
      'בדרךך עדיין לא מציעה צ\'אט חי, תמיכה טלפונית או טופס יצירת קשר מובנה. התמיכה נשארת בכוונה קלה ופשוטה בשלב הזה כדי שהמוצר יישאר ממוקד בזמן שזרימת תיאום הנסיעות המרכזית מתבגרת.',
      'הארגון שמפעיל את הפריסה הזו עשוי לפרסם כאן בהמשך פרטי תמיכה נוספים, אבל מסלולי הפנייה שמופיעים למעלה הם ערוצי העזרה הרשמיים כרגע.',
    ],
  },
};

export default async function ContactPage() {
  const lang = await getServerLang();
  const copy = CONTACT_COPY[lang] ?? CONTACT_COPY.en;
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
      <div className="space-y-4">
        {copy.cards.map((card) => (
          <ContactCard key={card.title} title={card.title} body={card.body} />
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{copy.supportTitle}</h2>
        {copy.supportParagraphs.map((paragraph) => (
          <p key={paragraph} className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </section>
    </PublicInfoPage>
  );
}
