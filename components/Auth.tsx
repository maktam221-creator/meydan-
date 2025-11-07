import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import Spinner from './icons/Spinner';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    if (isSignUp) {
      // Handle Sign Up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        setError(error.message);
      } else if (data.user && !data.session) {
        setMessage('Account created! Please check your email to verify your account.');
      }
    } else {
      // Handle Sign In
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      }
      // Successful login is handled by the onAuthStateChange listener in App.tsx
    }
    setLoading(false);
  };

  const toggleForm = () => {
      setIsSignUp(!isSignUp);
      setEmail('');
      setPassword('');
      setMessage('');
      setError('');
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <div className="text-center mb-8">
             <h1 className="text-5xl font-bold text-white tracking-wider">
                Meydan <span className="text-blue-500">ميدان</span>
             </h1>
             <p className="text-gray-400 mt-2">Connect and share in your social space.</p>
        </div>
      <div className="w-full max-w-sm p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
        <h2 className="text-2xl font-bold text-center text-white mb-6">
          {isSignUp ? 'Create an Account' : 'Sign In'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">
              Email Address
            </label>
            <input
              id="email"
              className="w-full bg-gray-700 text-white placeholder-gray-400 p-3 rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">
              Password
            </label>
            <input
              id="password"
              className="w-full bg-gray-700 text-white placeholder-gray-400 p-3 rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <button
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-500 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? <Spinner /> : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </div>
        </form>
        {message && <p className="mt-4 text-center text-green-400">{message}</p>}
        {error && <p className="mt-4 text-center text-red-400">{error}</p>}
        <p className="text-center text-gray-400 text-sm mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={toggleForm} className="font-semibold text-blue-400 hover:text-blue-300 ml-1">
                {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;