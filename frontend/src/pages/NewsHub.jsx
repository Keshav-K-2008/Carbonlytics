import React, { useState, useEffect } from 'react';
import { Leaf, Globe, ExternalLink, RefreshCw, Calendar, Eye } from 'lucide-react';
import api from '../services/api';

const NewsHub = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/news');
      if (res.data.success) {
        setArticles(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load climate news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="flex-1 p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto overflow-y-auto font-sans text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-dark-955 dark:text-white flex items-center gap-2">
            <Globe className="w-8 h-8 text-brand-500 animate-pulse-subtle" />
            <span>Climate News Hub</span>
          </h2>
          <p className="text-dark-500 dark:text-dark-400 text-sm mt-1">
            Browse the latest international articles and updates on climate change, renewable energy, and green technology.
          </p>
        </div>

        <button
          onClick={fetchNews}
          disabled={loading}
          className="btn-secondary text-xs py-2 px-4 rounded-xl flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Feed
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col gap-4 items-center justify-center min-h-[50vh]">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-dark-500 font-semibold">Fetching latest global climate news...</span>
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
          {articles.map((art, idx) => (
            <div
              key={idx}
              className="glass-panel rounded-3xl overflow-hidden border border-dark-200/50 dark:border-dark-850/80 flex flex-col justify-between group hover:border-brand-500/20 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div className="relative h-44 w-full overflow-hidden bg-dark-100 dark:bg-dark-900">
                <img
                  src={art.urlToImage}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-brand-500 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  {art.source?.name}
                </div>
              </div>

              <div className="p-5 flex flex-col gap-4 flex-1 justify-between text-left">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-dark-450 font-bold uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{art.publishedAt}</span>
                  </div>
                  <h3 className="font-extrabold text-sm text-dark-950 dark:text-white leading-snug line-clamp-2 group-hover:text-brand-500 transition-colors">
                    {art.title}
                  </h3>
                  <p className="text-xs text-dark-500 dark:text-dark-400 leading-relaxed line-clamp-3 mt-1">
                    {art.description}
                  </p>
                </div>

                <a
                  href={art.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full py-2 rounded-xl justify-center text-xs font-semibold gap-1.5 mt-4"
                >
                  <Eye className="w-4 h-4" /> Read Article <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl text-center flex flex-col items-center justify-center gap-4 text-dark-450">
          <Leaf className="w-12 h-12 text-dark-550" />
          <p className="text-sm">No climate news articles available at this time. Please check back later.</p>
        </div>
      )}
    </div>
  );
};

export default NewsHub;
