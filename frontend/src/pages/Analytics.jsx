import React, { useState, useEffect } from 'react';
import { activitiesAPI } from '../services/api';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { BarChart3, TrendingDown, Target, Info, Sparkles } from 'lucide-react';

const Analytics = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30'); // 7 days or 30 days

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        // Fetch all activities up to limit
        const res = await activitiesAPI.getAll({ limit: 200 });
        if (res.data.success) {
          setActivities(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching activities for analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- DATA TRANSFORMS FOR RECHARTS ---
  const filterByTimeframe = (act) => {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - Number(timeframe));
    const actDate = new Date(act.activity_date);
    return actDate >= dateLimit;
  };

  const filteredActivities = activities.filter(filterByTimeframe);

  // 1. Group by Date (for Area & Line Charts)
  const dateMap = {};
  // Initialize last N days to prevent empty slots in chart
  for (let i = Number(timeframe) - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    dateMap[dateStr] = {
      date: dateStr.slice(5), // MM-DD format for labels
      transportation: 0,
      electricity: 0,
      food: 0,
      waste: 0,
      water: 0,
      total: 0,
      benchmark: 15.00, // 15kg benchmark
    };
  }

  filteredActivities.forEach((act) => {
    const dStr = act.activity_date;
    if (dateMap[dStr]) {
      dateMap[dStr][act.category] += act.calculated_emissions;
      dateMap[dStr].total += act.calculated_emissions;
    }
  });

  const timelineData = Object.values(dateMap).sort((a, b) => (a.date > b.date ? 1 : -1));

  // 2. Group by Category (for Pie & Bar Charts)
  const categoryMap = {
    transportation: 0,
    electricity: 0,
    food: 0,
    waste: 0,
    water: 0,
  };
  let totalEmissions = 0;
  filteredActivities.forEach((act) => {
    categoryMap[act.category] += act.calculated_emissions;
    totalEmissions += act.calculated_emissions;
  });

  const categoryData = Object.entries(categoryMap).map(([key, val]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: Number(val.toFixed(1)),
  }));

  const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#3b82f6'];

  // Compare averages
  const activeDaysCount = Object.keys(dateMap).length;
  const userAverageDaily = activeDaysCount > 0 ? (totalEmissions / activeDaysCount) : 0;

  return (
    <div className="flex-1 p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto overflow-y-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-sans text-dark-950 dark:text-white">Emission Analytics</h2>
          <p className="text-dark-500 dark:text-dark-400 text-sm mt-1">
            Review detailed consumption trends, categories comparison, and daily carbon emission benchmarks.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex bg-dark-100 dark:bg-dark-900/40 p-1 rounded-xl border border-dark-200 dark:border-dark-800 self-start">
          <button
            onClick={() => setTimeframe('7')}
            className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
              timeframe === '7' ? 'bg-brand-500 text-white' : 'text-dark-500 hover:text-dark-900 dark:hover:text-white'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeframe('30')}
            className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
              timeframe === '30' ? 'bg-brand-500 text-white' : 'text-dark-500 hover:text-dark-900 dark:hover:text-white'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Numerical Benchmark Comparisons Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between text-left">
          <div>
            <p className="text-xs text-dark-400 font-medium uppercase tracking-wider">Your Average Daily</p>
            <h4 className="text-2xl font-black text-dark-950 dark:text-white">{userAverageDaily.toFixed(1)} kg</h4>
            <span className="text-[10px] text-dark-400 mt-1 block">CO2e per day logged</span>
          </div>
          <div className="p-3 bg-brand-500/10 text-brand-500 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between text-left">
          <div>
            <p className="text-xs text-dark-400 font-medium uppercase tracking-wider">Climate Benchmark</p>
            <h4 className="text-2xl font-black text-dark-950 dark:text-white">15.0 kg</h4>
            <span className="text-[10px] text-dark-400 mt-1 block">Target limit recommended</span>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-xl">
            <Target className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between text-left">
          <div>
            <p className="text-xs text-dark-400 font-medium uppercase tracking-wider">Deviation Index</p>
            <h4 className={`text-2xl font-black ${userAverageDaily <= 15 ? 'text-brand-500' : 'text-red-500'}`}>
              {userAverageDaily <= 15 ? '-' : '+'}
              {Math.abs(((userAverageDaily - 15) / 15) * 100).toFixed(0)}%
            </h4>
            <span className="text-[10px] text-dark-400 mt-1 block">Compared to climate benchmark</span>
          </div>
          <div className={`p-3 rounded-xl ${userAverageDaily <= 15 ? 'bg-brand-500/10 text-brand-500' : 'bg-red-500/10 text-red-500'}`}>
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Area Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl flex flex-col gap-4">
          <h3 className="font-bold text-lg text-dark-900 dark:text-white text-left">Emission Trends over Time</h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                <Tooltip formatter={(value) => `${value.toFixed(1)} kg`} />
                <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" name="Total Emissions" />
                <Line type="monotone" dataKey="benchmark" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Target Benchmark" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category ratio Pie Chart */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between items-center">
          <h3 className="font-bold text-lg text-dark-900 dark:text-white text-left w-full">Emissions Ratio</h3>
          {totalEmissions > 0 ? (
            <div className="w-full h-64 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(1)} kg`} />
                  <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col">
                <span className="text-3xl font-extrabold text-brand-500">{totalEmissions.toFixed(0)}</span>
                <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Total kg</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-dark-400">
              <Info className="w-10 h-10 mb-2" />
              <p className="text-xs">No activity logged in this timeframe.</p>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Stacked Bar Chart & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cumulative Stacked Bar */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl flex flex-col gap-4">
          <h3 className="font-bold text-lg text-dark-900 dark:text-white text-left">Stacked Consumption by Category</h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                <Tooltip formatter={(value) => `${value.toFixed(1)} kg`} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="transportation" stackId="a" fill="#10b981" name="Transport" />
                <Bar dataKey="electricity" stackId="a" fill="#06b6d4" name="Energy" />
                <Bar dataKey="food" stackId="a" fill="#f59e0b" name="Food" />
                <Bar dataKey="waste" stackId="a" fill="#ef4444" name="Waste" />
                <Bar dataKey="water" stackId="a" fill="#3b82f6" name="Water" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Environmental Insights widget */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 text-left">
          <h3 className="font-bold text-lg text-dark-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            <span>Carbon Insights</span>
          </h3>

          <div className="flex flex-col gap-4 text-sm mt-2">
            {totalEmissions === 0 ? (
              <p className="text-xs text-dark-400">
                Log regular activities to unlock advanced carbon footprint insights.
              </p>
            ) : (
              <>
                <div className="p-3.5 bg-brand-500/10 border border-brand-500/20 rounded-xl">
                  <span className="font-semibold text-brand-600 dark:text-brand-400 text-xs block mb-1">Primary Contributor</span>
                  <p className="text-xs text-dark-800 dark:text-dark-300 leading-relaxed">
                    {categoryData.sort((a,b) => b.value - a.value)[0]?.name} accounts for the highest emissions at {((categoryData.sort((a,b) => b.value - a.value)[0]?.value / totalEmissions) * 100 || 0).toFixed(0)}% of your footprint. Focus carbon goals in this area.
                  </p>
                </div>

                <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400 text-xs block mb-1">Forest Equivalent Offset</span>
                  <p className="text-xs text-dark-800 dark:text-dark-300 leading-relaxed">
                    To completely offset your emissions logged in this period ({totalEmissions.toFixed(0)} kg), you would need to grow approximately <span className="font-bold text-brand-500">{Math.ceil(totalEmissions / 22)} mature pine trees</span> for a full year.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
