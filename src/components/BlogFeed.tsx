import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Search } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  date: string;
  status: 'draft' | 'published';
  category?: string;
}

const CATEGORIES = ['All', 'Auditing', 'Tax', 'Compliance', 'General'];

export function BlogFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const saved = localStorage.getItem('audit-this-doc-cms-articles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Article[];
        // Filter only published articles
        const published = parsed.filter(a => a.status !== 'draft');
        setArticles(published);
      } catch (e) {
        console.error('Failed to parse articles');
      }
    }
  }, []);

  if (articles.length === 0) {
    return null; // Don't show the section if there are no published articles
  }

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          article.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || (article.category || 'General') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <section id="resources" className="py-24 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-purple/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      
      <div className="max-w-[1400px] mx-auto px-4 lg:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-purple/10 text-brand-purple font-semibold text-sm mb-6">
            <BookOpen className="w-4 h-4" />
            Resources & Insights
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-brand-navy mb-6 tracking-tight">
            Latest from our blog
          </h2>
          <p className="text-lg text-brand-navy/70 mb-8">
            Discover the latest strategies, updates, and insights on forensic auditing and AI.
          </p>

          <div className="relative max-w-md mx-auto mb-8">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-[#94A3B8]" />
            </div>
            <input
              type="text"
              placeholder="Search articles by keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all text-[#1E293B]"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category 
                    ? 'bg-[#7C3AED] text-white shadow-md' 
                    : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="popLayout">
          {filteredArticles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16 text-[#64748B]"
            >
              No articles found matching "{searchQuery}"
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredArticles.map((article, index) => (
                <motion.div
                  layout
                  key={article.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="group bg-white rounded-3xl p-8 border border-brand-purple/10 shadow-sm hover:shadow-xl hover:border-brand-purple/30 transition-all cursor-pointer flex flex-col h-full"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="px-3 py-1 bg-[#F1F5F9] text-[#475569] rounded-full text-xs font-semibold border border-[#E2E8F0]">
                      {article.category || 'General'}
                    </span>
                    <div className="text-sm font-medium text-[#94A3B8]">
                      {new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-brand-navy mb-4 group-hover:text-brand-purple transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-brand-navy/70 line-clamp-3 mb-8 flex-1">
                    {article.content}
                  </p>
                  <div className="flex items-center gap-2 text-brand-purple font-semibold text-sm group-hover:gap-3 transition-all mt-auto">
                    Read Article <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
