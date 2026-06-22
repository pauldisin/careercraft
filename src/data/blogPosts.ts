export interface Post {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  content: string;
}

export const blogPosts: Post[] = [
  {
    id: 'introducing-yewo-ai',
    title: "Unveiling Yewo: CareerCraft's Dedicated AI Career Assistant",
    excerpt: "Discover how Yewo, our customized AI co-pilot, is helping professionals secure high interview response rates with tailored, ATS-ready resumes.",
    date: '2026-05-31',
    content: `In today’s competitive job market, generic AI applications are no longer enough to secure invitations to key interviews. Automated Tracking Systems (ATS) filter out nearly 75% of submissions before they ever land on a recruiter's desk.

To resolve this challenge, CareerCraft is proud to announce the next generation of professional career coaching: **Yewo AI Chatbot**.

## Who is Yewo?

Yewo (named after the warm expression of career support and cooperation) is a sophisticated, custom-trained AI career expert residing right inside your CareerCraft panel. Unlike general models that offer generic, non-specific summaries, Yewo is trained specifically on modern regional recruitment metrics, high-impact phrasing style sheets, and modern resume accessibility guidelines.

### How Yewo Optimizes Your Career Journey:

*   **⚡ Direct Account Activation Support**: Ask Yewo on how to easily lock in your premium features. She can outline our BSP Business Direct Deposits and Wantok Wallet numbers, giving you exact guidance in seconds.
*   **🛠️ High-Impact Phrase Tuning**: Instantly translate list items into metrics-focused achievements. Yewo converts passive text like "responsible for fleet monitoring" into "Controlled transportation metrics for over 40+ regional highways, optimizing response times by 22%."
*   **📋 Context-Aware Cover Letters**: Generate clean opening pitches aligning with the exact requirements of your target job description.

## Real Stories from Yewo Members

> "I submitted my CV to mining companies for 6 months without any luck. Yewo helped me adopt the ATS-alternate Professional template and restructured my achievements. Within 10 days, I scored a call back!"
> — **Gideon K., Logistics Supervisor**

Ready to optimize your professional story? Yewo is fully operational and waiting to co-pilot your next steps. Simply click the chat widget on the bottom-right of your screen from any logged-in page.`
  },
  {
    id: 'future-of-work',
    title: 'The Future of Work: Trends for 2026',
    excerpt: 'How AI and hybrid work are reshaping the professional landscape.',
    date: '2026-04-15',
    content: 'The landscape of professional work is evolving rapidly. ...'
  },
  {
    id: 'resume-mistakes',
    title: '5 Resume Mistakes That Could Cost You the Job',
    excerpt: 'Avoid these common resume pitfalls to stand out in a competitive market.',
    date: '2026-04-01',
    content: 'Your resume is often the first, and sometimes only, impression you give a recruiter...'
  },
  {
    id: 'networking-digitally',
    title: 'Effective Networking in the Digital Age',
    excerpt: 'Tips to build meaningful professional relationships without meeting in person.',
    date: '2026-03-20',
    content: 'Networking has moved online, but the fundamentals of relationship building remain...'
  }
];
