import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminAPI } from '../services/api';
import { ShieldCheck, BarChart4, Trophy, BookOpen, UserPlus, Sparkles, Loader2 } from 'lucide-react';

const challengeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select start date'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select end date'),
  pointsReward: z.coerce.number().int().positive('XP reward must be positive'),
  badgeRewardId: z.string().uuid().optional().or(z.string().length(0)),
  icon: z.string().optional(),
});

const articleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  category: z.string().min(1, 'Category is required'),
  author: z.string().optional(),
  imageUrl: z.string().url('Please enter a valid Image URL').optional().or(z.string().length(0)),
});

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formType, setFormType] = useState('challenge'); // challenge or article
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getStats();
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const challengeForm = useForm({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'waste',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      pointsReward: 250,
      badgeRewardId: '',
      icon: 'Trophy',
    },
  });

  const articleForm = useForm({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      content: '',
      category: 'general',
      author: 'Carbonlytix Editor',
      imageUrl: '',
    },
  });

  const onChallengeSubmit = async (data) => {
    setSubmitLoading(true);
    // Convert empty badge string to null
    if (data.badgeRewardId === '') data.badgeRewardId = null;
    try {
      const res = await adminAPI.createChallenge(data);
      if (res.data.success) {
        alert('Challenge created and broadcasted to all users!');
        challengeForm.reset();
        fetchAdminStats();
      }
    } catch (err) {
      console.error('Challenge creation error:', err);
      alert('Failed to create challenge.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const onArticleSubmit = async (data) => {
    setSubmitLoading(true);
    try {
      const res = await adminAPI.publishArticle(data);
      if (res.data.success) {
        alert('Educational article published successfully!');
        articleForm.reset();
        fetchAdminStats();
      }
    } catch (err) {
      console.error('Article publish error:', err);
      alert('Failed to publish article.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto overflow-y-auto font-sans">
      <div>
        <h2 className="text-3xl font-bold font-sans text-dark-950 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-cyan-500" />
          <span>Administrative Console</span>
        </h2>
        <p className="text-dark-500 dark:text-dark-400 text-sm mt-1">
          Manage sustainability campaigns, configure points/badges payouts, publish resources, and monitor growth metrics.
        </p>
      </div>

      {/* Numerical Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 text-left">
          <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-xl">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-dark-400 font-bold uppercase">Total Users</span>
            <h4 className="text-2xl font-black">{stats.stats.totalUsers}</h4>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 text-left">
          <div className="p-3 bg-brand-500/10 text-brand-500 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-dark-400 font-bold uppercase">Avg User XP</span>
            <h4 className="text-2xl font-black">{stats.stats.avgPoints} XP</h4>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 text-left">
          <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-xl">
            <BarChart4 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-dark-400 font-bold uppercase">Total Co2 Logged</span>
            <h4 className="text-2xl font-black">{stats.stats.totalEmissionsLogged} kg</h4>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 text-left">
          <div className="p-3 bg-brand-500/10 text-brand-500 rounded-xl">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-dark-400 font-bold uppercase">Total Activities</span>
            <h4 className="text-2xl font-black">{stats.stats.totalActivitiesLogged} logs</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation forms column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex bg-dark-100 dark:bg-dark-900/40 p-1 rounded-xl border border-dark-200 dark:border-dark-800 self-start">
            <button
              onClick={() => setFormType('challenge')}
              className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
                formType === 'challenge' ? 'bg-cyan-500 text-white' : 'text-dark-500 hover:text-dark-950'
              }`}
            >
              Challenge Builder
            </button>
            <button
              onClick={() => setFormType('article')}
              className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
                formType === 'article' ? 'bg-cyan-500 text-white' : 'text-dark-500 hover:text-dark-950'
              }`}
            >
              Article Publisher
            </button>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/10 text-left">
            {formType === 'challenge' ? (
              <form onSubmit={challengeForm.handleSubmit(onChallengeSubmit)} className="space-y-4">
                <h3 className="font-bold text-lg mb-2 text-dark-950 dark:text-white">Create New Sustainability Challenge</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-dark-400 mb-1.5">Challenge Title</label>
                    <input type="text" {...challengeForm.register('title')} className="form-input" placeholder="e.g. Tree Planting Challenge" />
                    {challengeForm.formState.errors.title && <p className="text-[10px] text-red-500 mt-1">{challengeForm.formState.errors.title.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-dark-400 mb-1.5">Campaign Category</label>
                    <select {...challengeForm.register('category')} className="form-input">
                      <option value="transportation">Transportation</option>
                      <option value="electricity">Electricity</option>
                      <option value="food">Diet habits</option>
                      <option value="waste">Waste</option>
                      <option value="water">Water</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark-400 mb-1.5">Detailed Description</label>
                  <textarea {...challengeForm.register('description')} className="form-input h-20 resize-none" placeholder="Provide requirements for completion..." />
                  {challengeForm.formState.errors.description && <p className="text-[10px] text-red-500 mt-1">{challengeForm.formState.errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-dark-400 mb-1.5">Start Date</label>
                    <input type="date" {...challengeForm.register('startDate')} className="form-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-dark-400 mb-1.5">End Date</label>
                    <input type="date" {...challengeForm.register('endDate')} className="form-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-dark-400 mb-1.5">XP Reward Points</label>
                    <input type="number" {...challengeForm.register('pointsReward')} className="form-input" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-dark-400 mb-1.5">Reward Badge ID (Optional UUID)</label>
                    <input type="text" {...challengeForm.register('badgeRewardId')} className="form-input" placeholder="e.g. b1000000-0000..." />
                    {challengeForm.formState.errors.badgeRewardId && <p className="text-[10px] text-red-500 mt-1">{challengeForm.formState.errors.badgeRewardId.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-dark-400 mb-1.5">Lucide Icon Class</label>
                    <input type="text" {...challengeForm.register('icon')} className="form-input" />
                  </div>
                </div>

                <button type="submit" disabled={submitLoading} className="btn-primary bg-cyan-600 hover:bg-cyan-500 py-3 px-6 rounded-xl text-xs mt-2 justify-center">
                  {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Launch Challenge Campaign'}
                </button>
              </form>
            ) : (
              <form onSubmit={articleForm.handleSubmit(onArticleSubmit)} className="space-y-4">
                <h3 className="font-bold text-lg mb-2 text-dark-950 dark:text-white">Publish Educational Article</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-dark-400 mb-1.5">Article Title</label>
                    <input type="text" {...articleForm.register('title')} className="form-input" placeholder="e.g. The Circular Economy" />
                    {articleForm.formState.errors.title && <p className="text-[10px] text-red-500 mt-1">{articleForm.formState.errors.title.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-dark-400 mb-1.5">Article Category</label>
                    <select {...articleForm.register('category')} className="form-input">
                      <option value="general">Overview</option>
                      <option value="transport">Transportation</option>
                      <option value="energy">Energy Saving</option>
                      <option value="food">Dietary impact</option>
                      <option value="waste">Recycling/Waste</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark-400 mb-1.5">Article Content Text</label>
                  <textarea {...articleForm.register('content')} className="form-input h-32" placeholder="Write comprehensive guide text here..." />
                  {articleForm.formState.errors.content && <p className="text-[10px] text-red-500 mt-1">{articleForm.formState.errors.content.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-dark-400 mb-1.5">Author Label</label>
                    <input type="text" {...articleForm.register('author')} className="form-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-dark-400 mb-1.5">Feature Image URL</label>
                    <input type="text" {...articleForm.register('imageUrl')} className="form-input" />
                    {articleForm.formState.errors.imageUrl && <p className="text-[10px] text-red-500 mt-1">{articleForm.formState.errors.imageUrl.message}</p>}
                  </div>
                </div>

                <button type="submit" disabled={submitLoading} className="btn-primary bg-cyan-600 hover:bg-cyan-500 py-3 px-6 rounded-xl text-xs mt-2 justify-center">
                  {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Article'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* User distribution / levels listing */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 text-left">
          <h3 className="font-bold text-lg text-dark-950 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-500" />
            <span>Growth Monitor</span>
          </h3>

          <div className="flex flex-col gap-5 mt-2">
            <div>
              <span className="text-xs font-bold text-dark-400 block mb-2.5">User Level Spread</span>
              <div className="flex flex-col gap-2">
                {stats.levelDistribution.map((lvl) => (
                  <div key={lvl.current_level} className="flex justify-between items-center text-xs font-medium border-b border-dark-100 dark:border-dark-850 pb-2">
                    <span className="text-dark-600 dark:text-dark-300">{lvl.current_level}</span>
                    <span className="font-bold text-cyan-500">{lvl.count} users</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-dark-400 block mb-2.5">Recent User Accounts</span>
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-2">
                {stats.recentUsers.map((usr) => (
                  <div key={usr.id} className="p-2 rounded-lg bg-dark-100/30 dark:bg-dark-900/30 border border-dark-200 dark:border-dark-850 text-[10px]">
                    <div className="flex justify-between font-bold">
                      <span className="text-dark-900 dark:text-white">{usr.full_name}</span>
                      <span className="text-cyan-500">{usr.current_level}</span>
                    </div>
                    <div className="flex justify-between text-dark-500 mt-1">
                      <span>{usr.email}</span>
                      <span>{usr.total_points} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
