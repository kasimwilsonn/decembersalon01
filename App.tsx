
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Users, 
  Package, 
  Settings as SettingsIcon, 
  Sparkles, 
  LogOut,
  Menu,
  X,
  PieChart,
  UserCircle,
  TrendingUp,
  CreditCard,
  PlusCircle,
  Bell,
  Search,
  ChevronRight,
  ChevronLeft,
  Scissors,
  Calendar,
  DollarSign,
  Receipt,
  Printer,
  FileText,
  Wallet,
  Activity,
  Star,
  MapPin
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import Operations from './components/Operations';
import CRM from './components/CRM';
import StaffManager from './components/StaffManager';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import Expenses from './components/Expenses';
import Settings from './components/Settings';
import AppointmentModal, { BookingInitialData } from './components/AppointmentModal';
import { generateMarketingContent } from './services/geminiService';
import { sendAppointmentConfirmation } from './services/notificationService';
import type { Role, Appointment, Bill, Expense, AppointmentStatus, Customer, Service, Staff, Product } from './types';
import { Role as RoleEnum, AppointmentStatus as AppointmentStatusEnum } from './types';

// Default Permissions Configuration
const DEFAULT_PERMISSIONS: Record<string, typeof RoleEnum[keyof typeof RoleEnum][]> = {
  'DASHBOARD': [RoleEnum.OWNER, RoleEnum.SALON_MANAGER, RoleEnum.SENIOR_STYLIST, RoleEnum.RECEPTIONIST],
  'APPOINTMENTS': [RoleEnum.OWNER, RoleEnum.SALON_MANAGER, RoleEnum.SENIOR_STYLIST, RoleEnum.RECEPTIONIST],
  'BILLING': [RoleEnum.OWNER, RoleEnum.SALON_MANAGER, RoleEnum.RECEPTIONIST],
  'CRM': [RoleEnum.OWNER, RoleEnum.SALON_MANAGER, RoleEnum.SENIOR_STYLIST, RoleEnum.RECEPTIONIST],
  'STAFF': [RoleEnum.OWNER, RoleEnum.SALON_MANAGER], 
  'INVENTORY': [RoleEnum.OWNER, RoleEnum.SALON_MANAGER, RoleEnum.RECEPTIONIST],
  'EXPENSES': [RoleEnum.OWNER, RoleEnum.SALON_MANAGER],
  'REPORTS': [RoleEnum.OWNER, RoleEnum.SALON_MANAGER],
  'MARKETING': [RoleEnum.OWNER, RoleEnum.SALON_MANAGER],
  'SETTINGS': [RoleEnum.OWNER, RoleEnum.SALON_MANAGER], 
};

// Simple Line Chart Component
const SimpleLineChart = ({ data, color }: { data: {label: string, value: number}[], color: string }) => {
  const max = Math.max(...data.map(d => d.value), 1000); 
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.value / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-48 w-full relative mt-6">
       <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
         {/* Grid lines */}
         {[0, 25, 50, 75, 100].map(p => (
            <line key={p} x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
         ))}
         
         {/* Area Fill */}
         <defs>
            <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
         </defs>
         <path d={`M 0,100 ${points.split(' ').map(p => 'L ' + p).join(' ')} L 100,100 Z`} fill={`url(#grad-${color})`} stroke="none" />
         
         {/* Line */}
         <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
       </svg>
       
       {/* X-Axis Labels */}
       <div className="absolute top-[105%] w-full flex justify-between text-[10px] text-slate-400 font-bold uppercase">
          {data.map((d, i) => <span key={i}>{d.label}</span>)}
       </div>
       
       {/* Points */}
       {data.map((d, i) => (
           <div 
            key={i} 
            className="absolute w-3 h-3 rounded-full bg-white border-2 hover:scale-125 transition-transform cursor-pointer shadow-sm group"
            style={{ 
                left: `${(i / (data.length - 1)) * 100}%`, 
                top: `${100 - (d.value / max) * 100}%`, 
                borderColor: color,
                transform: 'translate(-50%, -50%)'
            }}
           >
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-bold z-10">
                    ₹{d.value.toLocaleString()}
                </div>
           </div>
       ))}
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'APPOINTMENTS' | 'BILLING' | 'CRM' | 'STAFF' | 'INVENTORY' | 'REPORTS' | 'MARKETING' | 'EXPENSES' | 'SETTINGS'>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentBranch, setCurrentBranch] = useState('Main Branch');
  
  // Navigation State for Deep Linking
  const [targetAppointmentId, setTargetAppointmentId] = useState<string | null>(null);

  // Global Data State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shopSettings, setShopSettings] = useState({
      name: 'Z Bling Professional',
      address: '123, Fashion Street',
      gstin: 'URD',
      taxRate: 18,
      phone: '9999999999',
      logo: ''
  });
  
  // Modal State
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [bookingInitialData, setBookingInitialData] = useState<BookingInitialData | null>(null);

  // Role & Permissions State
  const [userRole, setUserRole] = useState<Role>(RoleEnum.OWNER);
  const [permissions, setPermissions] = useState<Record<string, Role[]>>(() => {
      const saved = localStorage.getItem('appPermissions');
      return saved ? JSON.parse(saved) : DEFAULT_PERMISSIONS;
  });

  // Marketing AI State
  const [marketingResult, setMarketingResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Dashboard Real-time Data State
  const [dashboardMetrics, setDashboardMetrics] = useState({
      todayRevenue: 0,
      weeklyRevenue: 0,
      monthlyRevenue: 0,
      todayExpenses: 0,
      totalAppointments: 0,
      pendingAppointments: 0
  });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<{label: string, value: number}[]>([]);
  const [topServices, setTopServices] = useState<{name: string, count: number}[]>([]);

  // Check Auth Status on Mount
  useEffect(() => {
      const currentUser = localStorage.getItem('zbling_current_user');
      if (currentUser) {
          setIsAuthenticated(true);
      }
  }, []);

  const handleLogout = () => {
      localStorage.removeItem('zbling_current_user');
      setIsAuthenticated(false);
  };

  // INITIAL DATA LOADING
  useEffect(() => {
      // Appointments
      const savedAppts = localStorage.getItem('appointments');
      if (savedAppts) setAppointments(JSON.parse(savedAppts));

      // Customers
      const savedCusts = localStorage.getItem('customers');
      if (savedCusts) setCustomers(JSON.parse(savedCusts));

      // Bills
      const savedBills = localStorage.getItem('bills');
      if (savedBills) setBills(JSON.parse(savedBills));

      // Expenses
      const savedExpenses = localStorage.getItem('expenses');
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));

      // Shop Settings
      const savedShop = localStorage.getItem('shopSettings');
      if (savedShop) setShopSettings(JSON.parse(savedShop));

      // Services
      const savedServices = localStorage.getItem('services');
      if (savedServices) {
          setServices(JSON.parse(savedServices));
      } else {
          const defaultServices: Service[] = [
               { id: '1', name: 'Haircut (Men)', price: 350, durationMins: 30, category: 'Haircuts' },
               { id: '2', name: 'Haircut (Women)', price: 800, durationMins: 60, category: 'Haircuts' },
               { id: '6', name: 'Root Touch Up', price: 1000, durationMins: 45, category: 'Coloring' },
          ];
          setServices(defaultServices);
          localStorage.setItem('services', JSON.stringify(defaultServices));
      }

      // Staff
      const savedStaff = localStorage.getItem('staffList');
      if (savedStaff) {
          setStaffList(JSON.parse(savedStaff));
      } else {
           const initialStaff: Staff[] = [
              { id: 'S1', name: 'Rahul (Senior)', role: RoleEnum.SENIOR_STYLIST, commissionRate: 15, phone: '9999999999', isActive: true },
              { id: 'S2', name: 'Priya (Makeup)', role: RoleEnum.MAKEUP_ARTIST, commissionRate: 20, phone: '8888888888', isActive: true },
              { id: 'S3', name: 'Amit (Manager)', role: RoleEnum.SALON_MANAGER, commissionRate: 0, phone: '7777777777', isActive: true },
          ];
          setStaffList(initialStaff);
          localStorage.setItem('staffList', JSON.stringify(initialStaff));
      }

      // Products
      const savedProducts = localStorage.getItem('products');
      if (savedProducts) {
          setProducts(JSON.parse(savedProducts));
      } else {
          const defaultProducts: Product[] = [
              { id: 'P1', name: 'Loreal Shampoo 1L', category: 'Hair Care', stock: 5, price: 1200, costPrice: 800, lowStockThreshold: 10, sku: 'LOR-001' },
              { id: 'P2', name: 'O3+ Facial Kit', category: 'Skin Care', stock: 25, price: 3500, costPrice: 2000, lowStockThreshold: 5, sku: 'O3-002' },
          ];
          setProducts(defaultProducts);
          localStorage.setItem('products', JSON.stringify(defaultProducts));
      }
  }, []);

  // --- STATE UPDATERS (PERSIST TO LOCALSTORAGE) ---
  const handleUpdateAppointments = (newAppts: Appointment[]) => {
      setAppointments(newAppts);
      localStorage.setItem('appointments', JSON.stringify(newAppts));
  };

  const handleUpdateCustomers = (newCustomers: Customer[]) => {
      setCustomers(newCustomers);
      localStorage.setItem('customers', JSON.stringify(newCustomers));
  };

  const handleUpdateStaff = (newStaff: Staff[]) => {
      setStaffList(newStaff);
      localStorage.setItem('staffList', JSON.stringify(newStaff));
  };

  const handleUpdateProducts = (newProducts: Product[]) => {
      setProducts(newProducts);
      localStorage.setItem('products', JSON.stringify(newProducts));
  };

  const handleUpdateBills = (newBills: Bill[]) => {
      setBills(newBills);
      localStorage.setItem('bills', JSON.stringify(newBills));
  };

  const handleUpdateExpenses = (newExpenses: Expense[]) => {
      setExpenses(newExpenses);
      localStorage.setItem('expenses', JSON.stringify(newExpenses));
  };

  const handleUpdateShopSettings = (newSettings: any) => {
      setShopSettings(newSettings);
      localStorage.setItem('shopSettings', JSON.stringify(newSettings));
  };

  // DASHBOARD METRICS CALCULATION
  useEffect(() => {
      if (activeTab === 'DASHBOARD') {
          const validBills = bills.filter(b => b.status !== 'REFUNDED');
          
          const today = new Date().toISOString().split('T')[0];
          const currentMonth = today.slice(0, 7); // YYYY-MM
          
          // Helper for Week Calculation
          const getWeekStart = (d: Date) => {
            const date = new Date(d);
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
            return new Date(date.setDate(diff));
          }
          const startOfWeek = getWeekStart(new Date()).toISOString().split('T')[0];

          // --- REVENUE CALCULATION LOGIC ---
          let tRev = 0;
          let wRev = 0;
          let mRev = 0;

          validBills.forEach(b => {
             if (!b.payments || b.payments.length === 0) {
                 if (b.date === today) tRev += b.amountPaid;
                 if (b.date >= startOfWeek) wRev += b.amountPaid;
                 if (b.date.startsWith(currentMonth)) mRev += b.amountPaid;
             } else {
                 b.payments.forEach(p => {
                     if (p.date === today) tRev += p.amount;
                     if (p.date >= startOfWeek) wRev += p.amount;
                     if (p.date.startsWith(currentMonth)) mRev += p.amount;
                 });
             }
          });

          const tExp = expenses.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);

          const todaysAppts = appointments.filter(a => a.date === today);
          const pending = todaysAppts.filter(a => a.status === AppointmentStatusEnum.SCHEDULED || a.status === AppointmentStatusEnum.IN_PROGRESS).length;

          setDashboardMetrics({
              todayRevenue: tRev,
              weeklyRevenue: wRev,
              monthlyRevenue: mRev,
              todayExpenses: tExp,
              totalAppointments: todaysAppts.length,
              pendingAppointments: pending
          });

          setTodayAppointments(todaysAppts.sort((a,b) => a.time.localeCompare(b.time)));

          const last7Days = Array.from({length: 7}, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - 6 + i);
              return d.toISOString().split('T')[0];
          });

          const trend = last7Days.map(date => {
              let dayTotal = 0;
              validBills.forEach(b => {
                 if (!b.payments || b.payments.length === 0) {
                     if(b.date === date) dayTotal += b.amountPaid;
                 } else {
                     b.payments.forEach(p => {
                         if(p.date === date) dayTotal += p.amount;
                     });
                 }
              });
              return { 
                  label: new Date(date).toLocaleDateString('en-US', {weekday: 'short'}), 
                  value: dayTotal 
              };
          });
          setRevenueTrend(trend);

          const completedAppts = appointments.filter(a => a.status === AppointmentStatusEnum.COMPLETED);
          const serviceCounts: Record<string, number> = {};
          
          completedAppts.forEach(a => {
              a.serviceIds.forEach(sid => {
                  const sName = services.find(s => s.id === sid)?.name || 'Unknown';
                  serviceCounts[sName] = (serviceCounts[sName] || 0) + 1;
              });
          });

          const topSrv = Object.entries(serviceCounts)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 4)
              .map(([name, count]) => ({name, count}));
          setTopServices(topSrv);
      }
  }, [activeTab, appointments, services, bills, expenses]);

  const checkAccess = (tab: string) => {
    return permissions[tab]?.includes(userRole) ?? false;
  };

  const handleRoleChange = (newRole: Role) => {
      setUserRole(newRole);
      if (!permissions[activeTab]?.includes(newRole) && newRole !== RoleEnum.OWNER) {
          setActiveTab('DASHBOARD');
      }
  };

  const handlePermissionUpdate = (newPermissions: Record<string, Role[]>) => {
      setPermissions(newPermissions);
      localStorage.setItem('appPermissions', JSON.stringify(newPermissions));
  };

  const handleMarketingGen = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    const form = e.target as HTMLFormElement;
    const type = (form.elements.namedItem('type') as HTMLInputElement).value;
    const name = (form.elements.namedItem('cname') as HTMLInputElement).value;
    const offer = (form.elements.namedItem('offer') as HTMLInputElement).value;

    const result = await generateMarketingContent(type, name, offer);
    setMarketingResult(result);
    setIsGenerating(false);
  };

  const navigateToJobCard = (apptId: string) => {
      setTargetAppointmentId(apptId);
      setActiveTab('APPOINTMENTS');
  };

  const handleOpenNewAppointment = (data?: BookingInitialData) => {
    setBookingInitialData(data || null);
    setShowAppointmentModal(true);
  };

  const handleBookAppointment = async (
      newAppt: Appointment, 
      newCustomer?: Customer, 
      newService?: Service, 
      newStaff?: Staff
  ) => {
      if (newCustomer) {
          handleUpdateCustomers([...customers, newCustomer]);
      }

      if (newService) {
          const updatedServices = [...services, newService];
          setServices(updatedServices);
          localStorage.setItem('services', JSON.stringify(updatedServices));
      }

      if (newStaff) {
          handleUpdateStaff([...staffList, newStaff]);
      }

      handleUpdateAppointments([...appointments, newAppt]);

      setShowAppointmentModal(false);
      setBookingInitialData(null);

      let phone = newCustomer?.phone;
      if (!phone) {
          const existing = customers.find(c => c.id === newAppt.customerId);
          phone = existing?.phone;
      }
      
      if (phone) {
          const serviceNames = newAppt.serviceIds.map(id => 
             services.find(s => s.id === id)?.name || (newService && newService.id === id ? newService.name : 'Service')
          );
          await sendAppointmentConfirmation(newAppt, phone, serviceNames);
      }

      navigateToJobCard(newAppt.id);
  };

  if (!isAuthenticated) {
    return <LandingPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const NavItem = ({ tab, icon: Icon, label }: { tab: typeof activeTab, icon: any, label: string }) => {
    if (!checkAccess(tab)) return null;

    return (
      <button 
        onClick={() => { setActiveTab(tab); setIsSidebarOpen(false); }}
        title={isCollapsed ? label : ''}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium mb-1
          ${activeTab === tab ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-500 hover:bg-purple-50 hover:text-purple-700'}
          ${isCollapsed ? 'justify-center w-full' : 'w-full'}
        `}
      >
        <Icon size={20} className={`min-w-[20px] ${activeTab === tab ? 'text-purple-100' : 'text-slate-400'}`} /> 
        {!isCollapsed && <span className="truncate">{label}</span>}
      </button>
    );
  };

  const hasBackOfficeAccess = checkAccess('STAFF') || checkAccess('INVENTORY') || checkAccess('EXPENSES') || checkAccess('REPORTS') || checkAccess('MARKETING');

  return (
    <div className="min-h-screen bg-purple-50 flex font-sans text-slate-900 overflow-hidden">
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 bg-white/70 backdrop-blur-xl border-r border-white/50 transform transition-all duration-300 ease-out flex flex-col shadow-2xl lg:shadow-none
        ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
        no-print
      `}>
        <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2 animate-in fade-in duration-300">
              <div className="bg-purple-600 p-2 rounded-xl shadow-lg shadow-purple-200">
                <Scissors className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">Z <span className="text-purple-600">Bling</span></span>
            </div>
          )}
          {isCollapsed && (
             <div className="bg-purple-600 p-2 rounded-xl shadow-lg shadow-purple-200">
                <Scissors className="h-5 w-5 text-white" />
              </div>
          )}

          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-purple-600">
            <X size={20} />
          </button>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="hidden lg:flex h-6 w-6 bg-purple-50 rounded-full items-center justify-center text-purple-600 hover:bg-purple-100 absolute -right-3 top-8 border border-purple-100 shadow-sm z-50"
          >
             {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
        
        <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar">
          {!isCollapsed && <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-2 mt-2 truncate">Front Office</div>}
          <NavItem tab="DASHBOARD" icon={LayoutDashboard} label="Overview" />
          <NavItem tab="APPOINTMENTS" icon={CalendarCheck} label="Appointments" />
          <NavItem tab="BILLING" icon={Receipt} label="Billing & POS" />
          <NavItem tab="CRM" icon={Users} label="Client Management" />
          
          {hasBackOfficeAccess && (
            <>
              {!isCollapsed && <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-2 mt-6 truncate">Back Office</div>}
              <NavItem tab="STAFF" icon={UserCircle} label="Team & Performance" />
              <NavItem tab="INVENTORY" icon={Package} label="Inventory Control" />
              <NavItem tab="EXPENSES" icon={DollarSign} label="Expense Tracker" />
              <NavItem tab="REPORTS" icon={PieChart} label="Business Reports" />
              <NavItem tab="MARKETING" icon={Sparkles} label="Marketing Suite" />
            </>
          )}
        </nav>

        <div className="p-3 border-t border-purple-100 bg-white/50">
          <NavItem tab="SETTINGS" icon={SettingsIcon} label="System Settings" />
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition mt-1 font-medium ${isCollapsed ? 'justify-center' : ''}`}
            title="Logout"
          >
            <LogOut size={20} /> 
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-auto relative bg-purple-50/50">
        <header className="bg-white/60 backdrop-blur-md border-b border-white/50 h-16 flex items-center justify-between px-6 sticky top-0 z-30 no-print shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-purple-600">
              <Menu size={24} />
            </button>
            <div className="relative hidden md:block w-96">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search appointments, customers, or bills..." 
                className="w-full pl-10 pr-4 py-2 bg-white/80 border border-purple-100 focus:border-purple-500 rounded-xl outline-none transition-all text-sm shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-purple-100/50 rounded-lg text-purple-700 text-xs font-bold border border-purple-100 cursor-pointer hover:bg-purple-100 transition group relative">
                <MapPin size={14} className="text-purple-600"/>
                <select 
                    value={currentBranch} 
                    onChange={(e) => setCurrentBranch(e.target.value)}
                    className="bg-transparent outline-none cursor-pointer appearance-none pr-4"
                >
                    <option>Main Branch</option>
                    <option>City Center</option>
                    <option>West Wing</option>
                </select>
                <ChevronRight size={12} className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-purple-400 pointer-events-none"/>
             </div>

             <button className="relative p-2 text-slate-400 hover:text-purple-600 transition-colors">
                <Bell size={20} />
                <span className="absolute top-1.5 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
             </button>
             
             <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-purple-100">
               <div className="text-right hidden sm:block leading-tight">
                 <p className="text-sm font-bold text-slate-900">Logged In User</p>
                 <div className="relative group">
                    <select 
                        value={userRole} 
                        onChange={(e) => handleRoleChange(e.target.value as Role)}
                        className="text-xs text-purple-600 font-bold bg-transparent outline-none cursor-pointer appearance-none pr-3"
                    >
                        {Object.values(RoleEnum).map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                 </div>
               </div>
               
               <div className="flex items-center gap-2">
                 <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold border-2 border-white shadow-sm cursor-pointer hover:shadow-md transition">
                    {userRole.charAt(0)}
                 </div>
                 <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Logout"
                 >
                    <LogOut size={18} />
                 </button>
               </div>
             </div>
          </div>
        </header>

        {activeTab === 'DASHBOARD' && (
          <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
            {/* ... Dashboard code same as before ... */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Executive Dashboard</h1>
                <p className="text-slate-500 mt-1">Real-time financial performance and daily operations.</p>
              </div>
              <div className="flex items-center gap-3">
                 <button 
                    onClick={() => handleOpenNewAppointment()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-200"
                 >
                     <PlusCircle size={18} /> New Appointment
                 </button>
                 <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white shadow-sm text-sm font-bold text-purple-900">
                    <Calendar size={16} />
                    {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                    label: "Today's Revenue", 
                    val: `₹${dashboardMetrics.todayRevenue.toLocaleString()}`, 
                    icon: Wallet, 
                    bg: "bg-gradient-to-br from-emerald-500 to-green-600", 
                    text: "text-white",
                    sub: "Daily Sales"
                },
                { 
                    label: "Weekly Sales", 
                    val: `₹${dashboardMetrics.weeklyRevenue.toLocaleString()}`, 
                    icon: TrendingUp, 
                    bg: "bg-gradient-to-br from-blue-500 to-indigo-600", 
                    text: "text-white",
                    sub: "Current Week"
                },
                { 
                    label: "Monthly Sales", 
                    val: `₹${dashboardMetrics.monthlyRevenue.toLocaleString()}`, 
                    icon: CalendarCheck, 
                    bg: "bg-gradient-to-br from-purple-500 to-fuchsia-600", 
                    text: "text-white",
                    sub: "Current Month"
                },
                { 
                    label: "Today's Expense", 
                    val: `₹${dashboardMetrics.todayExpenses.toLocaleString()}`, 
                    icon: DollarSign, 
                    bg: "bg-gradient-to-br from-rose-500 to-red-600", 
                    text: "text-white",
                    sub: "Operational Cost"
                },
              ].map((stat, i) => (
                <div key={i} className={`${stat.bg} p-6 rounded-2xl shadow-lg relative overflow-hidden group transition-all hover:scale-[1.02]`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10 flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                      <stat.icon size={22} className="text-white" />
                    </div>
                  </div>
                  <div className="relative z-10 text-white">
                     <h3 className="text-3xl font-bold mb-1">{stat.val}</h3>
                     <p className="opacity-90 font-medium text-sm">{stat.label}</p>
                     <p className="text-[10px] opacity-70 mt-2 uppercase tracking-widest font-bold">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/50 flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Activity size={20} className="text-purple-600"/> Revenue Trend
                                </h3>
                                <p className="text-sm text-slate-500">Last 7 days performance</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400 font-bold uppercase">Average</p>
                                <p className="font-bold text-slate-900 text-lg">
                                    ₹{Math.round(revenueTrend.reduce((sum, d) => sum + d.value, 0) / 7).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 pb-4">
                            <SimpleLineChart data={revenueTrend} color="#9333ea" />
                        </div>
                    </div>

                    {/* Today Schedule List */}
                    <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/50 min-h-[400px]">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Today's Schedule</h3>
                            <p className="text-sm text-slate-500">{dashboardMetrics.pendingAppointments} Pending / {dashboardMetrics.totalAppointments} Total</p>
                        </div>
                        <button 
                          onClick={() => setActiveTab('APPOINTMENTS')} 
                          className="text-sm text-purple-600 font-bold hover:bg-purple-50 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                        >
                          View Calendar <ChevronRight size={16} />
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                          <table className="w-full text-left">
                              <thead className="bg-purple-50/50 text-slate-500 font-bold text-xs uppercase rounded-lg">
                                  <tr>
                                      <th className="p-4 rounded-l-lg">Time</th>
                                      <th className="p-4">Customer</th>
                                      <th className="p-4">Status</th>
                                      <th className="p-4 text-right rounded-r-lg">Actions</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-purple-50">
                                  {todayAppointments.length > 0 ? (
                                      todayAppointments.map(appt => (
                                          <tr key={appt.id} className="hover:bg-purple-50/40 transition group">
                                              <td className="p-4 font-bold text-slate-700">{appt.time}</td>
                                              <td className="p-4">
                                                  <p className="font-bold text-slate-900">{appt.customerName}</p>
                                                  <p className="text-xs text-slate-500">{appt.type === 'WALK_IN' ? 'Walk-in' : 'Online'}</p>
                                              </td>
                                              <td className="p-4">
                                                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                                                      appt.status === AppointmentStatusEnum.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                                                      appt.status === AppointmentStatusEnum.IN_PROGRESS ? 'bg-amber-100 text-amber-700' :
                                                      'bg-purple-100 text-purple-700'
                                                  }`}>
                                                      {appt.status.replace('_', ' ')}
                                                  </span>
                                              </td>
                                              <td className="p-4 text-right flex justify-end gap-2">
                                                  <button 
                                                    onClick={() => navigateToJobCard(appt.id)}
                                                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-white rounded-lg transition border border-transparent hover:border-purple-100 hover:shadow-sm"
                                                    title="View & Edit"
                                                  >
                                                      <FileText size={18} />
                                                  </button>
                                              </td>
                                          </tr>
                                      ))
                                  ) : (
                                      <tr>
                                          <td colSpan={4} className="p-8 text-center text-slate-400">
                                              <Calendar size={48} className="mx-auto mb-3 opacity-20"/>
                                              <p>No appointments scheduled for today.</p>
                                              <button onClick={() => handleOpenNewAppointment()} className="mt-2 text-purple-600 font-bold hover:underline">Add one now</button>
                                          </td>
                                      </tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleOpenNewAppointment()} className="p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-center transition flex flex-col items-center gap-2 border border-purple-100 shadow-sm hover:shadow">
                            <PlusCircle size={24} />
                            <span className="text-xs font-bold">New Booking</span>
                            </button>
                            <button onClick={() => setActiveTab('BILLING')} className="p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-center transition flex flex-col items-center gap-2 border border-emerald-100 shadow-sm hover:shadow">
                            <CreditCard size={24} />
                            <span className="text-xs font-bold">New Bill</span>
                            </button>
                            <button onClick={() => setActiveTab('CRM')} className="p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-center transition flex flex-col items-center gap-2 border border-blue-100 shadow-sm hover:shadow">
                            <Users size={24} />
                            <span className="text-xs font-bold">Add Client</span>
                            </button>
                            
                            {checkAccess('EXPENSES') && (
                                <button onClick={() => setActiveTab('EXPENSES')} className="p-4 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-center transition flex flex-col items-center gap-2 border border-rose-100 shadow-sm hover:shadow">
                                <TrendingUp size={24} />
                                <span className="text-xs font-bold">Add Expense</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/50">
                         <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Star size={20} className="text-amber-500"/> Popular Services
                         </h3>
                         <div className="space-y-4">
                             {topServices.length > 0 ? topServices.map((srv, idx) => (
                                 <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-slate-100">
                                     <div className="flex items-center gap-3">
                                         <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${idx===0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                             #{idx + 1}
                                         </div>
                                         <span className="font-bold text-slate-700 text-sm truncate max-w-[120px]">{srv.name}</span>
                                     </div>
                                     <div className="text-right">
                                         <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">{srv.count} Bookings</span>
                                     </div>
                                 </div>
                             )) : (
                                 <div className="text-center py-8 text-slate-400 text-sm">No service data available yet.</div>
                             )}
                         </div>
                    </div>
                </div>
            </div>
          </div>
        )}

        {(activeTab === 'APPOINTMENTS' || activeTab === 'BILLING') && (
            <Operations 
                activeTab={activeTab} 
                onNavigate={(tab) => setActiveTab(tab)} 
                targetAppointmentId={targetAppointmentId}
                onClearTargetAppointment={() => setTargetAppointmentId(null)}
                customers={customers}
                services={services}
                staffList={staffList}
                appointments={appointments}
                products={products}
                onNewAppointment={handleOpenNewAppointment}
                setAppointments={handleUpdateAppointments}
                bills={bills}
                onUpdateBills={handleUpdateBills}
                shopSettings={shopSettings}
            />
        )}
        
        {activeTab === 'CRM' && (
            <CRM 
                customers={customers}
                onUpdateCustomers={handleUpdateCustomers}
                appointments={appointments}
                bills={bills}
            />
        )}
        
        {activeTab === 'STAFF' && checkAccess('STAFF') && (
            <StaffManager 
                staffList={staffList}
                onUpdateStaff={handleUpdateStaff}
            />
        )}
        
        {activeTab === 'INVENTORY' && checkAccess('INVENTORY') && (
            <Inventory 
                products={products}
                onUpdateProducts={handleUpdateProducts}
            />
        )}
        
        {activeTab === 'EXPENSES' && checkAccess('EXPENSES') && (
            <Expenses 
                expenses={expenses}
                onUpdateExpenses={handleUpdateExpenses}
            />
        )}
        
        {activeTab === 'SETTINGS' && checkAccess('SETTINGS') && (
            <Settings 
                permissions={permissions} 
                onSavePermissions={handlePermissionUpdate} 
                shopSettings={shopSettings}
                onUpdateShopSettings={handleUpdateShopSettings}
            />
        )}
        
        {activeTab === 'REPORTS' && checkAccess('REPORTS') && (
            <Reports 
                appointments={appointments}
                bills={bills}
                staffList={staffList}
                servicesList={services}
            />
        )}

        {activeTab === 'MARKETING' && checkAccess('MARKETING') && (
          <div className="p-6 max-w-5xl mx-auto animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Sparkles className="text-purple-600" /> AI Marketing Assistant
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-white/50">
                <form onSubmit={handleMarketingGen} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Campaign Goal</label>
                    <div className="relative">
                      <select name="type" className="w-full appearance-none border border-purple-100 rounded-xl p-3 bg-white focus:ring-2 focus:ring-purple-500 outline-none transition text-slate-700 font-medium">
                        <option>Discount Offer</option>
                        <option>Appointment Reminder</option>
                        <option>Birthday Wish</option>
                        <option>We Miss You (Retention)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                        <ChevronRight className="rotate-90" size={16} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Customer Name</label>
                    <input name="cname" className="w-full border border-purple-100 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none transition bg-white" placeholder="e.g. Sarah Jones" />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">Offer / Message Details</label>
                     <textarea name="offer" className="w-full border border-purple-100 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none transition bg-white" rows={4} placeholder="e.g. 20% off on Hair Spa this weekend valid till Sunday"></textarea>
                  </div>
                  <button 
                    disabled={isGenerating}
                    type="submit" 
                    className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-bold hover:bg-purple-700 disabled:bg-purple-300 transition shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} /> Generate Message
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="space-y-6">
                 <div className="bg-purple-100/50 p-8 rounded-2xl border border-purple-100 h-full flex flex-col">
                  <h3 className="font-bold text-lg mb-4 text-purple-900 flex items-center gap-2">
                    <div className="bg-white p-1.5 rounded-lg text-purple-600 shadow-sm"><TrendingUp size={16}/></div> 
                    Preview Result
                  </h3>
                  {marketingResult ? (
                    <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm relative flex-1">
                      <p className="text-lg text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">{marketingResult}</p>
                      <div className="absolute bottom-4 right-4">
                         <button 
                          onClick={() => navigator.clipboard.writeText(marketingResult)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 border-2 border-dashed border-purple-200 rounded-xl flex flex-col items-center justify-center text-purple-300 gap-3 p-8">
                      <Sparkles className="text-purple-200" size={48} />
                      <p className="text-center text-sm font-medium">Fill the form and hit generate to see AI magic here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <AppointmentModal 
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        customers={customers}
        services={services}
        staffList={staffList}
        initialData={bookingInitialData}
        onBook={handleBookAppointment}
      />
    </div>
  );
};

export default App;
