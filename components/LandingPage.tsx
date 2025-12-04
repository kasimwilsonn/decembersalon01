
import React, { useState, useEffect } from 'react';
import { Scissors, Calendar, Users, Star, Check, ArrowRight, X, Sparkles, Shield, Zap, CreditCard, Play, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';

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
            
            <div className="pt-8 flex items-center justify-center lg:justify-start gap-4 text-sm font-medium text-stone-500">
                <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-stone-200 overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="User" />
                        </div>
                    ))}
                </div>
                <p>Trusted by 2,000+ Stylists</p>
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
             <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/50 bg-white">
                <img 
                    src="https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=2000&auto=format&fit=crop" 
                    alt="Salon Dashboard" 
                    className="w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent flex items-end p-8">
                    <div className="bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-lg max-w-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-green-100 rounded-full text-green-700">
                                <Check size={16} />
                            </div>
                            <div>
                                <p className="font-bold text-stone-900 text-sm">Appointment Confirmed</p>
                                <p className="text-xs text-stone-500">Sarah just booked a Hair Spa</p>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-stone-900 w-2/3"></div>
                        </div>
                    </div>
                </div>
             </div>
             
             {/* Floating Elements */}
             <div className="absolute -top-12 -right-8 bg-white p-4 rounded-2xl shadow-xl border border-stone-100 animate-float hidden md:block">
                 <div className="flex items-center gap-3">
                     <div className="bg-rose-50 p-2 rounded-lg text-rose-500"><Users size={20} /></div>
                     <div>
                         <p className="text-xs text-stone-400 font-bold uppercase">New Clients</p>
                         <p className="text-xl font-bold text-stone-900">+128%</p>
                     </div>
                 </div>
             </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="text-4xl font-serif text-stone-900 mb-6">Orchestrate your entire business.</h2>
                <p className="text-lg text-stone-500">Everything you need to run a world-class salon, simplified into one beautiful interface.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {[
                    {
                        icon: Calendar,
                        title: "Smart Scheduling",
                        desc: "Drag-and-drop calendar that prevents double bookings and manages staff availability seamlessly.",
                        bg: "bg-blue-50"
                    },
                    {
                        icon: Sparkles,
                        title: "AI Marketing",
                        desc: "Generate professional campaigns with Gemini AI. Keep clients engaged without lifting a finger.",
                        bg: "bg-purple-50"
                    },
                    {
                        icon: CreditCard,
                        title: "Seamless POS",
                        desc: "Fast checkout, split payments, inventory tracking, and automated GST billing.",
                        bg: "bg-emerald-50"
                    },
                    {
                        icon: Users,
                        title: "Client CRM",
                        desc: "Detailed client profiles, history tracking, and loyalty points system built-in.",
                        bg: "bg-orange-50"
                    },
                    {
                        icon: Zap,
                        title: "Staff Performance",
                        desc: "Track commissions, set targets, and monitor daily performance reports automatically.",
                        bg: "bg-amber-50"
                    },
                    {
                        icon: Shield,
                        title: "Business Reports",
                        desc: "Deep insights into revenue, growth, and retention. Make data-backed decisions.",
                        bg: "bg-stone-100"
                    }
                ].map((feature, i) => (
                    <div key={i} className="p-8 rounded-3xl border border-stone-100 bg-stone-50/50 hover:bg-white hover:shadow-xl transition-all duration-300 group cursor-default">
                        <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                            <feature.icon className="h-6 w-6 text-stone-800" />
                        </div>
                        <h3 className="text-xl font-bold text-stone-900 mb-3">{feature.title}</h3>
                        <p className="text-stone-500 leading-relaxed text-sm">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Testimonials / Social Proof */}
      <section id="testimonials" className="py-24 bg-stone-900 text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
              <div>
                  <div className="flex gap-1 mb-6">
                      {[1,2,3,4,5].map(i => <Star key={i} size={20} className="fill-amber-400 text-amber-400"/>)}
                  </div>
                  <h2 className="text-4xl lg:text-5xl font-serif leading-tight mb-8">"Z Bling transformed how we operate. It feels like having a digital manager working 24/7."</h2>
                  <div>
                      <p className="text-lg font-bold">Elena Rossi</p>
                      <p className="text-stone-400">Owner, Lumiere Spa & Salon</p>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                  <div className="bg-stone-800 p-6 rounded-2xl border border-stone-700">
                      <h4 className="text-3xl font-bold text-white mb-1">30%</h4>
                      <p className="text-stone-400 text-sm">Increase in bookings</p>
                  </div>
                  <div className="bg-stone-800 p-6 rounded-2xl border border-stone-700 translate-y-8">
                      <h4 className="text-3xl font-bold text-white mb-1">10hrs</h4>
                      <p className="text-stone-400 text-sm">Saved weekly on admin</p>
                  </div>
              </div>
          </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-serif text-stone-900 mb-4">Transparent Investment</h2>
                <p className="text-stone-500">Choose the plan that fits your salon's stage.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
                {/* Free */}
                <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition">
                    <h3 className="font-bold text-stone-900 text-xl mb-2">Starter</h3>
                    <div className="text-4xl font-serif text-stone-900 mb-6">Free</div>
                    <ul className="space-y-4 mb-8">
                        {['1 Staff Member', 'Basic Scheduling', 'Client History', 'Online Booking'].map(feat => (
                            <li key={feat} className="flex items-center gap-3 text-sm text-stone-600">
                                <CheckCircle2 size={16} className="text-stone-900"/> {feat}
                            </li>
                        ))}
                    </ul>
                    <button onClick={() => { setIsLogin(false); setShowAuth(true); setError(''); }} className="w-full py-3 rounded-xl border border-stone-200 font-bold text-stone-600 hover:border-stone-900 hover:text-stone-900 transition">Get Started</button>
                </div>

                {/* Pro */}
                <div className="bg-stone-900 p-10 rounded-3xl shadow-2xl relative transform scale-105 text-white">
                    <div className="absolute top-4 right-8 bg-amber-400 text-stone-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Best Value</div>
                    <h3 className="font-bold text-white text-xl mb-2">Professional</h3>
                    <div className="text-5xl font-serif text-white mb-6">₹1499<span className="text-lg font-sans font-medium text-stone-400">/mo</span></div>
                    <ul className="space-y-4 mb-10">
                        {['Up to 5 Staff', 'AI Marketing Suite', 'Inventory & POS', 'WhatsApp Reminders', 'Staff Commission'].map(feat => (
                            <li key={feat} className="flex items-center gap-3 text-sm font-medium">
                                <CheckCircle2 size={18} className="text-amber-400"/> {feat}
                            </li>
                        ))}
                    </ul>
                    <button onClick={() => { setIsLogin(false); setShowAuth(true); setError(''); }} className="w-full py-4 rounded-xl bg-amber-400 text-stone-900 font-bold hover:bg-amber-300 transition shadow-lg">Start Free Trial</button>
                </div>

                {/* Enterprise */}
                <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition">
                    <h3 className="font-bold text-stone-900 text-xl mb-2">Enterprise</h3>
                    <div className="text-4xl font-serif text-stone-900 mb-6">₹4999<span className="text-lg font-sans font-medium text-stone-400">/mo</span></div>
                    <ul className="space-y-4 mb-8">
                        {['Unlimited Staff', 'Multi-Location', 'Advanced Analytics', 'Dedicated Manager'].map(feat => (
                            <li key={feat} className="flex items-center gap-3 text-sm text-stone-600">
                                <CheckCircle2 size={16} className="text-stone-900"/> {feat}
                            </li>
                        ))}
                    </ul>
                    <button className="w-full py-3 rounded-xl border border-stone-200 font-bold text-stone-600 hover:border-stone-900 hover:text-stone-900 transition">Contact Sales</button>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-16">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-2">
                  <div className="bg-stone-900 p-2 rounded-full">
                      <Scissors className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-serif text-xl font-bold text-stone-900">Z Bling</span>
              </div>
              <div className="text-sm text-stone-500 font-medium">
                  © 2024 Z Bling. Crafted for excellence.
              </div>
              <div className="flex gap-6">
                  {['Privacy', 'Terms', 'Contact'].map(link => (
                      <a key={link} href="#" className="text-sm font-medium text-stone-500 hover:text-stone-900 transition">{link}</a>
                  ))}
              </div>
          </div>
      </footer>

      {/* Auth Modal - Elegant Style */}
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
