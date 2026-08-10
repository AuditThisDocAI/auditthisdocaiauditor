import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, ChevronLeft, Save, Lock } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  date: string;
  status: 'draft' | 'published';
  category: string;
}

export function CMS() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('audit-this-doc-cms-articles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // add status to legacy items
        setArticles(parsed.map((a: any) => ({ ...a, status: a.status || 'published', category: a.category || 'General' })));
      } catch (e) {
        console.error('Failed to parse articles');
      }
    } else {
      // Seed with some initial data
      const initialData: Article[] = [
        {
          id: '1',
          title: 'How AI is Transforming Forensic Auditing',
          content: 'Artificial intelligence is fundamentally changing how auditors approach forensic accounting. By leveraging machine learning models to analyze thousands of documents per second, we can identify anomalies and patterns that human auditors might miss...',
          date: new Date().toISOString(),
          status: 'published',
          category: 'Auditing'
        },
        {
          id: '2',
          title: 'Understanding the Fraud Risk Score',
          content: 'Our proprietary Fraud Risk Score evaluates transactions against over 500 risk indicators. This includes checking for duplicate invoices, mismatched vendor details, and unusual transaction timing. A higher score means more scrutiny is required...',
          date: new Date().toISOString(),
          status: 'published',
          category: 'Compliance'
        }
      ];
      setArticles(initialData);
      localStorage.setItem('audit-this-doc-cms-articles', JSON.stringify(initialData));
    }
  }, []);

  const saveArticles = (newArticles: Article[]) => {
    setArticles(newArticles);
    localStorage.setItem('audit-this-doc-cms-articles', JSON.stringify(newArticles));
  };

  const handleCreate = () => {
    setCurrentArticle({ id: '', title: '', content: '', date: '', status: 'draft', category: 'General' });
    setView('editor');
  };

  const handleEdit = (article: Article) => {
    setCurrentArticle(article);
    setView('editor');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      const updated = articles.filter(a => a.id !== id);
      saveArticles(updated);
    }
  };

  const handleSave = (status: 'draft' | 'published') => {
    if (!currentArticle) return;
    
    if (!currentArticle.title.trim() || !currentArticle.content.trim()) {
      alert('Title and content are required.');
      return;
    }

    let updated: Article[];
    if (currentArticle.id) {
      updated = articles.map(a => a.id === currentArticle.id ? { ...currentArticle, status } : a);
    } else {
      updated = [{
        ...currentArticle,
        id: Math.random().toString(36).substring(2, 9),
        date: new Date().toISOString(),
        status
      }, ...articles];
    }
    
    saveArticles(updated);
    setView('list');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 lg:py-20 min-h-[80vh]">
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0]">
              <div>
                <h2 className="text-2xl font-bold text-[#1E293B]">Content Management</h2>
                <p className="text-[#64748B] text-sm mt-1">Manage your help articles, blog posts, and resources.</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }));
                  }}
                  className="bg-white border border-[#E2E8F0] hover:bg-[#F8F9FC] text-[#1E293B] px-5 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center shrink-0"
                >
                  Back to Portal
                </button>
                <button
                  onClick={handleCreate}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 shrink-0 flex-1 sm:flex-initial justify-center"
                >
                  <Plus className="w-4 h-4" />
                  New Article
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {articles.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#CBD5E1]">
                  <p className="text-[#64748B]">No articles found. Create your first one!</p>
                </div>
              ) : (
                articles.map(article => (
                  <div key={article.id} className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-[#1E293B] text-lg truncate">{article.title}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          article.status === 'published' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {article.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                          {article.category}
                        </span>
                      </div>
                      <p className="text-[#64748B] text-sm mt-1 line-clamp-1">{article.content}</p>
                      <p className="text-xs text-[#94A3B8] mt-3 font-medium">
                        {new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(article)}
                        className="p-2 text-[#64748B] hover:text-[#7C3AED] hover:bg-[#7C3AED]/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="p-2 text-[#64748B] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden"
          >
            <div className="border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between bg-[#F8F9FC]">
              <button
                onClick={() => setView('list')}
                className="flex items-center gap-2 text-[#64748B] hover:text-[#1E293B] font-medium transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back to Articles
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSave('draft')}
                  className="bg-white border border-[#E2E8F0] hover:bg-[#F8F9FC] text-[#1E293B] px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </button>
                <button
                  onClick={() => handleSave('published')}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Publish
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-bold text-[#1E293B] mb-2">Article Title</label>
                <input
                  id="title"
                  type="text"
                  value={currentArticle?.title || ''}
                  onChange={(e) => setCurrentArticle(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="e.g., The Future of AI in Accounting"
                  className="w-full px-4 py-3 bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all font-medium text-[#1E293B]"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-bold text-[#1E293B] mb-2">Category</label>
                <select
                  id="category"
                  value={currentArticle?.category || 'General'}
                  onChange={(e) => setCurrentArticle(prev => prev ? { ...prev, category: e.target.value } : null)}
                  className="w-full px-4 py-3 bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all font-medium text-[#1E293B] appearance-none"
                >
                  <option value="Auditing">Auditing</option>
                  <option value="Tax">Tax</option>
                  <option value="Compliance">Compliance</option>
                  <option value="General">General</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="content" className="block text-sm font-bold text-[#1E293B] mb-2">Content</label>
                <textarea
                  id="content"
                  value={currentArticle?.content || ''}
                  onChange={(e) => setCurrentArticle(prev => prev ? { ...prev, content: e.target.value } : null)}
                  placeholder="Write your article content here..."
                  className="w-full h-80 px-4 py-3 bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all text-[#1E293B] resize-y"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
