import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { activitiesAPI } from '../services/api';
import {
  Car,
  Lightbulb,
  Utensils,
  Trash,
  Droplet,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Flame,
  Award,
  Leaf
} from 'lucide-react';

const logSchema = z.object({
  category: z.enum(['transportation', 'electricity', 'food', 'waste', 'water']),
  subcategory: z.string().min(1, 'Please select a subcategory'),
  amount: z.coerce.number().positive('Amount must be a positive number'),
  description: z.string().max(255).optional(),
  activityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date'),
});

const Calculator = () => {
  const [factors, setFactors] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('transportation');
  const [previewEmissions, setPreviewEmissions] = useState(0);
  const [successReward, setSuccessReward] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(logSchema),
    defaultValues: {
      category: 'transportation',
      subcategory: '',
      amount: '',
      description: '',
      activityDate: new Date().toISOString().slice(0, 10),
    },
  });

  const watchedCategory = watch('category');
  const watchedSubcategory = watch('subcategory');
  const watchedAmount = watch('amount');

  // Fetch factors and activities on mount
  const fetchData = async () => {
    try {
      setTableLoading(true);
      console.log('fetchData starting...');
      const [factorsRes, activitiesRes] = await Promise.all([
        activitiesAPI.getFactors(),
        activitiesAPI.getAll({ limit: 10 }),
      ]);
      
      console.log('fetchData success:', { factorsData: factorsRes.data, activitiesData: activitiesRes.data });
      
      if (factorsRes.data.success) {
        setFactors(factorsRes.data.data);
        // Set default subcategory for transportation
        const firstSub = factorsRes.data.data.find(f => f.category === 'transportation');
        console.log('firstSub transportation factor:', firstSub);
        if (firstSub) setValue('subcategory', firstSub.subcategory);
      }
      
      if (activitiesRes.data.success) {
        setActivities(activitiesRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching calculator dependencies:', err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update category value when Tab changes
  const handleTabChange = (category) => {
    setActiveTab(category);
    setValue('category', category);
    
    // Select first subcategory of that tab
    const filtered = factors.filter(f => f.category === category);
    if (filtered.length > 0) {
      setValue('subcategory', filtered[0].subcategory);
    } else {
      setValue('subcategory', '');
    }
  };

  // Dynamic footprint Preview Calculation
  useEffect(() => {
    if (!watchedCategory || !watchedSubcategory || !watchedAmount || isNaN(watchedAmount)) {
      setPreviewEmissions(0);
      return;
    }

    const factorObj = factors.find(
      (f) => f.category === watchedCategory && f.subcategory === watchedSubcategory
    );

    if (factorObj) {
      setPreviewEmissions(watchedAmount * factorObj.factor);
    } else {
      setPreviewEmissions(0);
    }
  }, [watchedCategory, watchedSubcategory, watchedAmount, factors]);

  const onSubmit = async (data) => {
    setLoading(true);
    setSuccessReward(null);
    try {
      const res = await activitiesAPI.log(data);
      if (res.data.success) {
        setSuccessReward(res.data.data.rewardDetails);
        reset({
          category: activeTab,
          subcategory: factors.filter(f => f.category === activeTab)[0]?.subcategory || '',
          amount: '',
          description: '',
          activityDate: new Date().toISOString().slice(0, 10),
        });
        
        // Refresh logs list
        const activitiesRes = await activitiesAPI.getAll({ limit: 10 });
        if (activitiesRes.data.success) {
          setActivities(activitiesRes.data.data);
        }
      }
    } catch (err) {
      console.error('Failed to log activity:', err);
      alert('Failed to log activity. Verify inputs are correct.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this activity log?')) return;
    try {
      const res = await activitiesAPI.delete(id);
      if (res.data.success) {
        setActivities(activities.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error('Delete activity error:', err);
    }
  };

  const tabs = [
    { id: 'transportation', label: 'Transport', icon: Car, unit: 'km' },
    { id: 'electricity', label: 'Energy', icon: Lightbulb, unit: 'kWh' },
    { id: 'food', label: 'Food Habits', icon: Utensils, unit: 'meals' },
    { id: 'waste', label: 'Waste', icon: Trash, unit: 'kg' },
    { id: 'water', label: 'Water', icon: Droplet, unit: 'liters' },
  ];

  console.log('Calculator render: factors=', factors, 'activeTab=', activeTab);
  const subcategoriesFiltered = factors.filter((f) => f.category === activeTab);
  console.log('Calculator render: subcategoriesFiltered=', subcategoriesFiltered);

  return (
    <div className="flex-1 p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto overflow-y-auto">
      <div>
        <h2 className="text-3xl font-bold font-sans text-dark-950 dark:text-white">Log Daily Activities</h2>
        <p className="text-dark-500 dark:text-dark-400 text-sm mt-1">
          Select a category tab, input your consumption/usage values, and view your calculated impact.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Logging Form Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Tab Navigation */}
          <div className="flex bg-dark-100 dark:bg-dark-900/50 p-1 rounded-2xl border border-dark-200 dark:border-dark-850 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 min-w-[100px] ${
                    activeTab === tab.id
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-900/15'
                      : 'text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <div className="glass-panel p-6 rounded-3xl border border-brand-500/10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subcategory */}
                <div className="text-left">
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Type of Activity
                  </label>
                  <select
                    {...register('subcategory')}
                    className="form-input capitalize"
                  >
                    {subcategoriesFiltered.map((sub) => (
                      <option key={sub.subcategory} value={sub.subcategory}>
                        {sub.subcategory.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  {errors.subcategory && (
                    <p className="text-xs text-red-500 mt-1">{errors.subcategory.message}</p>
                  )}
                </div>

                {/* Amount */}
                <div className="text-left">
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Amount ({tabs.find((t) => t.id === activeTab)?.unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder={`e.g. 15`}
                    {...register('amount')}
                    className="form-input"
                  />
                  {errors.amount && (
                    <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Description */}
                <div className="text-left">
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Short Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Commute to downtown office"
                    {...register('description')}
                    className="form-input"
                  />
                </div>

                {/* Date */}
                <div className="text-left">
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Activity Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      {...register('activityDate')}
                      className="form-input pl-10"
                    />
                    <Calendar className="w-4 h-4 text-dark-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  {errors.activityDate && (
                    <p className="text-xs text-red-500 mt-1">{errors.activityDate.message}</p>
                  )}
                </div>
              </div>

              {/* Submit / Preview */}
              <div className="border-t border-dark-100 dark:border-dark-850 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="text-left flex items-center gap-3">
                  <div className="p-2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-lg">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-dark-450 uppercase tracking-wider font-bold">Estimated Emissions Impact</span>
                    <h4 className="text-2xl font-black text-dark-950 dark:text-white">
                      {previewEmissions.toFixed(2)} <span className="text-sm font-medium text-dark-400">kg CO2e</span>
                    </h4>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full md:w-auto px-8 py-3.5 rounded-xl text-sm"
                >
                  {loading ? 'Logging activity...' : 'Log Carbon Activity'}
                </button>
              </div>
            </form>
          </div>

          {/* Success Reward Modal/Banner */}
          {successReward && (
            <div className="p-5 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-left animate-float">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-500 text-white rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-brand-600 dark:text-brand-400 text-sm">Activity Logged Successfully!</h4>
                  <p className="text-xs text-dark-500 dark:text-dark-400 mt-0.5">
                    You earned <span className="font-bold text-brand-500">+{successReward.pointsEarned} points</span> XP and updated your eco index.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 text-amber-500 rounded-lg text-xs font-bold border border-amber-500/20">
                  <Flame className="w-4 h-4 fill-amber-500/10" />
                  <span>Streak: {successReward.newStreak}d</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-500/15 text-brand-500 rounded-lg text-xs font-bold border border-brand-500/20">
                  <Award className="w-4 h-4" />
                  <span>{successReward.newLevel}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent logs details column */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 max-h-[600px] overflow-y-auto">
          <h3 className="font-bold text-lg text-dark-900 dark:text-white text-left">Activity History (Last 10)</h3>
          
          {tableLoading ? (
            <div className="flex-grow flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activities.length > 0 ? (
            <div className="flex flex-col gap-3">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl bg-dark-100/30 dark:bg-dark-900/30 border border-dark-200 dark:border-dark-850 flex justify-between items-center text-left relative group hover:border-brand-500/30 transition-all duration-200"
                >
                  <div className="flex flex-col gap-1 pr-6">
                    <div className="flex items-center gap-2">
                      <span className="capitalize text-xs font-bold text-brand-600 dark:text-brand-400">
                        {act.category}
                      </span>
                      <span className="text-[10px] text-dark-400 font-medium">
                        {act.activity_date}
                      </span>
                    </div>
                    <span className="font-semibold text-sm capitalize text-dark-950 dark:text-white truncate max-w-[140px]">
                      {act.subcategory.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-dark-500">
                      {act.amount} {act.unit} • {act.description || 'no details'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-dark-950 dark:text-white">
                      {act.calculated_emissions.toFixed(1)} kg
                    </span>
                    <button
                      onClick={() => handleDelete(act.id)}
                      className="p-1 text-dark-400 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6 text-dark-400">
              <Leaf className="w-12 h-12 text-dark-500 mb-2" />
              <p className="text-xs">No logged carbon activities. Start logging your carbon habits above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calculator;
