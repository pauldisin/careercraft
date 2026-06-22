export interface AdvicePost {
  id: string;
  title: string;
  excerpt: string;
  category: 'Resume' | 'Interview' | 'Career Growth';
  content: string;
}

export const careerAdvicePosts: AdvicePost[] = [
  {
    id: 'acing-the-interview',
    title: 'Acing the Virtual Interview',
    excerpt: 'Mastering the technical and interpersonal aspects of online interviews.',
    category: 'Interview',
    content: 'Virtual interviews present unique challenges...'
  },
  {
    id: 'negotiating-salary',
    title: 'How to Negotiate Your Salary Effectively',
    excerpt: 'A step-by-step guide to advocating for the compensation you deserve.',
    category: 'Career Growth',
    content: 'Salary negotiation is often the most stressful part of the hiring process...'
  },
  {
    id: 'resume-keywords',
    title: 'Using Keywords to Beat the ATS',
    excerpt: 'Understand how Applicant Tracking Systems work and optimize your resume.',
    category: 'Resume',
    content: 'Many companies use software to scan resumes for keywords...'
  }
];
