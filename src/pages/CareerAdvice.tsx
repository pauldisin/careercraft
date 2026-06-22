import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import SEO from '../components/SEO';
import { careerAdvicePosts, AdvicePost } from '../data/careerAdvicePosts';

export default function CareerAdvice() {
  const [searchParams, setSearchParams] = useSearchParams();
  const postId = searchParams.get('id');
  const selectedPost = careerAdvicePosts.find(p => p.id === postId) || null;

  const setSelectedPost = (post: AdvicePost | null) => {
    if (post) {
      setSearchParams({ id: post.id });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-slate-950 py-24 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <SEO 
        title={selectedPost ? `${selectedPost.title} | Career Advice - CareerCraft` : "Expert Career Advice & Strategy Guides | CareerCraft"} 
        description={selectedPost ? selectedPost.excerpt : "Step-by-step guides for preparing virtual interviews, salary negotiations, and conquering the Applicant Tracking System algorithms."} 
      />
      <div className="max-w-4xl mx-auto font-sans">
        {!selectedPost ? (
          <div>
            <div className="text-center mb-16">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 mb-3 block">Expert Advice</span>
              <h1 className="font-serif text-5xl md:text-6xl text-slate-900 dark:text-white">Career Advice & Strategies</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-xl mx-auto text-sm">Professional strategies to master matching workflows, salaries, and interviewing.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {careerAdvicePosts.map((post) => (
                <article key={post.id} className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-150 dark:border-slate-800/80 hover:shadow-md transition-all group flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2 block">{post.category}</span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{post.title}</h2>
                    <p className="text-slate-705 dark:text-slate-350 text-sm mb-6 leading-relaxed">{post.excerpt}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedPost(post)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:gap-3 transition-all cursor-pointer text-left self-start"
                  >
                    <span>Read advisory guide</span>
                    <span className="text-lg">→</span>
                  </button>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-150 dark:border-slate-800/85 shadow-lg">
            <button 
              onClick={() => setSelectedPost(null)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white mb-10 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to advisory directory
            </button>

            <header className="mb-8 border-b border-slate-100 dark:border-slate-800/60 pb-8">
              <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 mb-4">
                <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {selectedPost.category} Guidance</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl text-slate-900 dark:text-white leading-tight">
                {selectedPost.title}
              </h1>
            </header>

            <div className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed space-y-6 whitespace-pre-line font-medium">
              {selectedPost.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
