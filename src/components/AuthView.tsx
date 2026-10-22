import { useState } from 'react';
import {
  Package,
  Activity,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Heart,
  AlertCircle,
} from 'lucide-react';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useAuth } from '@/lib/auth';
import type { Theme } from '@/lib/themes';
import type { Role } from '@/lib/supabase';
import { validateEmail } from '@/lib/emailValidation';

export function AuthView({
  theme,
  themeId,
  setThemeId,
}: {
  theme: Theme;
  themeId: string;
  setThemeId: (id: string) => void;
}) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('donor');
  const [error, setError] = useState<string | null>(null);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailSuggestion(null);
    if (value.includes('@')) {
      const result = validateEmail(value);
      if (result.suggestion) {
        setEmailSuggestion(result.suggestion);
      }
    }
  };

  const acceptSuggestion = () => {
    if (emailSuggestion) {
      setEmail(emailSuggestion);
      setEmailSuggestion(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Validate email before submitting
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      if (emailCheck.suggestion) {
        setError(emailCheck.error || 'Please check your email address.');
        setEmailSuggestion(emailCheck.suggestion);
      } else {
        setError(emailCheck.error || 'Please enter a valid email address.');
      }
      setSubmitting(false);
      return;
    }

    // If there's a suggestion that hasn't been accepted, show it and stop
    if (emailSuggestion && email !== emailSuggestion) {
      setError(`Did you mean ${emailSuggestion}? Click to use it.`);
      setSubmitting(false);
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your name.');
        setSubmitting(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setSubmitting(false);
        return;
      }
      const { error: err } = await signUp(email, password, name.trim(), role);
      if (err) setError(err);
    } else {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-6 right-6 z-50">
        <ThemeSelector activeThemeId={themeId} setThemeId={setThemeId} />
      </div>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div
          className={`absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br ${theme.bgLight} to-white opacity-60 blur-3xl transition-colors duration-700`}
        ></div>
        <div
          className={`absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-gradient-to-tl ${theme.bgLight} to-slate-100 opacity-60 blur-3xl transition-colors duration-700`}
        ></div>
      </div>

      <div className="max-w-5xl w-full mx-auto px-4 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-12">
        <div className="space-y-8 text-center lg:text-left">
          <div
            className={`inline-flex items-center space-x-2 ${theme.bgSoft} border ${theme.borderSoft} ${theme.textDark} px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm`}
          >
            <Sparkles className={`w-4 h-4 ${theme.textPrimary}`} />
            <span>Smart Digital Logistics Platform</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Route surplus to <br className="hidden lg:block" />
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme.textGradient}`}>
              those in need.
            </span>
          </h1>
          <p className="text-lg lg:text-xl text-slate-600 max-w-xl mx-auto lg:mx-0">
            Join the network connecting excess food, medicine, and clothing directly to verified NGOs and
            vulnerable communities.
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white shadow-black/5">
          <div className="flex items-center justify-center mb-6">
            <div className={`bg-gradient-to-br ${theme.gradient} p-2.5 rounded-2xl shadow-lg ${theme.shadow}`}>
              <Heart className="w-7 h-7 text-white" fill="currentColor" />
            </div>
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Create Account
            </button>
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Sign In
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  How would you like to be known?
                </label>
                <input
                  type="text"
                  required
                  className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 ${theme.ring} ${theme.focusBorderActive} transition-all font-medium`}
                  placeholder="Your Name or Organization"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 ${theme.ring} ${theme.focusBorderActive} transition-all font-medium ${
                  emailSuggestion ? 'border-amber-300' : ''
                }`}
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
              />
              {emailSuggestion && emailSuggestion !== email && (
                <button
                  type="button"
                  onClick={acceptSuggestion}
                  className="mt-2 w-full p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-left transition-all hover:bg-amber-100"
                >
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-medium text-amber-700">
                      Did you mean{' '}<span className="font-bold underline">{emailSuggestion}</span>?
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-600 shrink-0 ml-2">Use this</span>
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                required
                className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 ${theme.ring} ${theme.focusBorderActive} transition-all font-medium`}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Select your role to continue
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('donor')}
                    className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-300 ${
                      role === 'donor'
                        ? `${theme.borderActive} ${theme.bgSoft} shadow-md ${theme.shadow} scale-[1.02]`
                        : `border-slate-100 bg-white ${theme.hoverSoft}`
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${
                        role === 'donor' ? theme.iconSolid : theme.iconSoft
                      }`}
                    >
                      <Package className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900">Donor</h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">I have surplus items to give</p>
                    {role === 'donor' && (
                      <CheckCircle2 className={`absolute top-4 right-4 w-6 h-6 ${theme.textPrimary}`} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('ngo')}
                    className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-300 ${
                      role === 'ngo'
                        ? `${theme.borderActive} ${theme.bgSoft} shadow-md ${theme.shadow} scale-[1.02]`
                        : `border-slate-100 bg-white ${theme.hoverSoft}`
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${
                        role === 'ngo' ? theme.iconSolid : theme.iconSoft
                      }`}
                    >
                      <Activity className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900">NGO Partner</h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">I help distribute items</p>
                    {role === 'ngo' && (
                      <CheckCircle2 className={`absolute top-4 right-4 w-6 h-6 ${theme.textPrimary}`} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl flex items-center space-x-3 bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full flex justify-center items-center space-x-2 py-4 px-6 border border-transparent rounded-2xl text-lg font-bold text-white bg-gradient-to-r ${theme.gradientButton} ${theme.gradientHover} focus:outline-none focus:ring-4 ${theme.ring} disabled:opacity-50 disabled:cursor-not-allowed shadow-xl ${theme.shadow} transition-all duration-300`}
            >
              <span>{submitting ? 'Please wait...' : mode === 'signup' ? 'Enter CareDrop' : 'Sign In'}</span>
              {!submitting && <ChevronRight className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
