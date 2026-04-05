'use client';

import Image from 'next/image';
import { getBrandDisplayName } from '@/lib/brand/config';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import type { Lang } from '@/lib/i18n/dictionaries';

type FounderCopy = {
  eyebrow: string;
  title: string;
  story: string[];
  nameNote: string;
  whyTitle: string;
  whyQuote: string;
  role: string;
  focus: string;
  tags: string[];
  cta: string;
  footnote: string;
};

const COPY: Record<Lang, FounderCopy> = {
  en: {
    eyebrow: 'About the founder',
    title: 'Built from a real problem people were already dealing with every day',
    story: [
      'Anas Akkari started OnWay after watching the same issue repeat itself around him: students and young people trying to coordinate rides between cities without a simple system that actually fit how local communities move.',
      'The existing options often felt too complicated, too unsafe, or too generic for the way people really organize travel in their own circles. OnWay was built to make that process feel simple, organized, and trustworthy from the start.',
    ],
    nameNote: 'The Arabic idea behind the brand, بطريقك, carries both the feeling of being on your way and the visual personality that can grow into a distinctive identity over time.',
    whyTitle: 'Why I built it',
    whyQuote: '"This was never just a startup concept. It came from a daily frustration: people already needed rides, but the process around finding them and organizing them was messy. I wanted to build something people could actually use without friction and trust without feeling out of place."',
    role: 'Founder, OnWay',
    focus: 'Focused on building a better way for real communities to coordinate shared travel between cities.',
    tags: ['Community-first', 'Simple coordination', 'Trust by design'],
    cta: 'Connect with me on LinkedIn',
    footnote: 'A founder story grounded in the product problem, not inflated claims.',
  },
  ar: {
    eyebrow: 'عن المؤسس',
    title: 'بدأت من مشكلة حقيقية كان الناس يعيشونها كل يوم',
    story: [
      'بدأ أنس العكاري هذا المشروع بعد أن رأى نفس المشكلة تتكرر حوله: طلاب وشباب يحاولون تنسيق رحلات بين المدن من دون نظام بسيط يناسب فعلاً طريقة حركة المجتمعات المحلية.',
      'الخيارات الموجودة كانت غالباً معقّدة أكثر من اللازم، أو غير مطمئنة، أو غير مناسبة لطريقة تنظيم الناس لرحلاتهم داخل دوائرهم. لذلك بُنيت بطريقك لتجعل العملية أبسط وأكثر ترتيباً وأكثر ثقة منذ البداية.',
    ],
    nameNote: 'فكرة الاسم بطريقك تحمل معنى الطريق والمسار، وفي الوقت نفسه تفتح باباً لهوية بصرية مميزة يمكن أن تكبر مع المنتج لاحقاً.',
    whyTitle: 'لماذا بنيته',
    whyQuote: '"لم تكن الفكرة مجرد مشروع ناشئ. كانت نابعة من مشكلة يومية: الناس يحتاجون إلى رحلات فعلاً، لكن طريقة البحث عنها وتنظيمها كانت فوضوية. أردت أن أبني شيئاً يمكن للناس استخدامه بسهولة ويثقوا به من دون أن يشعروا أنه غريب عنهم."',
    role: 'المؤسس، بطريقك',
    focus: 'أركّز على بناء طريقة أفضل لمجتمعات حقيقية تنسّق السفر المشترك بين المدن.',
    tags: ['مجتمعي أولاً', 'تنسيق أبسط', 'ثقة من التصميم'],
    cta: 'تواصل معي على لينكدإن',
    footnote: 'قصة مؤسس مرتبطة بمشكلة المنتج الحقيقية، لا بادعاءات مبالغ فيها.',
  },
  he: {
    eyebrow: 'על המייסד',
    title: 'נבנה מתוך בעיה אמיתית שאנשים כבר חיו איתה כל יום',
    story: [
      'אנאס אכארי התחיל את הפרויקט אחרי שראה שוב ושוב את אותה בעיה: סטודנטים וצעירים שמנסים לתאם נסיעות בין ערים בלי מערכת פשוטה שבאמת מתאימה לאופן שבו קהילות מקומיות זזות ומתארגנות.',
      'הפתרונות הקיימים הרגישו לעיתים קרובות מסובכים מדי, לא בטוחים מספיק, או פשוט לא מותאמים לאופן שבו אנשים מתאמים נסיעות בתוך המעגלים שלהם. לכן OnWay נבנתה כדי להפוך את התהליך לפשוט, מסודר ואמין יותר מההתחלה.',
    ],
    nameNote: 'הרעיון הערבי שמאחורי המותג, بطريقك, מחזיק גם את תחושת הדרך והמסלול וגם פוטנציאל לזהות חזותית ייחודית שיכולה להתפתח עם הזמן.',
    whyTitle: 'למה בניתי את זה',
    whyQuote: '"זו אף פעם לא הייתה רק מחשבת סטארטאפ. זה בא מתוך תסכול יומיומי: אנשים באמת היו צריכים נסיעות, אבל הדרך למצוא אותן ולארגן אותן הייתה מבולגנת. רציתי לבנות משהו שאנשים באמת ישתמשו בו בלי חיכוך ויוכלו לסמוך עליו בלי להרגיש שהוא לא נבנה בשבילם."',
    role: 'המייסד, OnWay',
    focus: 'ממוקד בבניית דרך טובה יותר לקהילות אמיתיות לתאם נסיעות משותפות בין ערים.',
    tags: ['קהילה תחילה', 'תיאום פשוט', 'אמון בעיצוב'],
    cta: 'התחברו אליי בלינקדאין',
    footnote: 'סיפור מייסד שמבוסס על בעיית המוצר האמיתית, לא על הישגים מומצאים.',
  },
};

export default function FounderStorySection() {
  const { lang } = useTranslation();
  const copy = COPY[lang];
  const brandName = getBrandDisplayName(lang);

  return (
    <section className="py-20 px-4 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-[32px] border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 shadow-sm overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="p-8 sm:p-10 lg:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-600 dark:text-sky-400 mb-4">
                {copy.eyebrow}
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-2xl">
                {copy.title}
              </h2>
              <div className="mt-6 space-y-4 max-w-3xl">
                {copy.story.map((paragraph) => (
                  <p key={paragraph} className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
              <p className="mt-4 text-sm sm:text-base text-sky-700 dark:text-sky-300 font-medium max-w-3xl">
                {copy.nameNote}
              </p>

              <div className="mt-8 rounded-2xl border border-sky-100 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-400 mb-2">
                  {copy.whyTitle}
                </p>
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                  {copy.whyQuote}
                </p>
              </div>
            </div>

            <div className="border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-200 dark:bg-slate-800">
                <Image
                  src="/brand/founder-anas.jpeg"
                  alt="Anas Akkari"
                  width={720}
                  height={960}
                  priority
                  className="h-[340px] w-full object-cover object-top"
                />
              </div>

              <p className="mt-5 text-xl font-bold text-slate-900 dark:text-white">Anas Akkari</p>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                {copy.role}
              </p>
              <p className="mt-5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {copy.focus}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {copy.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <a
                href="https://www.linkedin.com/in/anas-akkari-ba684b369"
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex w-fit items-center gap-2 rounded-2xl bg-sky-600 dark:bg-sky-500 px-5 py-3 text-sm font-bold text-white hover:bg-sky-700 dark:hover:bg-sky-600 transition-colors btn-press shadow-sm"
              >
                {copy.cta}
                <span aria-hidden="true">↗</span>
              </a>

              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {copy.footnote.replace('OnWay', brandName)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
