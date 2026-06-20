import React, { useState, useEffect } from 'react';
import { educationAPI } from '../services/api';
import { BookOpen, Search, Bookmark, Eye, Clock, BookmarkCheck, X, Sparkles } from 'lucide-react';

const Education = () => {
  const [articles, setArticles] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [activeArticle, setActiveArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [viewMode, setViewMode] = useState('all'); // all or bookmarked
  const [pointsReward, setPointsReward] = useState(false);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category !== 'all') params.category = category;
      if (search) params.search = search;
      
      const res = await educationAPI.getAll(params);
      if (res.data.success) {
        setArticles(res.data.data);
      }
    } catch (err) {
      console.error('Error loading articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const res = await educationAPI.getBookmarks();
      if (res.data.success) {
        setBookmarks(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [category, search]);

  useEffect(() => {
    fetchBookmarks();
  }, [viewMode]);

  const handleToggleBookmark = async (e, id) => {
    e.stopPropagation(); // Avoid opening the article modal
    try {
      const res = await educationAPI.toggleBookmark(id);
      if (res.data.success) {
        // Refresh
        fetchArticles();
        fetchBookmarks();
      }
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const handleOpenArticle = async (id) => {
    try {
      setPointsReward(false);
      const res = await educationAPI.getOne(id);
      if (res.data.success) {
        setActiveArticle(res.data.data);
        setPointsReward(true); // Trigger simulated points unlock banner
        // Refresh articles list to update read count
        fetchArticles();
      }
    } catch (err) {
      console.error('Failed to open article:', err);
    }
  };

  const handleCloseArticle = () => {
    setActiveArticle(null);
    setPointsReward(false);
  };

  const categories = [
    { id: 'all', label: 'All Articles' },
    { id: 'general', label: 'Overview' },
    { id: 'transport', label: 'Transport' },
    { id: 'energy', label: 'Energy' },
    { id: 'food', label: 'Diet habits' },
    { id: 'waste', label: 'Zero Waste' },
  ];

  const displayedArticles = viewMode === 'bookmarked' ? bookmarks : articles;

  return (
    <div className="flex-1 p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto overflow-y-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-sans text-dark-950 dark:text-white flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-brand-500" />
            <span>Climate Education Hub</span>
          </h2>
          <p className="text-dark-500 dark:text-dark-400 text-sm mt-1">
            Browse educational guides, learn green habits, and earn +15 XP points for each article read.
          </p>
        </div>

        {/* View Mode */}
        <div className="flex bg-dark-100 dark:bg-dark-900/50 p-1 rounded-xl border border-dark-200 dark:border-dark-850 self-start">
          <button
            onClick={() => setViewMode('all')}
            className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'all' ? 'bg-brand-500 text-white' : 'text-dark-500 hover:text-dark-950'
            }`}
          >
            All Articles
          </button>
          <button
            onClick={() => setViewMode('bookmarked')}
            className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'bookmarked' ? 'bg-brand-500 text-white' : 'text-dark-500 hover:text-dark-950'
            }`}
          >
            Bookmarks
          </button>
        </div>
      </div>

      {/* Filter and Search controls */}
      {viewMode === 'all' && (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Category selection */}
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all border whitespace-nowrap ${
                  category === cat.id
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20'
                    : 'bg-transparent border-dark-200 dark:border-dark-800 text-dark-500 hover:text-dark-900 dark:hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search guides..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-10"
            />
            <Search className="w-4 h-4 text-dark-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      )}

      {/* Article listing grid */}
      {loading ? (
        <div className="flex-grow flex items-center justify-center min-h-[50vh]">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayedArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedArticles.map((art) => (
            <div
              key={art.id}
              onClick={() => handleOpenArticle(art.id)}
              className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between text-left cursor-pointer group"
            >
              {/* Image banner */}
              <div className="h-44 w-full bg-dark-900/10 dark:bg-dark-850 overflow-hidden relative">
                {art.image_url ? (
                  <img
                    src={art.image_url}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-dark-500">
                    <BookOpen className="w-12 h-12" />
                  </div>
                )}

                {/* Bookmark badge absolute */}
                <button
                  onClick={(e) => handleToggleBookmark(e, art.id)}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-dark-900/60 text-white backdrop-blur hover:bg-dark-900/80 transition-colors"
                >
                  <Bookmark
                    className={`w-4 h-4 ${
                      art.is_bookmarked ? 'fill-brand-500 text-brand-500' : 'text-white'
                    }`}
                  />
                </button>
              </div>

              {/* Text Body */}
              <div className="p-5 flex-grow flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-brand-500 tracking-wider">
                    {art.category}
                  </span>
                  <h4 className="font-bold text-base text-dark-950 dark:text-white leading-snug group-hover:text-brand-500 transition-colors">
                    {art.title}
                  </h4>
                  <p className="text-xs text-dark-500 dark:text-dark-400 line-clamp-3 mt-1">
                    {art.content}
                  </p>
                </div>

                {/* Article Footer details */}
                <div className="border-t border-dark-100 dark:border-dark-850 pt-3 flex justify-between items-center text-[10px] text-dark-450 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{art.read_time_mins} min read</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{art.read_count} views</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-20 rounded-3xl text-center flex flex-col items-center justify-center gap-4 text-dark-400">
          <BookOpen className="w-12 h-12 text-dark-500" />
          <p className="text-sm">No educational articles found.</p>
        </div>
      )}

      {/* Article Detail Reading Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-3xl w-full max-h-[85vh] rounded-3xl overflow-hidden flex flex-col text-left relative animate-float">
            {/* Header / Title block */}
            <div className="p-6 border-b border-dark-100 dark:border-dark-800 flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-brand-500 tracking-wider block mb-1">
                  {activeArticle.category} Article
                </span>
                <h3 className="text-xl lg:text-2xl font-black text-dark-950 dark:text-white leading-tight">
                  {activeArticle.title}
                </h3>
                <span className="text-xs text-dark-500 block mt-1.5">
                  Published by {activeArticle.author}
                </span>
              </div>

              <button
                onClick={handleCloseArticle}
                className="p-1.5 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content Body scrollable */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-dark-700 dark:text-dark-300 leading-relaxed font-sans max-h-[50vh]">
              {activeArticle.image_url && (
                <img
                  src={activeArticle.image_url}
                  alt={activeArticle.title}
                  className="w-full h-56 object-cover rounded-2xl mb-4"
                />
              )}
              {activeArticle.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            {/* Modal points reward footer */}
            <div className="p-4 border-t border-dark-100 dark:border-dark-800 bg-dark-50/50 dark:bg-dark-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              {pointsReward && (
                <div className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-bold">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>XP Unlocked: +15 points awarded to profile!</span>
                </div>
              )}
              <button
                onClick={handleCloseArticle}
                className="btn-primary py-2 px-6 rounded-xl text-xs sm:ml-auto"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Education;
