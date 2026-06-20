import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, AlertCircle, Loader2 } from 'lucide-react';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const Signup = () => {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data) => {
    setErrorMsg('');
    setIsSubmitting(true);
    const result = await signup(data.email, data.password, data.fullName);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(result.message || 'Registration failed. Email might already be taken.');
    }
  };

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans bg-grid-pattern relative">
      <div className="absolute top-6 left-6 flex items-center gap-2 font-bold text-xl tracking-tight">
        <Leaf className="w-6 h-6 text-brand-600 fill-brand-500/20" />
        <span className="text-dark-900 dark:text-white">Carbon<span className="text-brand-500">lytix</span></span>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-dark-950 dark:text-white">
          Create a sustainability account
        </h2>
        <p className="mt-2 text-center text-sm text-dark-500 dark:text-dark-400">
          Or{' '}
          <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500 transition-colors">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel py-8 px-4 sm:rounded-2xl sm:px-10 border border-brand-500/10">
          {errorMsg && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex gap-2 items-center text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                {...register('fullName')}
                className={`form-input ${errors.fullName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              />
              {errors.fullName && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`form-input ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className={`form-input ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-dark-300 dark:border-dark-800 bg-transparent rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-dark-700 dark:text-dark-400">
                I agree to the terms and privacy policy
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary disabled:opacity-50 py-3 rounded-xl justify-center text-sm font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
