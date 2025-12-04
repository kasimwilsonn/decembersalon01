import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, CalendarCheck, Users, Package, Settings as SettingsIcon, 
  Sparkles, LogOut, Menu, PieChart, UserCircle, TrendingUp, CreditCard, 
  PlusCircle, Bell, Search, ChevronRight, ChevronLeft, Scissors, Calendar, 
  DollarSign, Receipt, MapPin, X, Activity, Star
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
import { Role, Appointment, Bill, Expense, AppointmentStatus, Customer, Service, Staff, Product, Vendor, PurchaseOrder, PackageTemplate, GiftCard } from './types';

// Default Data Constants
const DEFAULT_SERVICES: Service[] = [
  { id: '1', name: 'Haircut (Men)', price: 350, durationMins: 30, category: 'Haircuts' },
  { id: '2', name: 'Haircut (Women)', price: 800, durationMins: 60, category: 'Haircuts' }
];

const DEFAULT_STAFF: Staff[] = [
  { id: 'S1', name: 'Owner', role: Role.OWNER, commissionRate: 0, phone: '', isActive: true }
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentBranch, setCurrentBranch] = useState('Main Branch');
  
  // Navigation State for Deep Linking
  const [targetAppointmentId, setTargetAppointmentId] = useState<string | null>(null);

  // Data State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [staffList, setStaffList] = useState<Staff[]>(DEFAULT_STAFF);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [packages, setPackages] = useState<PackageTemplate[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shopSettings, setShopSettings] = useState<any>({ name: 'Z Bling', address: '', gstin: '', taxRate: 18, phone: '', logo: '' });
  
  // Modals
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [bookingInitialData, setBookingInitialData] = useState<BookingInitialData | null>(null);

  // Marketing
  const [marketingResult, setMarketingResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Dashboard
  const [dashboardMetrics, setDashboardMetrics] = useState<any>({ todayRevenue: 0, weeklyRevenue: 0, monthlyRevenue: 0, todayExpenses: 0, totalAppointments: 0, pendingAppointments: 0 });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<{label: string, value: number}[]>([]);
  const [topServices, setTopServices] = useState<{name: string, count: number}[]>([]);

  // Auth & Data Loading (LocalStorage)
  useEffect(() => {
    const savedUser = localStorage.getItem('zbling_current_user');
    if (savedUser) {
      setIsAuthenticated(true);
      loadLocalData();
    }
  }, []);

  const loadLocalData = () => {
      const load = (key: string, setter: any) => {
          const d = localStorage.getItem(key);
          if (d) setter(JSON.parse(d));
      };
      
      load('appointments', setAppointments);
      load('customers', setCustomers);
      load('services', setServices);
      load('staffList', setStaffList);
      load('products', setProducts);
      load('vendors', setVendors);
      load('orders', setOrders);
      load('packages', setPackages);
      load('bills', setBills);
      load('expenses', setExpenses);
      load('shopSettings', setShopSettings);
  };

  const handleLogin = () => {
      setIsAuthenticated(true);
      loadLocalData();
  };

  const handleLogout = () => {
      localStorage.removeItem('zbling_current_user');
      setIsAuthenticated(false);
  };

  // --- SAVE HANDLERS (PERSIST TO LOCALSTORAGE) ---
  const updateAppointments = (data: Appointment[]) => {
      setAppointments(data);
      localStorage.setItem('appointments', JSON.stringify(data));
  };

  const updateCustomers = (data: Customer[]) => {
      setCustomers(data);
      localStorage.setItem('customers', JSON.stringify(data));
  };

  const updateServices = (data: Service[]) => {
      setServices(data);
      localStorage.setItem('services', JSON.stringify(data));
  };

  const updateStaff = (data: Staff[]) => {
      setStaffList(data);
      localStorage.setItem('staffList', JSON.stringify(data));
  };

  const updateProducts = (data: Product[]) => {
      setProducts(data);
      localStorage.setItem('products', JSON.stringify(data));
  };

  const updateVendors = (data: Vendor[]) => {
      setVendors(data);
      localStorage.setItem('vendors', JSON.stringify(data));
  };

  const updateOrders = (data: PurchaseOrder[]) => {
      setOrders(data);
      localStorage.setItem('orders', JSON.stringify(data));
  };

  const updatePackages = (data: PackageTemplate[]) => {
      setPackages(data);
      localStorage.setItem('packages', JSON.stringify(data));
  };

  const updateBills = (data: Bill[]) => {
      setBills(data);
      localStorage.setItem('bills', JSON.stringify(data));
  };

  const updateExpenses = (data: Expense[]) => {
      setExpenses(data);
      localStorage.setItem('expenses', JSON.stringify(data));
  };

  const updateShopSettings = (data: any) => {
      setShopSettings(data);
      localStorage.setItem('shopSettings', JSON.stringify(data));
  };

  // Dashboard Logic
  useEffect(() => {
      if (!isAuthenticated) return;
      const today = new Date().toISOString().split('T')[0];
      const validBills = bills.filter(b => b.status !== 'REFUNDED');
      
      let tRev = 0;
      validBills.forEach(b => {
          if (!b.payments || b.payments.length === 0) {
              if (b.date === today) tRev += b.amountPaid;
          } else {
              b.payments.forEach(p => { if (p.date === today) tRev += p.amount; });
          }
      });

      const tExp = expenses.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);
      const todaysAppts = appointments.filter(a => a.date === today);
      
      setDashboardMetrics(prev => ({
          ...prev,
          todayRevenue: tRev,
          todayExpenses: tExp,
          totalAppointments: todaysAppts.length,
          pendingAppointments: todaysAppts.filter(a => a.status === 'SCHEDULED' || a.status === 'IN_PROGRESS').length
      }));
      setTodayAppointments(todaysAppts.sort((a,b) => a.time.localeCompare(b.time)));
      
      // Simple trend mock
      setRevenueTrend(Array.from({length:7}, (_,i) => ({ label: 'Day '+(i+1), value: Math.floor(Math.random() * 5000) })));

      // Top Services
      const completedAppts = appointments.filter(a => a.status === 'COMPLETED');
      const serviceCounts: Record<string, number> = {};
      completedAppts.forEach(a => {
          a.serviceIds.forEach(sid => {
              const sName = services.find(s => s.id === sid)?.name || 'Unknown';
              serviceCounts[sName] = (serviceCounts[sName] || 0) + 1;
          });
      });
      const topSrv = Object.entries(serviceCounts).sort(([,a], [,b]) => b - a).slice(0, 4).map(([name, count]) => ({name, count}));
      setTopServices(topSrv);

  }, [isAuthenticated, activeTab, appointments, bills, expenses]);

  const handleOpenNewAppointment = (data?: BookingInitialData) => {
    setBookingInitialData(data || null);
    setShowAppointmentModal(true);
  };

  const handleBookAppointment = async (newAppt: Appointment, newCustomer?: Customer, newService?: Service, newStaff?: Staff) => {
      if (newCustomer) updateCustomers([...customers, newCustomer]);
      if (newService) updateServices([...services, newService]);
      if (newStaff) updateStaff([...staffList, newStaff]);
      
      updateAppointments([...appointments, newAppt]);
      setShowAppointmentModal(false);
      
      let phone = newCustomer?.phone || customers.find(c => c.id === newAppt.customerId)?.phone;
      if (phone) {
          const names = newAppt.serviceIds.map(id => services.find(s => s.id === id)?.name || 'Service');
          await sendAppointmentConfirmation(newAppt, phone, names);
      }
      setActiveTab('APPOINTMENTS');
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

  if (!isAuthenticated) return <LandingPage onLogin={handleLogin} />;

  const NavItem = ({ tab, icon: Icon, label }: any) => (
      <button 
        onClick={() => setActiveTab(tab)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition w-full font-medium mb-1 ${activeTab === tab ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-purple-50'}`}
      >
        <Icon size={20}/> {!isCollapsed && label}
      </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden">
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${isCollapsed ? 'w-20' : 'w-72'}`}>
        <div className="p-6 flex items-center gap-2 font-bold text-xl text-slate-800">
            <div className="bg-purple-600 p-2 rounded-xl text-white"><Scissors size={20}/></div>
            {!isCollapsed && <span>Z <span className="text-purple-600">Bling</span></span>}
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
            <NavItem tab="DASHBOARD" icon={LayoutDashboard} label="Overview"/>
            <NavItem tab="APPOINTMENTS" icon={CalendarCheck} label="Appointments"/>
            <NavItem tab="BILLING" icon={Receipt} label="Billing"/>
            <NavItem tab="CRM" icon={Users} label="Clients"/>
            <NavItem tab="STAFF" icon={UserCircle} label="Staff"/>
            <NavItem tab="INVENTORY" icon={Package} label="Inventory"/>
            <NavItem tab="EXPENSES" icon={DollarSign} label="Expenses"/>
            <NavItem tab="REPORTS" icon={PieChart} label="Reports"/>
            <NavItem tab="MARKETING" icon={Sparkles} label="Marketing"/>
            <NavItem tab="SETTINGS" icon={SettingsIcon} label="Settings"/>
        </nav>
        <div className="p-3 border-t">
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl w-full font-bold transition">
                <LogOut size={20}/> {!isCollapsed && "Logout"}
            </button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-auto relative bg-purple-50/30">
         <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
             <div className="font-bold text-slate-700">{shopSettings.name}</div>
             <div className="flex items-center gap-4">
                 <button onClick={() => handleOpenNewAppointment()} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-purple-700 transition flex items-center gap-2">
                    <PlusCircle size={16}/> New Booking
                 </button>
             </div>
         </header>

         {activeTab === 'DASHBOARD' && (
             <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-slate-500 text-sm font-bold">Today's Revenue</p>
                        <h3 className="text-3xl font-bold text-slate-900">₹{dashboardMetrics.todayRevenue.toLocaleString()}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-slate-500 text-sm font-bold">Appointments</p>
                        <h3 className="text-3xl font-bold text-slate-900">{dashboardMetrics.totalAppointments}</h3>
                    </div>
                 </div>
             </div>
         )}

         {(activeTab === 'APPOINTMENTS' || activeTab === 'BILLING') && (
            <Operations 
                activeTab={activeTab as any} 
                onNavigate={(t) => setActiveTab(t)}
                targetAppointmentId={targetAppointmentId}
                onClearTargetAppointment={() => setTargetAppointmentId(null)}
                customers={customers}
                services={services}
                staffList={staffList}
                appointments={appointments}
                products={products}
                bills={bills}
                shopSettings={shopSettings}
                // Pass updater functions
                setAppointments={updateAppointments}
                onUpdateBills={updateBills}
                onNewAppointment={handleOpenNewAppointment}
                dbActions={{ updateAppointment: () => {}, addBill: () => {}, updateBill: () => {} }} // Dummy for types if needed, but props below override
            />
         )}

         {activeTab === 'CRM' && (
            <CRM 
                customers={customers} 
                appointments={appointments} 
                bills={bills} 
                onUpdateCustomers={updateCustomers}
                packages={packages} 
                services={services} 
                giftCards={[]} 
                dbActions={{}} // Removed dependency
            />
         )}

         {activeTab === 'STAFF' && (
            <StaffManager 
                staffList={staffList} 
                appointments={appointments}
                onUpdateStaff={updateStaff}
                dbActions={{}} // Removed dependency
            />
         )}

         {activeTab === 'INVENTORY' && (
            <Inventory 
                products={products} 
                vendors={vendors} 
                orders={orders} 
                onUpdateProducts={updateProducts}
                onUpdateVendors={updateVendors}
                onUpdateOrders={updateOrders}
                dbActions={{}} // Removed dependency
            />
         )}

         {activeTab === 'EXPENSES' && (
            <Expenses 
                expenses={expenses} 
                onUpdateExpenses={updateExpenses}
                dbActions={{}} // Removed dependency
            />
         )}

         {activeTab === 'REPORTS' && <Reports appointments={appointments} bills={bills} staffList={staffList} servicesList={services} />}
         
         {activeTab === 'SETTINGS' && (
            <Settings 
                permissions={{}} 
                shopSettings={shopSettings} 
                services={services}
                packages={packages}
                onUpdateShopSettings={updateShopSettings}
                dbActions={{}} // Removed dependency
            />
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