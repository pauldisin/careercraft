import React from 'react';
import { useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { blogPosts, Post } from '../data/blogPosts';
import Markdown from 'react-markdown';
import { ArrowLeft, Calendar, BookOpen, Clock } from 'lucide-react';

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const postId = searchParams.get('id');
  const selectedPost = blogPosts.find(p => p.id === postId) || null;

  const setSelectedPost = (post: Post | null) => {
    if (post) {
      setSearchParams({ id: post.id });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-slate-950 py-24 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <SEO 
        title={selectedPost ? `${selectedPost.title} | CareerCraft Blog` : "CareerCraft Blog | Latest Resume Writing & Career Tips"} 
        description={selectedPost ? selectedPost.excerpt : "Expert career guidelines, template spotlights, and the latest on Yewo AI tool integrations from CareerCraft."} 
        schemaMarkup={
          selectedPost 
            ? {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "headline": selectedPost.title,
                "description": selectedPost.excerpt,
                "datePublished": selectedPost.date,
                "author": {
                  "@type": "Organization",
                  "name": "CareerCraft"
                },
                "publisher": {
                  "@type": "Organization",
                  "name": "CareerCraft"
                },
                "mainEntityOfPage": {
                  "@type": "WebPage",
                  "@id": typeof window !== "undefined" ? window.location.href : ""
                }
              }
            : {
                "@context": "https://schema.org",
                "@type": "Blog",
                "name": "CareerCraft Blog",
                "description": "Expert career guidelines, template spotlights, and the latest on Yewo AI tool integrations from CareerCraft.",
                "publisher": {
                  "@type": "Organization",
                  "name": "CareerCraft"
                },
                "blogPost": blogPosts.map(post => ({
                  "@type": "BlogPosting",
                  "headline": post.title,
                  "description": post.excerpt,
                  "datePublished": post.date
                }))
              }
        }
      />
      
      <div className="max-w-4xl mx-auto">
        {!selectedPost ? (
          <div>
            <div className="text-center mb-16">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 mb-3 block">Insights & Updates</span>
              <h1 className="font-serif text-5xl md:text-6xl text-slate-900 dark:text-white">CareerCraft Blog</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-xl mx-auto text-sm">Expert career guidelines, template spotlights, and the latest on Yewo AI.</p>
            </div>

            <div className="grid gap-8">
              {blogPosts.map((post) => (
                <article 
                  key={post.id} 
                  className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-150 dark:border-slate-800/80 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 mb-4">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 3 min read</span>
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-350 text-sm mb-6 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <button 
                    onClick={() => setSelectedPost(post)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:gap-3 transition-all cursor-pointer"
                  >
                    <span>Read full article</span>
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
              <ArrowLeft className="w-4 h-4" /> Back to blog directory
            </button>

            <header className="mb-8 border-b border-slate-100 dark:border-slate-800/60 pb-8">
              <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 mb-4">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {selectedPost.date}</span>
                <span>•</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Career Insights</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl text-slate-900 dark:text-white leading-tight">
                {selectedPost.title}
              </h1>
            </header>

            <div className="markdown-body text-slate-700 dark:text-slate-350 text-sm sm:text-base leading-relaxed space-y-6">
              <Markdown>{selectedPost.content}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
