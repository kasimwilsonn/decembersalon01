import React, { useState, useEffect } from 'react';
import { Scissors, Lock, Mail, AlertCircle, ArrowRight, X, Shield, Users, Sparkles, Calendar, CreditCard, Zap, Play, CheckCircle2, Star } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  // Auth Form State
  const [formData, setFormData] = useState({ salonName: '', email: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAuth = () => {
    setError('');
    const email = formData.email.trim();
    const password = formData.password.trim();
    const salonName = formData.salonName.trim();

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('zbling_users') || '[]');

    if (isLogin) {
      // Login Logic
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (user) {
        localStorage.setItem('zbling_current_user', JSON.stringify(user));
        // Sync salon name to settings if present
        if (user.salonName) {
            const currentSettings = JSON.parse(localStorage.getItem('shopSettings') || '{}');
            localStorage.setItem('shopSettings', JSON.stringify({ ...currentSettings, name: user.salonName }));
        }
        onLogin();
      } else {
        setError('Invalid email or password. Sign up if you are new.');
      }
    } else {
      // Signup Logic
      if (!salonName) {
        setError('Salon Name is required.');
        return;
      }
      if (users.find((u: any) => u.email === email)) {
        setError('User with this email already exists.');
        return;
      }

      const newUser = { email, password, salonName };
      localStorage.setItem('zbling_users', JSON.stringify([...users, newUser]));
      localStorage.setItem('zbling_current_user', JSON.stringify(newUser));
      
      // Initialize default settings for new user
      const defaultSettings = {
          name: salonName,
          address: '123, Luxury Lane, City',
          gstin: 'URD',
          taxRate: 18,
          phone: '',
          logo: ''
      };
      localStorage.setItem('shopSettings', JSON.stringify(defaultSettings));
      
      onLogin();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAuth();
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-rose-200 overflow-x-hidden">
      
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrollY > 20 ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-stone-900 p-2 rounded-full">
              <Scissors className="h-5 w-5 text-white" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-stone-900">Z Bling</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            {['Features', 'Testimonials', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-stone-600 hover:text-stone-900 transition tracking-wide uppercase">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setIsLogin(true); setShowAuth(true); setError(''); }}
              className="hidden sm:block text-sm font-bold text-stone-600 hover:text-stone-900 transition"
            >
              Log In
            </button>
            <button 
              onClick={() => { setIsLogin(false); setShowAuth(true); setError(''); }}
              className="bg-stone-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-stone-800 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-orange-100/40 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-rose-100/40 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-stone-200 rounded-full text-xs font-bold uppercase tracking-wider text-stone-500 shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <Sparkles size={12} className="text-amber-500" /> The Gold Standard for Salons
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-serif font-medium text-stone-900 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700">
              Manage your salon with <span className="italic text-stone-500">elegance.</span>
            </h1>
            
            <p className="text-xl text-stone-600 leading-relaxed max-w-lg mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              A comprehensive operating system designed for modern beauty businesses. From intelligent booking to AI-driven marketing.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
               <button 
                  onClick={() => { setIsLogin(false); setShowAuth(true); setError(''); }}
                  className="px-8 py-4 bg-stone-900 text-white rounded-full font-bold text-lg hover:bg-stone-800 transition shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
                >
                  Start Free Trial <ArrowRight size={18} />
                </button>
               <button className="px-8 py-4 bg-white text-stone-800 border border-stone-200 rounded-full font-bold text-lg hover:border-stone-400 transition shadow-sm flex items-center justify-center gap-2 group">
                  <Play size={16} className="fill-stone-800" /> Watch Demo
                </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="text-4xl font-serif text-stone-900 mb-6">Orchestrate your entire business.</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { icon: Calendar, title: "Smart Scheduling", desc: "Drag-and-drop calendar." },
                    { icon: Sparkles, title: "AI Marketing", desc: "Generate campaigns instantly." },
                    { icon: CreditCard, title: "Seamless POS", desc: "Fast checkout & Billing." },
                    { icon: Users, title: "Client CRM", desc: "Detailed profiles & history." },
                    { icon: Zap, title: "Staff Performance", desc: "Track commissions & targets." },
                    { icon: Shield, title: "Business Reports", desc: "Deep insights into growth." }
                ].map((feature, i) => (
                    <div key={i} className="p-8 rounded-3xl border border-stone-100 bg-stone-50/50 hover:bg-white hover:shadow-xl transition-all duration-300 group cursor-default">
                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-sm border border-stone-100">
                            <feature.icon className="h-6 w-6 text-stone-800" />
                        </div>
                        <h3 className="text-xl font-bold text-stone-900 mb-3">{feature.title}</h3>
                        <p className="text-stone-500 leading-relaxed text-sm">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuth && (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 transition-all"
            onClick={() => setShowAuth(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-2xl font-serif font-bold text-stone-900">{isLogin ? 'Welcome Back' : 'Join Z Bling'}</h3>
                    <p className="text-stone-500 text-sm mt-1">{isLogin ? 'Enter your details to access.' : 'Start your luxury journey.'}</p>
                 </div>
                 <button onClick={() => setShowAuth(false)} className="bg-stone-100 p-2 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-200 transition"><X size={20} /></button>
              </div>

              <div className="space-y-5" onKeyDown={handleKeyDown}>
                {!isLogin && (
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-stone-400 uppercase tracking-wide ml-1">Salon Name</label>
                     <div className="relative group">
                          <Shield className="absolute left-4 top-3.5 text-stone-400 group-focus-within:text-stone-900 transition" size={18}/>
                          <input 
                            type="text" 
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 outline-none text-stone-800 font-medium placeholder:text-stone-400 transition" 
                            placeholder="My Luxury Salon" 
                            value={formData.salonName}
                            onChange={(e) => setFormData({...formData, salonName: e.target.value})}
                          />
                     </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wide ml-1">Email Address</label>
                  <div className="relative group">
                      <Users className="absolute left-4 top-3.5 text-stone-400 group-focus-within:text-stone-900 transition" size={18}/>
                      <input 
                        type="email" 
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 outline-none text-stone-800 font-medium placeholder:text-stone-400 transition" 
                        placeholder="salon@example.com" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wide ml-1">Password</label>
                   <div className="relative group">
                      <Shield className="absolute left-4 top-3.5 text-stone-400 group-focus-within:text-stone-900 transition" size={18}/>
                      <input 
                        type="password" 
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 outline-none text-stone-800 font-medium placeholder:text-stone-400 transition" 
                        placeholder="••••••••" 
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                  </div>
                </div>
                
                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl font-bold animate-in fade-in slide-in-from-top-2 border border-red-100">
                        <AlertCircle size={16}/> {error}
                    </div>
                )}

                <button 
                  onClick={handleAuth}
                  className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-stone-900/20 hover:bg-black transition-all flex items-center justify-center gap-2 mt-6 group"
                >
                  {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                
                <div className="text-center text-sm text-stone-500 mt-6 font-medium">
                  {isLogin ? "New here? " : "Have an account? "}
                  <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-stone-900 font-bold hover:underline">
                    {isLogin ? 'Create account' : 'Sign in'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;