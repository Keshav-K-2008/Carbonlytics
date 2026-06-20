import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calculator,
  BarChart3,
  Target,
  Lightbulb,
  Trophy,
  BookOpen,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Leaf,
  Award,
  ShoppingBag,
  Globe
} from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/calculator', label: 'Log Activity', icon: Calculator },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/recommendations', label: 'Reduction Hub', icon: Lightbulb },
    { to: '/goals', label: 'Sustainability Goals', icon: Target },
    { to: '/challenges', label: 'Challenges', icon: Trophy },
    { to: '/education', label: 'Education Hub', icon: BookOpen },
    { to: '/offsets', label: 'Offset Market', icon: ShoppingBag },
    { to: '/news', label: 'Climate News', icon: Globe },
  ];


  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Hamburger Header */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-dark-900 border-b border-dark-800 text-white fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-2 font-bold font-sans text-xl tracking-tight">
          <Leaf className="w-6 h-6 text-brand-500 fill-brand-500/20" />
          <span>Carbon<span className="text-brand-500">lytix</span></span>
        </div>
        <button onClick={toggleSidebar} className="p-1 rounded-lg hover:bg-dark-800 transition-colors">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 lg:w-72 glass-panel border-r border-dark-200 dark:border-dark-800/80 p-6 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:h-screen lg:z-30 pt-20 lg:pt-6`}
      >
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="hidden lg:flex items-center gap-2 px-2">
            <Leaf className="w-8 h-8 text-brand-500 fill-brand-500/20 animate-pulse-subtle" />
            <h1 className="font-sans font-bold text-2xl tracking-tight text-dark-900 dark:text-white">
              Carbon<span className="text-brand-500">lytix</span>
            </h1>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                      isActive
                        ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 border-l-4 border-brand-500 font-semibold'
                        : 'text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-900/50 hover:text-dark-900 dark:hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-brand-500' : 'text-dark-400 dark:text-dark-500'}`} />
                      <span>{link.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}

            {/* Conditional Admin Link */}
            {isAdmin && (
              <NavLink
                to="/admin"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group mt-4 border-t border-dark-100 dark:border-dark-800/80 pt-4 ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-l-4 border-cyan-500 font-semibold'
                      : 'text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-900/50 hover:text-dark-900 dark:hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <ShieldCheck className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-cyan-500' : 'text-dark-400 dark:text-dark-500'}`} />
                    <span>Admin Panel</span>
                  </>
                )}
              </NavLink>
            )}
          </nav>
        </div>

        {/* User profile Widget footer */}
        <div className="flex flex-col gap-4 border-t border-dark-200 dark:border-dark-850 pt-6">
          <div className="flex items-center gap-3.5 px-2">
            <div className="relative">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-brand-500/30"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold text-base flex items-center justify-center ring-2 ring-brand-500/20">
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-brand-500 text-white rounded-full p-0.5 border border-white dark:border-dark-950">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-sans font-bold text-sm text-dark-900 dark:text-white truncate">
                {user?.fullName}
              </span>
              <span className="text-xs text-dark-500 dark:text-dark-400 truncate">
                {user?.email}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay to close sidebar on mobile */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}
    </>
  );
};

export default Sidebar;
