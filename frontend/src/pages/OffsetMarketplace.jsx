import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Leaf,
  Globe,
  Sun,
  Wind,
  Flame,
  Award,
  Sparkles,
  ShoppingBag,
  CreditCard,
  CheckCircle,
  Clock,
  Printer,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { dashboardAPI } from '../services/api';

const OffsetMarketplace = () => {
  const { user, updateProfileState } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchaseModal, setPurchaseModal] = useState(null); // active package being bought
  const [processing, setProcessing] = useState(false);
  const [certificate, setCertificate] = useState(null); // certificate details on success

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getStats();
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats for marketplace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const packages = [
    {
      id: 'tree_planting',
      title: 'Community Reforestation',
      description: 'Sponsor the planting of native trees in depleted habitats to restore soils and lock away carbon.',
      icon: Leaf,
      iconColor: 'text-green-500',
      iconBg: 'bg-green-500/10',
      cost: 15,
      offsetAmount: 100, // kg
      xpReward: 150,
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'wind_farm',
      title: 'Wind Farm Infrastructure',
      description: 'Fund active wind turbines feeding clean, carbon-free electricity into regional power grids.',
      icon: Wind,
      iconColor: 'text-cyan-500',
      iconBg: 'bg-cyan-500/10',
      cost: 30,
      offsetAmount: 250,
      xpReward: 150,
      image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'solar_grid',
      title: 'Solar Grid Expansions',
      description: 'Support community-owned solar farm installations offsetting dirty coal-powered grids.',
      icon: Sun,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
      cost: 50,
      offsetAmount: 500,
      xpReward: 150,
      image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'methane_capture',
      title: 'Biogas Methane Capture',
      description: 'Fund systems that capture dangerous agricultural methane leaks and convert them to clean energy.',
      icon: Flame,
      iconColor: 'text-red-500',
      iconBg: 'bg-red-500/10',
      cost: 8,
      offsetAmount: 50,
      xpReward: 150,
      image: 'https://images.unsplash.com/photo-1544085311-11a028465b03?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const handlePurchase = async () => {
    if (!purchaseModal) return;
    setProcessing(true);
    try {
      const res = await api.post('/offsets/simulate', {
        offsetType: purchaseModal.id,
        amount: purchaseModal.offsetAmount,
        cost: purchaseModal.cost,
      });

      if (res.data.success) {
        setCertificate(res.data.data.offsetCertificate);
        // Update user state dynamically (points and level)
        updateProfileState({
          points: res.data.data.newPoints,
          fullName: user.fullName, // keep name
        });
        await fetchStats(); // Refresh dashboard statistics
      }
    } catch (err) {
      console.error('Offset transaction failed:', err);
      alert('Simulation transaction failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const lifetimeLogged = stats?.metrics?.lifetimeEmissions || 0;

  return (
    <div className="flex-1 p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto overflow-y-auto font-sans text-left">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-dark-950 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-brand-500" />
            <span>Carbon Offset Marketplace</span>
          </h2>
          <p className="text-dark-500 dark:text-dark-400 text-sm mt-1">
            Fund verified global climate projects to neutralize your carbon emissions and gain XP.
          </p>
        </div>
      </div>

      {/* Carbon balance summary */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-brand-500 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div>
          <span className="text-xs text-dark-400 font-bold uppercase tracking-wider">Lifetime Logged Footprint</span>
          <h3 className="text-3xl font-black text-dark-950 dark:text-white mt-1">
            {lifetimeLogged.toFixed(1)} <span className="text-sm font-bold text-dark-400">kg CO2e</span>
          </h3>
        </div>

        <div>
          <span className="text-xs text-dark-400 font-bold uppercase tracking-wider">Carbon Neutral Status</span>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="h-3.5 w-3.5 rounded-full bg-brand-500 fill-brand-500/10 animate-pulse" />
            <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">Actively Offsetting</span>
          </div>
        </div>

        <div className="flex justify-start md:justify-end">
          <div className="bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-xs py-2 px-4 rounded-xl border border-brand-500/20 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span>Earn 150 XP per project sponsored</span>
          </div>
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {packages.map((pkg) => {
          const Icon = pkg.icon;
          return (
            <div
              key={pkg.id}
              className="glass-panel rounded-3xl overflow-hidden border border-dark-200/50 dark:border-dark-850/80 flex flex-col justify-between group hover:border-brand-500/20 transition-all duration-300 shadow-sm hover:shadow-lg"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={pkg.image}
                  alt={pkg.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 dark:opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex justify-between items-center text-white">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${pkg.iconBg} ${pkg.iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-extrabold text-lg leading-tight">{pkg.title}</h3>
                  </div>
                </div>
              </div>

              <div className="p-6 flex flex-col gap-6 text-left">
                <p className="text-xs text-dark-500 dark:text-dark-400 leading-relaxed">
                  {pkg.description}
                </p>

                <div className="grid grid-cols-3 gap-4 border-t border-b border-dark-100 dark:border-dark-850 py-4 text-xs font-semibold text-dark-500">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Price</span>
                    <span className="text-sm font-extrabold text-dark-900 dark:text-white">${pkg.cost}.00 USD</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">CO₂ Offset</span>
                    <span className="text-sm font-extrabold text-brand-500">-{pkg.offsetAmount} kg</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Reward</span>
                    <span className="text-sm font-extrabold text-yellow-500">+{pkg.xpReward} XP</span>
                  </div>
                </div>

                <button
                  onClick={() => setPurchaseModal(pkg)}
                  className="btn-primary w-full py-2.5 rounded-xl justify-center text-xs font-bold gap-2"
                >
                  <CreditCard className="w-4 h-4" /> Sponsor Offset Project
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Modal Overlay */}
      {purchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-brand-500/20 text-center flex flex-col gap-6 shadow-2xl relative overflow-hidden animate-fade-in">
            {!certificate ? (
              <>
                <h3 className="text-lg font-bold text-dark-950 dark:text-white">Confirm Offset Donation</h3>
                <div className="p-4 bg-dark-100/50 dark:bg-dark-900/40 border border-dark-200 dark:border-dark-850 rounded-2xl flex flex-col gap-3 text-left text-xs">
                  <div className="flex justify-between">
                    <span className="text-dark-400">Selected Project:</span>
                    <span className="font-bold">{purchaseModal.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Carbon Neutralized:</span>
                    <span className="font-bold text-brand-500">-{purchaseModal.offsetAmount} kg CO2e</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Sponsorship Price:</span>
                    <span className="font-bold text-dark-900 dark:text-white">${purchaseModal.cost}.00 USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Profile XP reward:</span>
                    <span className="font-bold text-yellow-500">+{purchaseModal.xpReward} XP</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => setPurchaseModal(null)}
                    disabled={processing}
                    className="flex-1 btn-secondary text-xs py-2.5 rounded-xl justify-center disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePurchase}
                    disabled={processing}
                    className="flex-1 btn-primary text-xs py-2.5 rounded-xl justify-center gap-2 disabled:opacity-50"
                  >
                    {processing ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" /> Processing...
                      </>
                    ) : (
                      'Simulate Purchase'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Success Screen: Certificate generated */}
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-brand-500/20 text-brand-500 rounded-full animate-bounce">
                    <CheckCircle className="w-12 h-12" />
                  </div>
                  <h3 className="text-xl font-black text-brand-500">Offset Transaction Approved!</h3>
                  <p className="text-xs text-dark-400 max-w-xs">
                    Your contribution has successfully neutralized carbon emissions and updated your profile XP.
                  </p>
                </div>

                {/* Styled Certificate */}
                <div className="border-2 border-dashed border-brand-500/30 p-5 rounded-2xl text-left bg-brand-500/5 flex flex-col gap-3 relative">
                  <div className="absolute top-2 right-3 opacity-15">
                    <Leaf className="w-16 h-16 text-brand-500" />
                  </div>
                  <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">Official Carbonlytix Certificate</span>
                  <div className="flex flex-col gap-0.5 mt-2">
                    <span className="text-[10px] text-dark-400">SPONSORED BY:</span>
                    <span className="text-sm font-bold text-dark-900 dark:text-white capitalize">{user?.fullName}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-dark-400">PROJECT:</span>
                    <span className="text-xs font-bold text-dark-850 dark:text-dark-200">{purchaseModal.title}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-dark-400">METRICS</span>
                      <span className="text-xs font-bold text-brand-500">-{certificate.amount} kg CO2e</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-dark-400">XP EARNED</span>
                      <span className="text-xs font-bold text-yellow-500">+{purchaseModal.xpReward} XP</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-dark-400 mt-2 truncate">
                    UUID: {certificate.id}
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="flex-1 btn-secondary text-xs py-2.5 rounded-xl justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button
                    onClick={() => {
                      setCertificate(null);
                      setPurchaseModal(null);
                    }}
                    className="flex-1 btn-primary text-xs py-2.5 rounded-xl justify-center"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OffsetMarketplace;
