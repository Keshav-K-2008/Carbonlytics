import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import {
  Lightbulb,
  CheckCircle2,
  TrendingDown,
  Info,
  ChevronRight,
  Flame,
  Award,
  Send,
  Bot,
  User,
  Sparkles
} from 'lucide-react';
import api from '../services/api';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // EcoChat States
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I am EcoChat, your personal sustainability advisor. I've analyzed your Carbonlytix activities. Ask me anything about how to save energy, travel cleaner, or eat sustainably!",
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const res = await dashboardAPI.getStats();
        if (res.data.success) {
          setRecommendations(res.data.data.recommendations);
        }
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatLoading) return;

    const userMsg = { role: 'user', content: inputMessage };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setChatLoading(true);

    try {
      const res = await api.post('/chat', { message: userMsg.content });
      if (res.data.success) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
      }
    } catch (err) {
      console.error('Chat failed:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'I apologize, but I am having trouble connecting to the adviser model right now. Please try again in a moment!' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredRecs = activeTab === 'all' 
    ? recommendations 
    : recommendations.filter((r) => r.category === activeTab);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'transportation', label: 'Transport' },
    { id: 'electricity', label: 'Energy' },
    { id: 'food', label: 'Diet' },
    { id: 'waste', label: 'Waste' },
    { id: 'water', label: 'Water' },
  ];

  return (
    <div className="flex-1 p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto overflow-y-auto font-sans h-screen">
      <div>
        <h2 className="text-3xl font-bold text-dark-950 dark:text-white flex items-center gap-2 text-left">
          <Lightbulb className="w-8 h-8 text-brand-500" />
          <span>Carbon Reduction Hub</span>
        </h2>
        <p className="text-dark-500 dark:text-dark-400 text-sm mt-1 text-left">
          Receive tailored sustainability suggestions and chat with your AI Eco-Adviser.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 flex-1 overflow-hidden min-h-0">
        {/* Recommendations list (2 Cols) */}
        <div className="xl:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2 pb-8">
          {/* Filter Tabs */}
          <div className="flex bg-dark-100 dark:bg-dark-900/40 p-1 rounded-xl border border-dark-200 dark:border-dark-850 overflow-x-auto self-start">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === cat.id ? 'bg-brand-500 text-white' : 'text-dark-500 hover:text-dark-955 dark:hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Recommendations Card Grid */}
          {filteredRecs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRecs.map((rec) => (
                <div
                  key={rec.id}
                  className="glass-panel p-5 rounded-2xl flex flex-col justify-between gap-4 border-l-4 border-brand-500 text-left hover:border-brand-500/50 transition-all duration-300"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 tracking-wider">
                        {rec.category.replace('_', ' ')}
                      </span>
                      <h4 className="font-bold text-sm text-dark-950 dark:text-white leading-tight">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-dark-500 dark:text-dark-400 leading-relaxed mt-1.5">
                        {rec.description}
                      </p>
                    </div>

                    <div className="flex-shrink-0 bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 py-2 px-3 rounded-xl text-center">
                      <span className="text-[8px] block uppercase font-bold tracking-wide">SAVINGS</span>
                      <span className="text-sm font-black">-{rec.estimatedSavings} kg</span>
                    </div>
                  </div>

                  <div className="border-t border-dark-100 dark:border-dark-850 pt-3 flex items-center justify-between text-xs text-dark-400 font-medium">
                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                        rec.difficulty === 'Easy' 
                          ? 'bg-brand-500/10 text-brand-500' 
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {rec.difficulty}
                      </span>
                      <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-500 rounded-md text-[9px] font-bold">
                        {rec.impact} Impact
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl text-center flex flex-col items-center justify-center gap-4 text-dark-400">
              <Info className="w-12 h-12 text-dark-500" />
              <p className="text-sm">No recommendations found matching this category filter.</p>
            </div>
          )}
        </div>

        {/* EcoChat Chatbot Panel (1 Col) */}
        <div className="glass-panel rounded-2xl flex flex-col border border-brand-500/10 h-[500px] xl:h-[620px] overflow-hidden">
          {/* Chat Header */}
          <div className="px-5 py-4 bg-brand-500/10 border-b border-dark-100 dark:border-dark-850 flex items-center gap-3">
            <div className="p-2 bg-brand-500/20 text-brand-500 rounded-xl">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm text-dark-950 dark:text-white flex items-center gap-1.5">
                <span>EcoChat Advisor</span>
                <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              </h3>
              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">Llama-3 LLM active</span>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 max-w-[85%] text-left ${
                  msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'
                }`}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 flex items-center justify-center h-8 w-8 ${
                  msg.role === 'user' ? 'bg-brand-500 text-white' : 'bg-dark-150 dark:bg-dark-900 border border-dark-200 dark:border-dark-850 text-dark-400'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-500 text-white rounded-tr-none'
                    : 'bg-dark-100/70 dark:bg-dark-900/40 border border-dark-200/50 dark:border-dark-850 text-dark-850 dark:text-dark-200 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-3 self-start max-w-[85%] text-left">
                <div className="p-2 rounded-xl bg-dark-150 dark:bg-dark-900 border border-dark-200 dark:border-dark-850 text-dark-400 flex items-center justify-center h-8 w-8">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-dark-100/70 dark:bg-dark-900/40 border border-dark-200/50 dark:border-dark-850 text-xs text-dark-400 rounded-tl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-dark-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-dark-400 rounded-full animate-bounce delay-150" />
                  <span className="w-1.5 h-1.5 bg-dark-400 rounded-full animate-bounce delay-300" />
                </div>
              </div>
            )}
          </div>

          {/* Chat Input form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-dark-100 dark:border-dark-850 flex gap-2">
            <input
              type="text"
              placeholder="Ask for green swaps..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-dark-100/80 dark:bg-dark-900/40 border border-dark-200 dark:border-dark-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 text-dark-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={chatLoading || !inputMessage.trim()}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl p-2.5 transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;

