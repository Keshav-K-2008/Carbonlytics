import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { goalsAPI } from '../services/api';
import { Target, Plus, Trash2, Calendar, Sparkles, CheckCircle2, XCircle } from 'lucide-react';

const goalSchema = z.object({
  targetType: z.enum(['monthly', 'quarterly', 'yearly']),
  category: z.enum(['overall', 'transportation', 'electricity', 'food', 'waste', 'water']),
  targetReductionPct: z.coerce.number().min(1).max(100, 'Percentage must be between 1 and 100'),
  targetEmission: z.coerce.number().positive('Target emissions must be a positive number'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid start date'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid end date'),
});

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      targetType: 'monthly',
      category: 'overall',
      targetReductionPct: 15,
      targetEmission: 300,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    },
  });

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await goalsAPI.getAll();
      if (res.data.success) {
        setGoals(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const onSubmit = async (data) => {
    setFormLoading(true);
    try {
      const res = await goalsAPI.create(data);
      if (res.data.success) {
        setShowForm(false);
        reset();
        fetchGoals();
      }
    } catch (err) {
      console.error('Failed to create goal:', err);
      alert('Error creating goal. Double check dates are logical.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sustainability goal?')) return;
    try {
      const res = await goalsAPI.delete(id);
      if (res.data.success) {
        setGoals(goals.filter((g) => g.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto overflow-y-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-sans text-dark-950 dark:text-white flex items-center gap-2">
            <Target className="w-8 h-8 text-brand-500" />
            <span>Sustainability Goals</span>
          </h2>
          <p className="text-dark-500 dark:text-dark-400 text-sm mt-1">
            Define target limits to budget carbon footprints. Earn +100 bonus points when targets expire successfully.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary py-2.5 px-5 text-sm rounded-xl"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel New Goal' : 'Define Carbon Goal'}
        </button>
      </div>

      {/* Goal creation Form */}
      {showForm && (
        <div className="glass-panel p-6 rounded-3xl border border-brand-500/10 text-left">
          <h3 className="font-bold text-lg mb-4 text-dark-900 dark:text-white">Create Carbon Target Goal</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Goal Scope / Type
                </label>
                <select {...register('targetType')} className="form-input">
                  <option value="monthly">Monthly Target</option>
                  <option value="quarterly">Quarterly Target</option>
                  <option value="yearly">Yearly Target</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Emission Category
                </label>
                <select {...register('category')} className="form-input capitalize">
                  <option value="overall">Overall Footprint</option>
                  <option value="transportation">Transportation</option>
                  <option value="electricity">Electricity</option>
                  <option value="food">Food Habits</option>
                  <option value="waste">Waste Generation</option>
                  <option value="water">Water Consumption</option>
                </select>
              </div>

              {/* Reduction target */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Target Reduction (%)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15"
                  {...register('targetReductionPct')}
                  className="form-input"
                />
                {errors.targetReductionPct && (
                  <p className="text-xs text-red-500 mt-1">{errors.targetReductionPct.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Target emission */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Limit threshold (kg CO2e)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 300"
                  {...register('targetEmission')}
                  className="form-input"
                />
                {errors.targetEmission && (
                  <p className="text-xs text-red-500 mt-1">{errors.targetEmission.message}</p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  className="form-input"
                />
                {errors.startDate && (
                  <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  {...register('endDate')}
                  className="form-input"
                />
                {errors.endDate && (
                  <p className="text-xs text-red-500 mt-1">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="btn-primary py-3.5 px-6 rounded-xl text-sm"
            >
              {formLoading ? 'Creating goal...' : 'Activate Carbon Goal'}
            </button>
          </form>
        </div>
      )}

      {/* Goals listing */}
      {loading ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((g) => {
            const isBreached = g.current_emissions > g.target_emission;
            
            return (
              <div
                key={g.id}
                className="glass-panel p-6 rounded-3xl flex flex-col justify-between gap-5 text-left border-l-4 relative group"
                style={{ borderLeftColor: g.status === 'achieved' ? '#10b981' : g.status === 'failed' ? '#ef4444' : '#3b82f6' }}
              >
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-dark-400 tracking-wider">
                      {g.target_type} Target
                    </span>
                    <h4 className="font-bold text-lg capitalize text-dark-950 dark:text-white">
                      {g.category.replace('_', ' ')} Budget
                    </h4>
                    <span className="text-xs text-dark-550 dark:text-dark-400 mt-0.5">
                      {g.start_date} to {g.end_date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {g.status === 'achieved' && (
                      <span className="flex items-center gap-1 text-xs font-bold text-brand-500 bg-brand-500/10 py-1.5 px-3 rounded-lg border border-brand-500/20">
                        <CheckCircle2 className="w-4 h-4" /> Achieved (+100 XP)
                      </span>
                    )}
                    {g.status === 'failed' && (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 py-1.5 px-3 rounded-lg border border-red-500/20">
                        <XCircle className="w-4 h-4" /> Limit Exceeded
                      </span>
                    )}
                    {g.status === 'active' && (
                      <span className={`flex items-center gap-1 text-xs font-bold py-1.5 px-3 rounded-lg border ${
                        isBreached 
                          ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                          : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {isBreached ? 'Breached' : 'Active'}
                      </span>
                    )}

                    <button
                      onClick={() => handleDelete(g.id)}
                      className="p-1 text-dark-450 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Limit Utilized</span>
                    <span className={isBreached ? 'text-red-500' : 'text-brand-500'}>
                      {g.current_emissions.toFixed(1)} / {g.target_emission} kg CO2e
                    </span>
                  </div>
                  <div className="w-full bg-dark-200 dark:bg-dark-800 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        isBreached ? 'bg-red-500' : 'bg-brand-500'
                      }`}
                      style={{ width: `${Math.min(100, g.progress_pct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-dark-400 font-semibold mt-1">
                    <span>Target reduction: {g.target_reduction_pct}%</span>
                    <span>{Math.round(g.progress_pct)}% Limit Used</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-16 rounded-3xl text-center flex flex-col items-center justify-center gap-4 text-dark-400">
          <Target className="w-12 h-12 text-dark-500" />
          <p className="text-sm">You haven't defined any sustainability goals yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary py-2 px-4 text-xs mt-2"
          >
            Create Your First Goal
          </button>
        </div>
      )}
    </div>
  );
};

export default Goals;
