import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerLocale } from '@/lib/locale'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Pascal Editor and the Pascal platform.',
}

type Block =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
type Section = { heading: string; blocks: Block[]; contact?: boolean }

const CONTENT: Record<'en' | 'ar', {
  nav: { home: string; terms: string; privacy: string }
  title: string
  effective: string
  contactEmail: string
  sections: Section[]
}> = {
  en: {
    nav: { home: 'Home', terms: 'Terms of Service', privacy: 'Privacy Policy' },
    title: 'Privacy Policy',
    effective: 'Effective Date: February 20, 2026',
    contactEmail: 'support@pascal.app',
    sections: [
      {
        heading: '1. Introduction',
        blocks: [
          {
            type: 'p',
            text: 'Pascal Group Inc. ("we," "us," or "our") operates the Pascal Editor and Platform at pascal.app. This Privacy Policy explains how we collect, use, and protect your information when you use our services.',
          },
        ],
      },
      {
        heading: '2. Information We Collect',
        blocks: [
          { type: 'h3', text: 'Account Information' },
          { type: 'p', text: 'When you create an account, we collect:' },
          {
            type: 'ul',
            items: [
              'Email address',
              'Name',
              'Profile picture/avatar',
              'OAuth provider data (from Google when you sign in with Google)',
            ],
          },
          { type: 'h3', text: 'Project Data' },
          {
            type: 'p',
            text: 'When you use the Platform, we store your projects, including 3D building designs, floor plans, and associated metadata.',
          },
          { type: 'h3', text: 'Usage Analytics' },
          {
            type: 'p',
            text: 'We use Vercel Analytics and Speed Insights to collect anonymized usage data, including page views, performance metrics, and general usage patterns. This helps us improve the Platform.',
          },
        ],
      },
      {
        heading: '3. How We Use Your Information',
        blocks: [
          { type: 'p', text: 'We use your information to:' },
          {
            type: 'ul',
            items: [
              'Provide and maintain your account',
              'Store and sync your projects across devices',
              'Improve our services based on usage patterns',
              'Send optional email notifications about new features and updates (you can opt out in settings)',
              'Respond to support requests',
              'Ensure platform security and prevent abuse',
            ],
          },
        ],
      },
      {
        heading: '4. Data Storage',
        blocks: [
          {
            type: 'p',
            text: 'Your data is stored using Supabase (PostgreSQL database) on secure cloud infrastructure. We implement appropriate technical and organizational measures to protect your data.',
          },
        ],
      },
      {
        heading: '5. Third-Party Services',
        blocks: [
          { type: 'p', text: 'We use the following third-party services to operate the Platform:' },
          {
            type: 'ul',
            items: [
              'Google — OAuth authentication for sign-in',
              'Vercel — Application hosting, analytics, and performance monitoring',
              'Supabase — Database hosting and authentication infrastructure',
            ],
          },
          {
            type: 'p',
            text: 'Each of these services has their own privacy policies governing their handling of your data.',
          },
        ],
      },
      {
        heading: '6. Cookies',
        blocks: [
          { type: 'p', text: 'We use minimal cookies necessary for the Platform to function:' },
          {
            type: 'ul',
            items: [
              'Session cookies — Essential for authentication and keeping you signed in',
              'Analytics cookies — Used by Vercel Analytics to collect anonymized usage data',
            ],
          },
        ],
      },
      {
        heading: '7. Your Rights',
        blocks: [
          { type: 'p', text: 'You have the right to:' },
          {
            type: 'ul',
            items: [
              'Access the personal data we hold about you',
              'Request correction of inaccurate data',
              'Request deletion of your data',
              'Export your project data',
              'Opt out of marketing communications',
            ],
          },
          { type: 'p', text: 'To exercise any of these rights, please contact us at:' },
        ],
        contact: true,
      },
      {
        heading: '8. Data Retention',
        blocks: [
          {
            type: 'p',
            text: 'We retain your data for as long as your account is active. If you delete your account, we will delete your personal data and project data within 30 days, except where we are required by law to retain certain information.',
          },
        ],
      },
      {
        heading: "9. Children's Privacy",
        blocks: [
          {
            type: 'p',
            text: 'The Platform is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.',
          },
        ],
      },
      {
        heading: '10. Changes to This Policy',
        blocks: [
          {
            type: 'p',
            text: 'We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on the Platform. Your continued use of the Platform after changes are posted constitutes your acceptance of the revised policy.',
          },
        ],
      },
      {
        heading: '11. Contact Us',
        blocks: [
          {
            type: 'p',
            text: 'If you have questions about this Privacy Policy or how we handle your data, please contact us at:',
          },
        ],
        contact: true,
      },
    ],
  },
  ar: {
    nav: { home: 'الرئيسية', terms: 'شروط الخدمة', privacy: 'سياسة الخصوصية' },
    title: 'سياسة الخصوصية',
    effective: 'تاريخ السريان: ٢٠ فبراير ٢٠٢٦',
    contactEmail: 'support@pascal.app',
    sections: [
      {
        heading: '١. المقدمة',
        blocks: [
          {
            type: 'p',
            text: 'تُشغّل شركة Pascal Group Inc. ("نحن" أو "لنا") محرّر ومنصّة Pascal على pascal.app. توضّح سياسة الخصوصية هذه كيف نجمع معلوماتك ونستخدمها ونحميها عند استخدامك خدماتنا.',
          },
        ],
      },
      {
        heading: '٢. المعلومات التي نجمعها',
        blocks: [
          { type: 'h3', text: 'معلومات الحساب' },
          { type: 'p', text: 'عند إنشاء حساب، نجمع:' },
          {
            type: 'ul',
            items: [
              'عنوان البريد الإلكتروني',
              'الاسم',
              'صورة الملف الشخصي',
              'بيانات مزوّد OAuth (من Google عند تسجيل الدخول بحساب Google)',
            ],
          },
          { type: 'h3', text: 'بيانات المشاريع' },
          {
            type: 'p',
            text: 'عند استخدامك المنصّة، نخزّن مشاريعك بما فيها تصاميم المباني ثلاثية الأبعاد والمخططات الأفقية والبيانات الوصفية المرتبطة بها.',
          },
          { type: 'h3', text: 'تحليلات الاستخدام' },
          {
            type: 'p',
            text: 'نستخدم Vercel Analytics و Speed Insights لجمع بيانات استخدام مجهولة الهوية، بما في ذلك مشاهدات الصفحات ومقاييس الأداء وأنماط الاستخدام العامة. يساعدنا هذا على تحسين المنصّة.',
          },
        ],
      },
      {
        heading: '٣. كيف نستخدم معلوماتك',
        blocks: [
          { type: 'p', text: 'نستخدم معلوماتك من أجل:' },
          {
            type: 'ul',
            items: [
              'توفير حسابك وصيانته',
              'تخزين مشاريعك ومزامنتها عبر أجهزتك',
              'تحسين خدماتنا بناءً على أنماط الاستخدام',
              'إرسال إشعارات بريدية اختيارية عن الميزات والتحديثات الجديدة (يمكنك إلغاء الاشتراك من الإعدادات)',
              'الرد على طلبات الدعم',
              'ضمان أمان المنصّة ومنع إساءة الاستخدام',
            ],
          },
        ],
      },
      {
        heading: '٤. تخزين البيانات',
        blocks: [
          {
            type: 'p',
            text: 'تُخزَّن بياناتك باستخدام Supabase (قاعدة بيانات PostgreSQL) على بنية تحتية سحابية آمنة. ونطبّق تدابير تقنية وتنظيمية مناسبة لحماية بياناتك.',
          },
        ],
      },
      {
        heading: '٥. خدمات الأطراف الثالثة',
        blocks: [
          { type: 'p', text: 'نستخدم خدمات الأطراف الثالثة التالية لتشغيل المنصّة:' },
          {
            type: 'ul',
            items: [
              'Google — مصادقة OAuth لتسجيل الدخول',
              'Vercel — استضافة التطبيق والتحليلات ومراقبة الأداء',
              'Supabase — استضافة قاعدة البيانات وبنية المصادقة',
            ],
          },
          {
            type: 'p',
            text: 'لكل خدمة من هذه الخدمات سياسة خصوصية خاصة بها تحكم تعاملها مع بياناتك.',
          },
        ],
      },
      {
        heading: '٦. ملفات تعريف الارتباط',
        blocks: [
          { type: 'p', text: 'نستخدم أقل قدر من ملفات تعريف الارتباط اللازمة لعمل المنصّة:' },
          {
            type: 'ul',
            items: [
              'ملفات الجلسة — أساسية للمصادقة وإبقائك مسجَّل الدخول',
              'ملفات التحليلات — يستخدمها Vercel Analytics لجمع بيانات استخدام مجهولة الهوية',
            ],
          },
        ],
      },
      {
        heading: '٧. حقوقك',
        blocks: [
          { type: 'p', text: 'يحقّ لك:' },
          {
            type: 'ul',
            items: [
              'الوصول إلى بياناتك الشخصية التي نحتفظ بها',
              'طلب تصحيح البيانات غير الدقيقة',
              'طلب حذف بياناتك',
              'تصدير بيانات مشاريعك',
              'إلغاء الاشتراك في الرسائل التسويقية',
            ],
          },
          { type: 'p', text: 'لممارسة أي من هذه الحقوق، يُرجى التواصل معنا عبر:' },
        ],
        contact: true,
      },
      {
        heading: '٨. الاحتفاظ بالبيانات',
        blocks: [
          {
            type: 'p',
            text: 'نحتفظ ببياناتك ما دام حسابك نشطاً. وإذا حذفت حسابك، فسنحذف بياناتك الشخصية وبيانات مشاريعك خلال ٣٠ يوماً، إلّا في الحالات التي يُلزمنا فيها القانون بالاحتفاظ ببعض المعلومات.',
          },
        ],
      },
      {
        heading: '٩. خصوصية الأطفال',
        blocks: [
          {
            type: 'p',
            text: 'المنصّة غير مخصّصة للأطفال دون سنّ ١٣. ولا نجمع عن قصد معلومات شخصية من الأطفال دون ١٣. وإذا كنت تعتقد أننا جمعنا مثل هذه المعلومات، يُرجى التواصل معنا فوراً.',
          },
        ],
      },
      {
        heading: '١٠. تغييرات هذه السياسة',
        blocks: [
          {
            type: 'p',
            text: 'قد نحدّث سياسة الخصوصية هذه من وقت لآخر. وسنُعلمك بالتغييرات الجوهرية بنشر السياسة المحدَّثة على المنصّة. ويُعدّ استمرارك في استخدام المنصّة بعد نشر التغييرات قبولاً منك للسياسة المعدَّلة.',
          },
        ],
      },
      {
        heading: '١١. تواصل معنا',
        blocks: [
          {
            type: 'p',
            text: 'إذا كانت لديك أسئلة حول سياسة الخصوصية هذه أو حول كيفية تعاملنا مع بياناتك، يُرجى التواصل معنا عبر:',
          },
        ],
        contact: true,
      },
    ],
  },
}

export default async function PrivacyPage() {
  const locale = await getServerLocale()
  const c = CONTENT[locale] ?? CONTENT.en

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-border border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center gap-4 text-sm">
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="/"
            >
              {c.nav.home}
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="/terms"
            >
              {c.nav.terms}
            </Link>
            <span className="text-muted-foreground">|</span>
            <span className="font-medium text-foreground">{c.nav.privacy}</span>
          </nav>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-6 py-12">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="mb-2 font-bold text-3xl">{c.title}</h1>
          <p className="mb-8 text-muted-foreground text-sm">{c.effective}</p>

          {c.sections.map((section, index) => (
            <section
              className={index === c.sections.length - 1 ? 'space-y-4' : 'mb-8 space-y-4'}
              key={section.heading}
            >
              <h2 className="font-semibold text-xl">{section.heading}</h2>
              {section.blocks.map((block, i) => {
                if (block.type === 'h3') {
                  return (
                    <h3 className="mt-4 font-medium text-lg" key={`h3-${i}`}>
                      {block.text}
                    </h3>
                  )
                }
                if (block.type === 'ul') {
                  return (
                    <ul className="list-disc space-y-2 ps-6 text-foreground/90" key={`ul-${i}`}>
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )
                }
                return (
                  <p className="text-foreground/90 leading-relaxed" key={`p-${i}`}>
                    {block.text}
                  </p>
                )
              })}
              {section.contact && (
                <a
                  className="text-foreground underline hover:text-foreground/80"
                  href={`mailto:${c.contactEmail}`}
                >
                  {c.contactEmail}
                </a>
              )}
            </section>
          ))}
        </article>
      </main>
    </div>
  )
}
