import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Download,
  Flame,
  Award,
  TrendingDown,
  ChevronRight,
  TrendingUp,
  Leaf,
  Plus,
  Trash2,
  AlertTriangle,
  ClipboardList,
  Trophy,
  MapPin,
  Search,
  Globe,
  Sun,
  Cloud,
  Wind,
  Droplets,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Cell, PieChart, Pie, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  // New states for Weather/AQI & News
  const [searchCity, setSearchCity] = useState('Seoul');
  const [cityCoords, setCityCoords] = useState({ lat: 37.5665, lon: 126.9780, name: 'Seoul, South Korea' });
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [newsArticles, setNewsArticles] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getStats();
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to load dashboard. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherForCoords = async (lat, lon) => {
    try {
      const res = await api.get(`/weather?lat=${lat}&lon=${lon}`);
      if (res.data.success) {
        setWeatherData(res.data.data);
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
    }
  };

  const fetchNews = async () => {
    try {
      const res = await api.get('/news');
      if (res.data.success) {
        setNewsArticles(res.data.data.slice(0, 3));
      }
    } catch (err) {
      console.error('News fetch error:', err);
    }
  };

  const handleCitySearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchCity.trim()) return;
    setWeatherLoading(true);
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchCity)}&format=json&limit=1`);
      if (!geoRes.ok) throw new Error('Geocoding failed');
      const geoData = await geoRes.json();
      if (geoData.length > 0) {
        const { lat, lon, display_name } = geoData[0];
        const coords = { lat: parseFloat(lat), lon: parseFloat(lon), name: display_name };
        setCityCoords(coords);
        await fetchWeatherForCoords(coords.lat, coords.lon);
      } else {
        alert('City not found. Please check spelling.');
      }
    } catch (err) {
      console.error('City search failed:', err);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchWeatherForCoords(cityCoords.lat, cityCoords.lon);
    fetchNews();
  }, []);


  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const res = await api.get('/dashboard/export-pdf', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `carbonlytix_report_${new Date().toISOString().slice(0, 10)}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to generate PDF. Check backend console logs.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex flex-col gap-6 items-center justify-center min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-dark-500 dark:text-dark-400 font-medium">Aggregating sustainability dashboard metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <AlertTriangle className="w-16 h-16 text-yellow-500" />
        <h3 className="text-xl font-bold">Connection Failed</h3>
        <p className="text-dark-500 dark:text-dark-400 text-sm max-w-sm text-center">{error}</p>
        <button onClick={fetchDashboardData} className="btn-primary mt-2">
          Retry Connection
        </button>
      </div>
    );
  }

  const { profile, metrics, categories, activeGoals, activeChallenges, recentActivities, recommendations } = data;

  // Prepare Pie Chart data
  const pieData = Object.entries(categories)
    .filter(([_, cat]) => cat.emissions > 0)
    .map(([key, cat]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: cat.emissions,
    }));

  const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#3b82f6'];

  return (
    <div className="flex-1 p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto overflow-y-auto">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-sans text-dark-950 dark:text-white">
            Welcome back, {profile.fullName}!
          </h2>
          <p className="text-dark-500 dark:text-dark-400 text-sm mt-1">
            Let's review your carbon footprint logs and environmental goals today.
          </p>
        </div>
        
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="btn-secondary text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Generating PDF...' : 'Download Report'}
        </button>
      </div>

      {/* Gamification Streak & points header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Streak card */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-amber-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <Flame className="w-6 h-6 fill-amber-500/20" />
            </div>
            <div>
              <p className="text-xs text-dark-400 font-medium uppercase tracking-wider">Active Streak</p>
              <h4 className="text-xl font-bold">{profile.streak} Days</h4>
            </div>
          </div>
          <span className="text-xs text-dark-400">Record: {profile.highestStreak}d</span>
        </div>

        {/* Level card */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-brand-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-500/10 text-brand-500 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-dark-400 font-medium uppercase tracking-wider">Eco Level</p>
              <h4 className="text-xl font-bold">{profile.level}</h4>
            </div>
          </div>
          <span className="text-xs text-dark-400">{profile.points} XP Earned</span>
        </div>

        {/* Target limit comparison card */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-cyan-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-xl">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-dark-400 font-medium uppercase tracking-wider">Daily Target</p>
              <h4 className="text-xl font-bold">{profile.dailyEmissionTarget} kg CO2e</h4>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
            metrics.dailyEmissions <= profile.dailyEmissionTarget 
              ? 'bg-brand-500/15 text-brand-500' 
              : 'bg-red-500/10 text-red-500'
          }`}>
            {metrics.dailyEmissions <= profile.dailyEmissionTarget ? 'On track' : 'Limit exceeded'}
          </span>
        </div>
      </div>

      {/* Climate Weather & Environmental News Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather & AQI Location Widget (2 Cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col gap-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-dark-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-brand-500" />
                <span>Regional Weather & Air Quality</span>
              </h3>
              <p className="text-xs text-dark-400 mt-0.5 truncate max-w-md">
                Active: {cityCoords.name}
              </p>
            </div>

            {/* City search input form using Nominatim OSM */}
            <form onSubmit={handleCitySearch} className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search city..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="bg-dark-100/70 dark:bg-dark-900/50 border border-dark-200 dark:border-dark-800/80 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 w-40 text-dark-900 dark:text-white"
                />
                <Search className="w-3.5 h-3.5 text-dark-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                disabled={weatherLoading}
                className="bg-brand-500 hover:bg-brand-600 text-white font-semibold py-1.5 px-3.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {weatherLoading ? '...' : 'Search'}
              </button>
            </form>
          </div>

          {weatherData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              {/* Weather Stats & Air Quality Index details */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 bg-dark-100/40 dark:bg-dark-900/30 p-4 rounded-xl border border-dark-200/50 dark:border-dark-850/60">
                  <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl">
                    <Sun className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-dark-950 dark:text-white">
                      {weatherData.weather?.temp}°C
                    </h4>
                    <p className="text-xs text-dark-400 font-medium capitalize mt-0.5">
                      {weatherData.weather?.description}
                    </p>
                  </div>
                </div>

                {/* AQI Score alert with color styling */}
                <div className="flex flex-col gap-2 p-4 rounded-xl border bg-dark-100/40 dark:bg-dark-900/30 border-dark-200/50 dark:border-dark-850/60">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-dark-400 font-semibold uppercase tracking-wider">Air Quality (AQI)</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      weatherData.airQuality?.aqi === 1 ? 'bg-green-500/15 text-green-500' :
                      weatherData.airQuality?.aqi === 2 ? 'bg-emerald-500/15 text-emerald-400' :
                      weatherData.airQuality?.aqi === 3 ? 'bg-amber-500/15 text-amber-500' :
                      weatherData.airQuality?.aqi === 4 ? 'bg-orange-500/15 text-orange-500' :
                      'bg-red-500/15 text-red-500'
                    }`}>
                      {weatherData.airQuality?.aqi === 1 ? 'Good' :
                       weatherData.airQuality?.aqi === 2 ? 'Fair' :
                       weatherData.airQuality?.aqi === 3 ? 'Moderate' :
                       weatherData.airQuality?.aqi === 4 ? 'Poor' : 'Very Poor'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-dark-400">PM2.5:</span>
                      <span className="font-bold">{weatherData.airQuality?.pm2_5} μg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">PM10:</span>
                      <span className="font-bold">{weatherData.airQuality?.pm10} μg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">CO:</span>
                      <span className="font-bold">{weatherData.airQuality?.co} μg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">NO₂:</span>
                      <span className="font-bold">{weatherData.airQuality?.no2} μg/m³</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live OpenStreetMap embedded Iframe map */}
              <div className="w-full h-44 rounded-xl overflow-hidden border border-dark-200 dark:border-dark-800/80 relative shadow-inner">
                <iframe
                  title="nominatim-osm-map"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${cityCoords.lon - 0.015}%2C${cityCoords.lat - 0.015}%2C${cityCoords.lon + 0.015}%2C${cityCoords.lat + 0.015}&layer=mapnik&marker=${cityCoords.lat}%2C${cityCoords.lon}`}
                  className="absolute inset-0 w-full h-full border-none opacity-85 dark:opacity-75"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-44">
              <span className="text-xs text-dark-500">Querying weather coordinates...</span>
            </div>
          )}
        </div>

        {/* Climate News widget (1 Col) */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 text-left justify-between">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-dark-900 dark:text-white flex items-center gap-2">
              <Leaf className="w-5 h-5 text-brand-500 fill-brand-500/20" />
              <span>Eco News Hub</span>
            </h3>
            <Link to="/news" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="flex flex-col gap-3 justify-center flex-1 mt-2">
            {newsArticles.length > 0 ? (
              newsArticles.map((art, idx) => (
                <a
                  key={idx}
                  href={art.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 items-center group cursor-pointer hover:bg-dark-100/30 dark:hover:bg-dark-900/20 p-2 rounded-xl border border-transparent hover:border-dark-200/50 dark:hover:border-dark-800/50 transition-all"
                >
                  <img
                    src={art.urlToImage}
                    alt={art.title}
                    className="w-10 h-10 rounded-lg object-cover bg-dark-100 border border-dark-200 dark:border-dark-850"
                  />
                  <div className="flex flex-col overflow-hidden text-left">
                    <span className="text-xs font-bold text-dark-900 dark:text-white line-clamp-1 group-hover:text-brand-500 transition-colors">
                      {art.title}
                    </span>
                    <span className="text-[10px] text-dark-400 mt-0.5 line-clamp-1">
                      {art.source?.name} • {art.publishedAt}
                    </span>
                  </div>
                </a>
              ))
            ) : (
              <span className="text-xs text-dark-500 text-center py-8">No current climate news articles loaded.</span>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Breakdown & Sustainability Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Footprint metrics card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <h3 className="font-bold text-lg mb-4 text-dark-900 dark:text-white">Footprint Summary</h3>
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-dark-100 dark:border-dark-850 pb-3">
              <span className="text-sm text-dark-400">Daily Log (Today)</span>
              <span className="font-bold">{metrics.dailyEmissions.toFixed(1)} kg CO2e</span>
            </div>
            <div className="flex justify-between items-center border-b border-dark-100 dark:border-dark-850 pb-3">
              <span className="text-sm text-dark-400">Weekly Log (7 days)</span>
              <span className="font-bold">{metrics.weeklyEmissions.toFixed(1)} kg CO2e</span>
            </div>
            <div className="flex justify-between items-center border-b border-dark-100 dark:border-dark-850 pb-3">
              <span className="text-sm text-dark-400">Monthly Log (30 days)</span>
              <span className="font-bold">{metrics.monthlyEmissions.toFixed(1)} kg CO2e</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-dark-400">Total Lifetime Logged</span>
              <span className="font-bold text-brand-500">{metrics.lifetimeEmissions.toFixed(1)} kg CO2e</span>
            </div>
          </div>
          <Link to="/calculator" className="btn-primary mt-6 text-sm w-full py-2">
            <Plus className="w-4 h-4" /> Log Carbon Activity
          </Link>
        </div>

        {/* Recharts Pie Chart categories distribution */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between items-center">
          <h3 className="font-bold text-lg text-left w-full mb-2 text-dark-900 dark:text-white">Emission Distribution</h3>
          {pieData.length > 0 ? (
            <div className="w-full h-44 relative flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(1)} kg`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-brand-500">{metrics.monthlyEmissions.toFixed(0)}</span>
                <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">kg last 30d</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <Leaf className="w-10 h-10 text-dark-500 mb-2" />
              <p className="text-xs text-dark-400">No category emissions logged yet.</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-2 w-full text-left">
            {pieData.map((d, index) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-dark-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="truncate">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sustainability Score Gauge card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between items-center text-center">
          <h3 className="font-bold text-lg text-left w-full text-dark-900 dark:text-white">Sustainability Index</h3>
          <div className="relative flex items-center justify-center my-4">
            {/* Simple circular background graphic */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="52"
                strokeWidth="10"
                stroke="rgba(128,128,128,0.1)"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="52"
                strokeWidth="10"
                stroke="#22c55e"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 52}
                strokeDashoffset={2 * Math.PI * 52 * (1 - metrics.sustainabilityScore / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col">
              <span className="text-3xl font-extrabold text-dark-950 dark:text-white">{metrics.sustainabilityScore}</span>
              <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Score</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-dark-500 mt-2">
            <TrendingDown className="w-4 h-4 text-brand-500" />
            <span>Target daily benchmark $\le$ 15.0 kg</span>
          </div>
          <Link to="/analytics" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500 transition-colors mt-4 flex items-center gap-1.5">
            View Advanced Analytics <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recommendations quick list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommendations column */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-dark-900 dark:text-white">Personalized Green Recommendations</h3>
            <Link to="/recommendations" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="flex flex-col gap-3.5">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 rounded-xl bg-dark-100/50 dark:bg-dark-900/40 border border-dark-200 dark:border-dark-850 flex items-center justify-between gap-4">
                <div className="text-left">
                  <h4 className="font-bold text-sm text-dark-900 dark:text-white">{rec.title}</h4>
                  <p className="text-xs text-dark-400 mt-1 max-w-lg leading-relaxed truncate lg:whitespace-normal">
                    {rec.description}
                  </p>
                </div>
                <div className="flex-shrink-0 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-xs py-1.5 px-3 rounded-lg border border-brand-500/20 text-center">
                  -{rec.estimatedSavings} kg
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Goals Column */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-dark-900 dark:text-white">Active Goals</h3>
            <Link to="/goals" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              Manage
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {activeGoals.length > 0 ? (
              activeGoals.map((g) => (
                <div key={g.id} className="flex flex-col gap-1.5 text-left">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="capitalize">{g.category} Budget</span>
                    <span>{Math.round(g.progress_pct)}%</span>
                  </div>
                  <div className="w-full bg-dark-200 dark:bg-dark-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        g.progress_pct >= 90 ? 'bg-red-500' : 'bg-brand-500'
                      }`}
                      style={{ width: `${Math.min(100, g.progress_pct)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-dark-400">Limit: {g.target_emission} kg CO2e</span>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                <ClipboardList className="w-10 h-10 text-dark-500 mb-2" />
                <p className="text-xs text-dark-400">No active goals currently. Define a monthly reduction target!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Log & Active Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Log */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-dark-900 dark:text-white">Recent Activities</h3>
            <Link to="/calculator" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              View Logs
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-200 dark:border-dark-800 text-[10px] text-dark-400 uppercase font-bold tracking-wider">
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5">Item</th>
                  <th className="py-2.5">Logged Amount</th>
                  <th className="py-2.5">Emissions</th>
                  <th className="py-2.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100 dark:divide-dark-850 text-xs">
                {recentActivities.length > 0 ? (
                  recentActivities.map((act) => (
                    <tr key={act.id} className="text-dark-800 dark:text-dark-200">
                      <td className="py-3 capitalize font-semibold text-brand-600 dark:text-brand-400">
                        {act.category}
                      </td>
                      <td className="py-3 capitalize">
                        {act.subcategory.replace('_', ' ')}
                      </td>
                      <td className="py-3">
                        {act.amount} {act.unit}
                      </td>
                      <td className="py-3 font-semibold">
                        {act.calculated_emissions.toFixed(1)} kg
                      </td>
                      <td className="py-3 text-dark-400">
                        {act.activity_date}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-dark-450">
                      No footprint activities logged. Go to the Calculator to log your first activity!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Challenges enrolled */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-dark-900 dark:text-white">Active Challenges</h3>
            <Link to="/challenges" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              Explore
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {activeChallenges.length > 0 ? (
              activeChallenges.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl bg-dark-100/50 dark:bg-dark-900/40 border border-dark-200 dark:border-dark-800 flex flex-col gap-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-dark-900 dark:text-white truncate">{c.title}</span>
                    <span className="text-[10px] text-brand-500 font-bold">{Math.round(c.progress)}%</span>
                  </div>
                  <div className="w-full bg-dark-200 dark:bg-dark-800 rounded-full h-1.5">
                    <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${c.progress}%` }} />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-dark-400">
                    <span>End date: {c.end_date}</span>
                    <Link to="/challenges" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
                      Go
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center py-6">
                <Trophy className="w-10 h-10 text-dark-500 mb-2" />
                <p className="text-xs text-dark-400">You aren't enrolled in any challenges. Join a green campaign today!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
