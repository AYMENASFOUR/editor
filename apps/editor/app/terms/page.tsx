import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerLocale } from '@/lib/locale'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Pascal Editor and the Pascal platform.',
}

type Section = { heading: string; paragraphs: string[]; list?: string[] }

const CONTENT: Record<'en' | 'ar', {
  nav: { home: string; terms: string; privacy: string }
  title: string
  effective: string
  contactEmail: string
  sections: Section[]
}> = {
  en: {
    nav: { home: 'Home', terms: 'Terms of Service', privacy: 'Privacy Policy' },
    title: 'Terms of Service',
    effective: 'Effective Date: February 20, 2026',
    contactEmail: 'support@pascal.app',
    sections: [
      {
        heading: '1. Introduction',
        paragraphs: [
          'Welcome to Pascal Editor ("Editor") and the Pascal platform at pascal.app ("Platform"), operated by Pascal Group Inc. ("we," "us," or "our"). By accessing or using our services, you agree to these Terms of Service.',
        ],
      },
      {
        heading: '2. The Editor and Platform',
        paragraphs: [
          'The Pascal Editor is open-source software released under the MIT License. You may use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Editor software in accordance with the MIT License terms.',
          'The Pascal platform (pascal.app) and its associated services, including user accounts, cloud storage, and project hosting, are proprietary services owned and operated by Pascal Group Inc. These Terms govern your use of the Platform.',
        ],
      },
      {
        heading: '3. Accounts and Authentication',
        paragraphs: [
          'To use certain features of the Platform, you must create an account. We use Google OAuth and magic link email authentication through Supabase. You are responsible for maintaining the security of your account credentials and for all activities that occur under your account.',
        ],
      },
      {
        heading: '4. Acceptable Use',
        paragraphs: ['You agree not to:'],
        list: [
          'Use the Platform for any unlawful purpose or in violation of any applicable laws',
          'Upload, share, or distribute content that infringes intellectual property rights',
          'Attempt to gain unauthorized access to the Platform or its systems',
          "Interfere with or disrupt the Platform's infrastructure",
          'Upload malicious code, viruses, or harmful content',
          'Harass, abuse, or harm other users',
          'Use the Platform to send spam or unsolicited communications',
        ],
      },
      {
        heading: '5. Your Content and Intellectual Property',
        paragraphs: [
          'You retain full ownership of all content, projects, and data you create or upload to the Platform ("Your Content"). By using the Platform, you grant us a limited license to store, display, and transmit Your Content solely to provide our services to you.',
          'We do not claim any ownership rights over Your Content. You may export or delete Your Content at any time.',
        ],
      },
      {
        heading: '6. Platform Ownership',
        paragraphs: [
          'The Platform, including its design, features, and proprietary code, is owned by Pascal Group Inc. and protected by intellectual property laws. While the Editor source code is open-source under the MIT License, the Platform services, branding, and infrastructure remain our proprietary property.',
        ],
      },
      {
        heading: '7. Account Termination',
        paragraphs: [
          'We reserve the right to suspend or terminate your account if you violate these Terms or engage in conduct that we determine is harmful to the Platform or other users. You may also delete your account at any time by contacting us.',
        ],
      },
      {
        heading: '8. Disclaimer of Warranties',
        paragraphs: [
          'THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
          'We do not warrant that the Platform will be uninterrupted, error-free, or free of harmful components.',
        ],
      },
      {
        heading: '9. Limitation of Liability',
        paragraphs: [
          'TO THE MAXIMUM EXTENT PERMITTED BY LAW, PASCAL GROUP INC. SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF DATA, PROFITS, OR GOODWILL, ARISING FROM YOUR USE OF THE PLATFORM.',
        ],
      },
      {
        heading: '10. Changes to Terms',
        paragraphs: [
          'We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms on the Platform. Your continued use of the Platform after changes are posted constitutes your acceptance of the revised Terms.',
        ],
      },
      {
        heading: '11. Contact Us',
        paragraphs: ['If you have questions about these Terms, please contact us at:'],
      },
    ],
  },
  ar: {
    nav: { home: 'الرئيسية', terms: 'شروط الخدمة', privacy: 'سياسة الخصوصية' },
    title: 'شروط الخدمة',
    effective: 'تاريخ السريان: ٢٠ فبراير ٢٠٢٦',
    contactEmail: 'support@pascal.app',
    sections: [
      {
        heading: '١. المقدمة',
        paragraphs: [
          'مرحباً بك في محرّر Pascal ("المحرّر") ومنصّة Pascal على pascal.app ("المنصّة")، اللذين تُشغّلهما شركة Pascal Group Inc. ("نحن" أو "لنا"). بوصولك إلى خدماتنا أو استخدامها، فإنك توافق على شروط الخدمة هذه.',
        ],
      },
      {
        heading: '٢. المحرّر والمنصّة',
        paragraphs: [
          'محرّر Pascal برمجية مفتوحة المصدر صادرة بموجب رخصة MIT. يجوز لك استخدام نسخ برمجية المحرّر ونسخها وتعديلها ودمجها ونشرها وتوزيعها ومنح تراخيص فرعية لها و/أو بيعها وفقاً لشروط رخصة MIT.',
          'أمّا منصّة Pascal (pascal.app) وخدماتها المرتبطة — بما فيها حسابات المستخدمين والتخزين السحابي واستضافة المشاريع — فهي خدمات مملوكة وتُشغّلها شركة Pascal Group Inc. وتحكم هذه الشروط استخدامك للمنصّة.',
        ],
      },
      {
        heading: '٣. الحسابات والمصادقة',
        paragraphs: [
          'لاستخدام بعض ميزات المنصّة، يجب إنشاء حساب. نستخدم مصادقة Google OAuth ورابط الدخول السحري عبر البريد من خلال Supabase. أنت مسؤول عن الحفاظ على أمان بيانات اعتماد حسابك وعن كل النشاطات التي تجري ضمن حسابك.',
        ],
      },
      {
        heading: '٤. الاستخدام المقبول',
        paragraphs: ['أنت توافق على ألّا:'],
        list: [
          'تستخدم المنصّة لأي غرض غير قانوني أو بما يخالف أي قوانين سارية',
          'ترفع أو تشارك أو توزّع محتوى ينتهك حقوق الملكية الفكرية',
          'تحاول الوصول غير المصرّح به إلى المنصّة أو أنظمتها',
          'تتدخّل في بنية المنصّة أو تعطّلها',
          'ترفع شيفرة خبيثة أو فيروسات أو محتوى ضارّاً',
          'تضايق مستخدمين آخرين أو تسيء إليهم أو تؤذيهم',
          'تستخدم المنصّة لإرسال رسائل مزعجة أو اتصالات غير مطلوبة',
        ],
      },
      {
        heading: '٥. محتواك والملكية الفكرية',
        paragraphs: [
          'تحتفظ بالملكية الكاملة لكل المحتوى والمشاريع والبيانات التي تنشئها أو ترفعها إلى المنصّة ("محتواك"). باستخدامك المنصّة، تمنحنا ترخيصاً محدوداً لتخزين محتواك وعرضه ونقله حصراً لتقديم خدماتنا لك.',
          'نحن لا ندّعي أي حقوق ملكية على محتواك. ويمكنك تصدير محتواك أو حذفه في أي وقت.',
        ],
      },
      {
        heading: '٦. ملكية المنصّة',
        paragraphs: [
          'المنصّة — بما في ذلك تصميمها وميزاتها وشيفرتها المملوكة — مملوكة لشركة Pascal Group Inc. ومحمية بقوانين الملكية الفكرية. ومع أنّ الشيفرة المصدرية للمحرّر مفتوحة المصدر بموجب رخصة MIT، تبقى خدمات المنصّة وعلامتها التجارية وبنيتها التحتية ملكيةً خاصة بنا.',
        ],
      },
      {
        heading: '٧. إنهاء الحساب',
        paragraphs: [
          'نحتفظ بالحق في تعليق حسابك أو إنهائه إذا انتهكت هذه الشروط أو مارست سلوكاً نرى أنه ضارّ بالمنصّة أو بالمستخدمين الآخرين. ويمكنك أيضاً حذف حسابك في أي وقت بالتواصل معنا.',
        ],
      },
      {
        heading: '٨. إخلاء المسؤولية عن الضمانات',
        paragraphs: [
          'تُقدَّم المنصّة "كما هي" و"حسب توفّرها" دون أي ضمانات من أي نوع، صريحة كانت أم ضمنية، بما في ذلك — على سبيل المثال لا الحصر — الضمانات الضمنية للرواج التجاري والملاءمة لغرض معيّن وعدم الانتهاك.',
          'نحن لا نضمن أن تكون المنصّة متواصلة دون انقطاع أو خالية من الأخطاء أو من المكوّنات الضارّة.',
        ],
      },
      {
        heading: '٩. حدود المسؤولية',
        paragraphs: [
          'إلى أقصى حدّ يسمح به القانون، لن تكون شركة Pascal Group Inc. مسؤولة عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية أو تأديبية، بما في ذلك فقدان البيانات أو الأرباح أو السمعة، الناشئة عن استخدامك المنصّة.',
        ],
      },
      {
        heading: '١٠. تغييرات الشروط',
        paragraphs: [
          'قد نحدّث هذه الشروط من وقت لآخر. وسنُعلمك بالتغييرات الجوهرية بنشر الشروط المحدَّثة على المنصّة. ويُعدّ استمرارك في استخدام المنصّة بعد نشر التغييرات قبولاً منك للشروط المعدَّلة.',
        ],
      },
      {
        heading: '١١. تواصل معنا',
        paragraphs: ['إذا كانت لديك أسئلة حول هذه الشروط، يُرجى التواصل معنا عبر:'],
      },
    ],
  },
}

export default async function TermsPage() {
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
            <span className="font-medium text-foreground">{c.nav.terms}</span>
            <span className="text-muted-foreground">|</span>
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="/privacy"
            >
              {c.nav.privacy}
            </Link>
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
              {section.paragraphs.map((paragraph) => (
                <p className="text-foreground/90 leading-relaxed" key={paragraph}>
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="list-disc space-y-2 ps-6 text-foreground/90">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {section.heading === c.sections.at(-1)?.heading && (
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
