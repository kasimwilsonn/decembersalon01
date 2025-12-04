
import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Shield, Scissors, CreditCard, Gift, Save, X, Lock, Building, Plus, Trash2, Edit, Phone, MapPin, Percent, Store, FileText, ToggleLeft, ToggleRight, Info, ChevronRight, Upload, Image as ImageIcon, CheckCircle2, Clock as ClockIcon, Search, Check, MessageCircle, Send, Package as PackageIcon, Database, FileDown, FileUp } from 'lucide-react';
import { Role, Service, NotificationSettings, PackageTemplate, Product } from '../types';

interface SettingsProps {
    permissions?: Record<string, Role[]>;
    onSavePermissions?: (p: Record<string, Role[]>) => void;
    shopSettings: any;
    onUpdateShopSettings: (settings: any) => void;
}

const SERVICE_CATEGORIES = [
  'Haircuts',
  'Coloring',
  'Styling',
  'Treatments',
  'Facials',
  'Makeup',
  'Manicure/Pedicure',
  'Retail'
];

const DEFAULT_SERVICES: Service[] = [
  { id: '1', name: 'Haircut (Men)', price: 350, durationMins: 30, category: 'Haircuts' },
  { id: '2', name: 'Haircut (Women)', price: 800, durationMins: 60, category: 'Haircuts' },
  { id: '3', name: 'Facial (Gold)', price: 1500, durationMins: 45, category: 'Facials' },
  { id: '4', name: 'Hair Spa', price: 1200, durationMins: 60, category: 'Treatments' },
  { id: '5', name: 'Bridal Makeup', price: 15000, durationMins: 180, category: 'Makeup' },
  { id: '6', name: 'Root Touch Up', price: 1000, durationMins: 45, category: 'Coloring' },
  { id: '7', name: 'Classic Manicure', price: 500, durationMins: 30, category: 'Manicure/Pedicure' },
];

const Settings: React.FC<SettingsProps> = ({ permissions, onSavePermissions, shopSettings: propShopSettings, onUpdateShopSettings }) => {
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'SERVICES' | 'PACKAGES' | 'ROLES' | 'LOYALTY' | 'NOTIFICATIONS' | 'DATA_MGMT'>('GENERAL');
    
    // Toast State
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    // --- GENERAL SETTINGS STATE ---
    // Initialize with props
    const [shopSettings, setShopSettings] = useState(propShopSettings);

    // --- SERVICE MENU STATE ---
    const [services, setServices] = useState<Service[]>([]);
    const [serviceSearch, setServiceSearch] = useState('');
    const [isEditingService, setIsEditingService] = useState(false);
    const [serviceForm, setServiceForm] = useState<Partial<Service>>({ name: '', price: 0, durationMins: 30, category: 'Haircuts' });

    // --- PACKAGES STATE ---
    const [packages, setPackages] = useState<PackageTemplate[]>([]);
    const [isEditingPackage, setIsEditingPackage] = useState(false);
    const [packageForm, setPackageForm] = useState<Partial<PackageTemplate>>({ name: '', price: 0, validityDays: 30, services: [] });

    // --- LOYALTY STATE ---
    const [loyaltyConfig, setLoyaltyConfig] = useState({
        enabled: true,
        spendForOnePoint: 100,
        pointValue: 1
    });

    // --- NOTIFICATION STATE ---
    const [notificationConfig, setNotificationConfig] = useState<NotificationSettings>({
        enabled: false,
        provider: 'MANUAL_LINK',
        apiKey: '',
        triggers: {
            appointmentBooking: true,
            billGeneration: true,
            staffDailyReport: true,
            lowStock: false
        }
    });

    // --- PERMISSIONS STATE ---
    const [localPermissions, setLocalPermissions] = useState<Record<string, Role[]>>(permissions || {});
    
    // File Inputs
    const serviceImportRef = useRef<HTMLInputElement>(null);
    const productImportRef = useRef<HTMLInputElement>(null);

    // Load Data on Mount
    useEffect(() => {
        // Sync shop settings if prop changes (e.g. initial load)
        setShopSettings(propShopSettings);

        const savedServices = localStorage.getItem('services');
        if (savedServices) {
            setServices(JSON.parse(savedServices));
        } else {
            setServices(DEFAULT_SERVICES);
            localStorage.setItem('services', JSON.stringify(DEFAULT_SERVICES));
        }

        const savedPackages = localStorage.getItem('packageTemplates');
        if (savedPackages) setPackages(JSON.parse(savedPackages));

        const savedLoyalty = localStorage.getItem('loyaltySettings');
        if (savedLoyalty) setLoyaltyConfig(JSON.parse(savedLoyalty));
        
        const savedNotify = localStorage.getItem('notificationSettings');
        if (savedNotify) setNotificationConfig(JSON.parse(savedNotify));

        if (permissions) setLocalPermissions(permissions);
    }, [permissions, propShopSettings]);

    // --- HANDLERS ---
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const saveShopSettings = () => {
        onUpdateShopSettings(shopSettings);
        showToast("Business profile updated successfully!");
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { 
                showToast("File too large. Max 2MB.", "error");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setShopSettings((prev: any) => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setShopSettings((prev: any) => ({ ...prev, logo: '' }));
    };

    const handleServiceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let updatedServices;
        if (serviceForm.id) {
            updatedServices = services.map(s => s.id === serviceForm.id ? { ...s, ...serviceForm } as Service : s);
        } else {
            const newService: Service = {
                ...serviceForm as Service,
                id: 'SRV-' + Date.now(),
            };
            updatedServices = [...services, newService];
        }
        setServices(updatedServices);
        localStorage.setItem('services', JSON.stringify(updatedServices));
        setIsEditingService(false);
        setServiceForm({ name: '', price: 0, durationMins: 30, category: 'Haircuts' });
        showToast(serviceForm.id ? "Service updated." : "New service added.");
    };

    const deleteService = (id: string) => {
        if(confirm('Are you sure you want to remove this service?')) {
            const updated = services.filter(s => s.id !== id);
            setServices(updated);
            localStorage.setItem('services', JSON.stringify(updated));
            showToast("Service removed.");
        }
    };

    const editService = (s: Service) => {
        setServiceForm(s);
        setIsEditingService(true);
    };

    // Package Handlers
    const handlePackageSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let updatedPackages;
        if (packageForm.id) {
            updatedPackages = packages.map(p => p.id === packageForm.id ? { ...p, ...packageForm } as PackageTemplate : p);
        } else {
            const newPkg: PackageTemplate = {
                ...packageForm as PackageTemplate,
                id: 'PKG-' + Date.now()
            };
            updatedPackages = [...packages, newPkg];
        }
        setPackages(updatedPackages);
        localStorage.setItem('packageTemplates', JSON.stringify(updatedPackages));
        setIsEditingPackage(false);
        setPackageForm({ name: '', price: 0, validityDays: 30, services: [] });
        showToast(packageForm.id ? "Package updated." : "New package created.");
    };

    const deletePackage = (id: string) => {
        if(confirm('Are you sure you want to delete this package template?')) {
            const updated = packages.filter(p => p.id !== id);
            setPackages(updated);
            localStorage.setItem('packageTemplates', JSON.stringify(updated));
            showToast("Package deleted.");
        }
    };

    const addServiceToPackage = (serviceId: string) => {
        const current = packageForm.services || [];
        const exists = current.find(s => s.serviceId === serviceId);
        if (exists) {
            setPackageForm({
                ...packageForm,
                services: current.map(s => s.serviceId === serviceId ? { ...s, count: s.count + 1 } : s)
            });
        } else {
            setPackageForm({
                ...packageForm,
                services: [...current, { serviceId, count: 1 }]
            });
        }
    };

    const removeServiceFromPackage = (serviceId: string) => {
        const current = packageForm.services || [];
        setPackageForm({
            ...packageForm,
            services: current.filter(s => s.serviceId !== serviceId)
        });
    };

    const filteredServices = services.filter(s => 
        s.name.toLowerCase().includes(serviceSearch.toLowerCase()) || 
        s.category.toLowerCase().includes(serviceSearch.toLowerCase())
    );

    const handleSaveLoyalty = () => {
        localStorage.setItem('loyaltySettings', JSON.stringify(loyaltyConfig));
        showToast("Loyalty program updated!");
    };

    const handleSaveNotifications = () => {
        localStorage.setItem('notificationSettings', JSON.stringify(notificationConfig));
        showToast("Notification settings saved!");
    };

    const handlePermissionToggle = (module: string, role: Role) => {
        if (role === Role.OWNER) return; 

        setLocalPermissions(prev => {
            const currentRoles = prev[module] || [];
            const hasRole = currentRoles.includes(role);
            
            let newRoles;
            if (hasRole) {
                newRoles = currentRoles.filter(r => r !== role);
            } else {
                newRoles = [...currentRoles, role];
            }
            return { ...prev, [module]: newRoles };
        });
    };

    const handleSavePermissions = () => {
        if (onSavePermissions) {
            onSavePermissions(localPermissions);
            showToast("Access permissions updated!");
        }
    };

    // --- DATA MANAGEMENT HANDLERS ---
    const handleExportServices = () => {
        if (services.length === 0) {
            showToast("No services to export.", "error");
            return;
        }
        const headers = "ID,Name,Category,Price,DurationMins";
        const rows = services.map(s => `"${s.id}","${s.name}","${s.category}",${s.price},${s.durationMins}`);
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `services_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Services exported successfully!");
    };

    const handleImportServices = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            const newServices: Service[] = [];
            // ID,Name,Category,Price,DurationMins
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const parts = line.split(',').map(p => p.replace(/^"|"$/g, '').trim());
                if (parts.length < 4) continue;

                newServices.push({
                    id: parts[0] || 'SRV-' + Date.now() + Math.random(),
                    name: parts[1],
                    category: parts[2] || 'General',
                    price: Number(parts[3]) || 0,
                    durationMins: Number(parts[4]) || 30
                });
            }

            if (newServices.length > 0) {
                // Merge logic: Replace if ID matches, else add
                const merged = [...services];
                newServices.forEach(ns => {
                    const idx = merged.findIndex(s => s.id === ns.id);
                    if (idx !== -1) merged[idx] = ns;
                    else merged.push(ns);
                });
                setServices(merged);
                localStorage.setItem('services', JSON.stringify(merged));
                showToast(`Imported ${newServices.length} services.`);
            } else {
                showToast("No valid service data found.", "error");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleExportProducts = () => {
        const savedProducts = localStorage.getItem('products');
        const products: Product[] = savedProducts ? JSON.parse(savedProducts) : [];

        if (products.length === 0) {
            showToast("No products found in inventory.", "error");
            return;
        }

        const headers = "ID,Name,Category,Price,CostPrice,Stock,SKU";
        const rows = products.map(p => `"${p.id}","${p.name}","${p.category}",${p.price},${p.costPrice},${p.stock},"${p.sku}"`);
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Inventory exported successfully!");
    };

    const handleImportProducts = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            const newProducts: Product[] = [];
            // ID,Name,Category,Price,CostPrice,Stock,SKU
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const parts = line.split(',').map(p => p.replace(/^"|"$/g, '').trim());
                if (parts.length < 5) continue;

                newProducts.push({
                    id: parts[0] || 'P-' + Date.now() + Math.random(),
                    name: parts[1],
                    category: parts[2] || 'General',
                    price: Number(parts[3]) || 0,
                    costPrice: Number(parts[4]) || 0,
                    stock: Number(parts[5]) || 0,
                    sku: parts[6] || '',
                    lowStockThreshold: 5 // Default
                });
            }

            if (newProducts.length > 0) {
                const savedProducts = localStorage.getItem('products');
                let existingProducts: Product[] = savedProducts ? JSON.parse(savedProducts) : [];
                
                newProducts.forEach(np => {
                    const idx = existingProducts.findIndex(ep => ep.id === np.id || (ep.sku && ep.sku === np.sku));
                    if (idx !== -1) existingProducts[idx] = { ...existingProducts[idx], ...np };
                    else existingProducts.push(np);
                });
                
                localStorage.setItem('products', JSON.stringify(existingProducts));
                showToast(`Imported/Updated ${newProducts.length} products.`);
            } else {
                showToast("No valid product data found.", "error");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };


    // --- COMPONENTS ---

    const SettingsCard = ({ title, description, icon: Icon, children, actions, className }: any) => (
        <div className={`bg-white/70 backdrop-blur-2xl rounded-3xl shadow-xl shadow-purple-900/5 border border-white/60 p-6 md:p-8 relative overflow-hidden group hover:shadow-2xl hover:shadow-purple-900/10 transition-all duration-500 ${className}`}>
             <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/5 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
             
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 relative z-10 gap-4 border-b border-purple-50/50 pb-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-purple-500/30 ring-4 ring-purple-50">
                        <Icon size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
                        {description && <p className="text-sm text-slate-500 font-medium mt-1">{description}</p>}
                    </div>
                </div>
                {actions && <div className="flex gap-3">{actions}</div>}
            </div>
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );

    const InputField = ({ label, icon: Icon, className, ...props }: any) => (
        <div className={`space-y-2 ${className}`}>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">{label}</label>
            <div className="relative group focus-within:ring-2 ring-purple-500/20 rounded-xl transition-all shadow-sm">
                <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-purple-600 transition-colors">
                    {Icon && <Icon size={18} />}
                </div>
                <input 
                    className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 transition-all"
                    {...props}
                />
            </div>
        </div>
    );

    const SidebarItem = ({ id, label, icon: Icon, active }: { id: string, label: string, icon: any, active: boolean }) => (
        <button
            onClick={() => setActiveTab(id as any)}
            className={`w-full text-left px-4 py-4 rounded-xl flex items-center justify-between group transition-all duration-300 ${
                active 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30' 
                : 'text-slate-500 hover:bg-white hover:text-purple-600 hover:shadow-sm'
            }`}
        >
            <div className="flex items-center gap-3 font-bold">
                <Icon size={18} className={active ? 'text-purple-200' : 'text-slate-400 group-hover:text-purple-500'} /> 
                {label}
            </div>
            {active && <ChevronRight size={16} className="text-purple-200 animate-in slide-in-from-left-2" />}
        </button>
    );

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 relative">
             {/* Background Decoration */}
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-100/50 to-transparent"></div>
                <div className="absolute top-20 right-20 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-20 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl"></div>
             </div>

             {/* Toast Notification */}
             {toast && (
                <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right-10 fade-in duration-300">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${toast.type === 'success' ? 'bg-white text-emerald-700 border-emerald-100' : 'bg-white text-red-600 border-red-100'}`}>
                        {toast.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-500"/> : <X size={20} className="text-red-500"/>}
                        <span className="font-bold">{toast.message}</span>
                    </div>
                </div>
             )}

             {/* Sidebar (Desktop) */}
             <div className="w-80 bg-white/40 backdrop-blur-2xl border-r border-white/50 p-6 hidden lg:flex flex-col h-full shadow-2xl shadow-purple-900/5 z-20">
                 <div className="mb-8 px-2">
                     <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                        <div className="p-2.5 bg-slate-900 rounded-xl text-white shadow-lg shadow-slate-900/20">
                            <SettingsIcon size={22}/>
                        </div>
                        Configuration
                     </h2>
                     <p className="text-slate-500 text-xs mt-3 font-bold uppercase tracking-widest ml-1 text-purple-600">System Preferences</p>
                 </div>
                 
                 <div className="space-y-2 flex-1">
                     <SidebarItem id="GENERAL" label="General & Billing" icon={Store} active={activeTab === 'GENERAL'} />
                     <SidebarItem id="SERVICES" label="Service Menu" icon={Scissors} active={activeTab === 'SERVICES'} />
                     <SidebarItem id="PACKAGES" label="Package Templates" icon={PackageIcon} active={activeTab === 'PACKAGES'} />
                     <SidebarItem id="ROLES" label="Roles & Permissions" icon={Shield} active={activeTab === 'ROLES'} />
                     <SidebarItem id="LOYALTY" label="Loyalty Program" icon={Gift} active={activeTab === 'LOYALTY'} />
                     <SidebarItem id="NOTIFICATIONS" label="Notifications & API" icon={MessageCircle} active={activeTab === 'NOTIFICATIONS'} />
                     <SidebarItem id="DATA_MGMT" label="Data Management" icon={Database} active={activeTab === 'DATA_MGMT'} />
                 </div>

                 <div className="p-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg text-white mt-auto relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-125"></div>
                     <div className="flex items-start gap-3 relative z-10">
                         <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm"><Info size={18} /></div>
                         <div>
                             <p className="text-sm font-bold mb-1">Need Help?</p>
                             <p className="text-xs text-purple-100 leading-relaxed opacity-90">Contact support for advanced configuration.</p>
                         </div>
                     </div>
                 </div>
             </div>

             {/* Content Area */}
             <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative z-10">
                 
                 <div className="max-w-6xl mx-auto space-y-8 pb-10">
                     
                     {/* Mobile Navigation Tabs */}
                     <div className="lg:hidden mb-6 sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md pt-2 pb-2 -mx-4 px-4 border-b border-white/50">
                         <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
                            {[
                                { id: 'GENERAL', label: 'General', icon: Store },
                                { id: 'SERVICES', label: 'Services', icon: Scissors },
                                { id: 'PACKAGES', label: 'Packages', icon: PackageIcon },
                                { id: 'ROLES', label: 'Roles', icon: Shield },
                                { id: 'LOYALTY', label: 'Loyalty', icon: Gift },
                                { id: 'NOTIFICATIONS', label: 'Notify', icon: MessageCircle },
                                { id: 'DATA_MGMT', label: 'Data', icon: Database }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border shadow-sm ${
                                        activeTab === tab.id 
                                        ? 'bg-purple-600 text-white border-purple-600 shadow-purple-200' 
                                        : 'bg-white text-slate-500 border-slate-200'
                                    }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                         </div>
                     </div>

                     {/* GENERAL SETTINGS */}
                     {activeTab === 'GENERAL' && (
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
                             {/* Salon Profile Card */}
                             <SettingsCard 
                                title="Salon Identity" 
                                description="Manage your public business profile."
                                icon={Building}
                             >
                                 <div className="space-y-6">
                                     <div className="p-1 bg-gradient-to-br from-purple-100 to-indigo-50 rounded-2xl">
                                         <div className="bg-white p-4 rounded-xl border border-white/50">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Brand Logo</label>
                                                {shopSettings.logo && (
                                                    <button onClick={removeLogo} className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1">
                                                        <Trash2 size={12}/> Remove
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {shopSettings.logo ? (
                                                <div className="w-full h-40 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center p-4 relative overflow-hidden group">
                                                    <img src={shopSettings.logo} alt="Salon Logo" className="h-full object-contain group-hover:scale-105 transition-transform" />
                                                </div>
                                            ) : (
                                                <label className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-purple-400 hover:text-purple-500 hover:bg-purple-50/50 transition-all cursor-pointer">
                                                    <Upload size={32} className="mb-2"/>
                                                    <span className="text-sm font-bold">Upload Brand Logo</span>
                                                    <span className="text-[10px] mt-1 font-medium bg-white px-2 py-0.5 rounded border border-slate-200">PNG, JPG (Max 2MB)</span>
                                                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                                </label>
                                            )}
                                         </div>
                                     </div>

                                     <InputField 
                                        label="Salon Name" 
                                        icon={Store} 
                                        value={shopSettings.name}
                                        onChange={(e: any) => setShopSettings({...shopSettings, name: e.target.value})}
                                     />
                                     <InputField 
                                        label="Phone Number" 
                                        icon={Phone} 
                                        value={shopSettings.phone}
                                        onChange={(e: any) => setShopSettings({...shopSettings, phone: e.target.value})}
                                     />
                                     <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Address</label>
                                        <div className="relative group focus-within:ring-2 ring-purple-500/20 rounded-xl transition-all shadow-sm">
                                            <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-purple-600 transition-colors">
                                                <MapPin size={18} />
                                            </div>
                                            <textarea 
                                                className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 transition-all min-h-[120px]"
                                                value={shopSettings.address}
                                                onChange={(e: any) => setShopSettings({...shopSettings, address: e.target.value})}
                                            />
                                        </div>
                                     </div>
                                 </div>
                             </SettingsCard>

                             {/* Billing Card */}
                             <div className="space-y-8">
                                <SettingsCard 
                                    title="Billing & Financials" 
                                    description="Configure tax rates and invoices."
                                    icon={CreditCard}
                                >
                                    <div className="space-y-6">
                                        <InputField 
                                            label="GSTIN / Tax ID" 
                                            icon={FileText} 
                                            value={shopSettings.gstin}
                                            onChange={(e: any) => setShopSettings({...shopSettings, gstin: e.target.value})}
                                            className="font-mono uppercase"
                                        />
                                        <InputField 
                                            label="Default Tax Rate (%)" 
                                            icon={Percent} 
                                            type="number"
                                            value={shopSettings.taxRate}
                                            onChange={(e: any) => setShopSettings({...shopSettings, taxRate: Number(e.target.value)})}
                                        />
                                        
                                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex items-start gap-3">
                                            <Info size={18} className="text-amber-600 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-amber-800">Tax Note</p>
                                                <p className="text-xs text-amber-700 mt-1">Changing tax rate affects future invoices only. Past records remain unchanged.</p>
                                            </div>
                                        </div>
                                    </div>
                                </SettingsCard>

                                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                                     <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110 duration-700"></div>
                                     <h3 className="text-xl font-bold mb-2 flex items-center gap-2 relative z-10"><Save size={20} className="text-purple-400"/> Save Changes</h3>
                                     <p className="text-slate-400 text-sm mb-6 relative z-10 font-medium">Ready to update your business profile? Ensure all details are correct.</p>
                                     <button 
                                        onClick={saveShopSettings}
                                        className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-purple-50 transition shadow-lg relative z-10 flex items-center justify-center gap-2 group/btn"
                                     >
                                         Update Configuration <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform"/>
                                     </button>
                                </div>
                             </div>
                         </div>
                     )}

                     {/* SERVICE MENU */}
                     {activeTab === 'SERVICES' && (
                        <div className="animate-in fade-in duration-500">
                           <SettingsCard 
                               title="Service Menu" 
                               description="Manage your salon services and pricing."
                               icon={Scissors}
                               actions={
                                   <button 
                                       onClick={() => { setIsEditingService(true); setServiceForm({ name: '', price: 0, durationMins: 30, category: 'Haircuts' }); }}
                                       className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all hover:scale-105"
                                   >
                                       <Plus size={18}/> Add Service
                                   </button>
                               }
                           >
                               <div className="mb-6 flex items-center gap-4 bg-white/40 p-1 rounded-xl border border-white/60">
                                    <div className="flex items-center gap-2 px-3 py-2 text-slate-400">
                                        <Search size={20}/>
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Search services..." 
                                        className="w-full bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400"
                                        value={serviceSearch}
                                        onChange={(e) => setServiceSearch(e.target.value)}
                                    />
                               </div>

                               <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white/50 shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-purple-50/50 border-b border-purple-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="p-5">Service Name</th>
                                                <th className="hidden sm:table-cell p-5">Category</th>
                                                <th className="hidden sm:table-cell p-5">Duration</th>
                                                <th className="p-5">Price</th>
                                                <th className="p-5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {filteredServices.length > 0 ? filteredServices.map(s => (
                                                <tr key={s.id} className="hover:bg-purple-50/30 transition-colors group">
                                                    <td className="p-5 font-bold text-slate-800">
                                                        {s.name}
                                                        <div className="sm:hidden text-xs text-slate-500 mt-1">{s.category} • {s.durationMins}m</div>
                                                    </td>
                                                    <td className="hidden sm:table-cell p-5 text-slate-500">
                                                        <span className="bg-white text-slate-600 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200 group-hover:border-purple-200 group-hover:text-purple-700 transition-all shadow-sm">
                                                            {s.category}
                                                        </span>
                                                    </td>
                                                    <td className="hidden sm:table-cell p-5 text-slate-600 font-medium">
                                                        <div className="flex items-center gap-2"><ClockIcon size={14} className="text-slate-400"/> {s.durationMins} mins</div>
                                                    </td>
                                                    <td className="p-5 font-bold text-slate-900">₹{s.price}</td>
                                                    <td className="p-5 text-right flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => editService(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit size={16}/></button>
                                                        <button onClick={() => deleteService(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={16}/></button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">No services found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                           </SettingsCard>

                           {/* Service Modal */}
                           {isEditingService && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsEditingService(false)}>
                                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-white/50" onClick={e => e.stopPropagation()}>
                                        <div className="px-8 py-6 border-b border-slate-100 bg-purple-50/50 flex justify-between items-center">
                                            <h3 className="font-bold text-xl text-slate-800">{serviceForm.id ? 'Edit Service' : 'Add New Service'}</h3>
                                            <button onClick={() => setIsEditingService(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full"><X size={20}/></button>
                                        </div>
                                        <div className="p-8 space-y-5">
                                            <InputField 
                                                label="Service Name" 
                                                value={serviceForm.name} 
                                                onChange={(e: any) => setServiceForm({...serviceForm, name: e.target.value})} 
                                            />
                                            <div className="grid grid-cols-2 gap-5">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block ml-1">Category</label>
                                                    <div className="relative">
                                                        <select 
                                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium outline-none focus:border-purple-500 transition appearance-none shadow-sm"
                                                            value={serviceForm.category} 
                                                            onChange={e => setServiceForm({...serviceForm, category: e.target.value})}
                                                        >
                                                            {SERVICE_CATEGORIES.map(cat => (
                                                                <option key={cat} value={cat}>{cat}</option>
                                                            ))}
                                                            {!SERVICE_CATEGORIES.includes(serviceForm.category || '') && serviceForm.category && (
                                                                <option value={serviceForm.category}>{serviceForm.category} (Legacy)</option>
                                                            )}
                                                        </select>
                                                        <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">▼</div>
                                                    </div>
                                                </div>
                                                <InputField 
                                                    label="Price (₹)" 
                                                    type="number"
                                                    value={serviceForm.price} 
                                                    onChange={(e: any) => setServiceForm({...serviceForm, price: Number(e.target.value)})} 
                                                />
                                            </div>
                                            <InputField 
                                                label="Duration (Mins)" 
                                                type="number"
                                                value={serviceForm.durationMins} 
                                                onChange={(e: any) => setServiceForm({...serviceForm, durationMins: Number(e.target.value)})} 
                                            />
                                            <div className="pt-4 flex gap-3">
                                                <button 
                                                    onClick={() => setIsEditingService(false)}
                                                    className="flex-1 py-3.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={handleServiceSubmit}
                                                    className="flex-1 py-3.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition"
                                                >
                                                    Save Service
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                     )}

                     {/* PACKAGE TEMPLATES */}
                     {activeTab === 'PACKAGES' && (
                        <div className="animate-in fade-in duration-500">
                             <SettingsCard 
                               title="Package Templates" 
                               description="Create and manage service bundles."
                               icon={PackageIcon}
                               actions={
                                   <button 
                                       onClick={() => { setIsEditingPackage(true); setPackageForm({ name: '', price: 0, validityDays: 30, services: [] }); }}
                                       className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all hover:scale-105"
                                   >
                                       <Plus size={18}/> New Package
                                   </button>
                               }
                           >
                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {packages.map(pkg => (
                                        <div key={pkg.id} className="bg-white/50 border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-purple-300 transition-all group relative">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-slate-800 text-lg">{pkg.name}</h3>
                                                    <p className="text-xs text-slate-500 font-bold">{pkg.validityDays} Days Validity</p>
                                                </div>
                                                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm font-bold">₹{pkg.price}</span>
                                            </div>
                                            <ul className="space-y-2 mb-4">
                                                {pkg.services.map((s, i) => {
                                                    const serviceName = services.find(srv => srv.id === s.serviceId)?.name || 'Unknown';
                                                    return (
                                                        <li key={i} className="text-sm text-slate-600 flex justify-between">
                                                            <span>{serviceName}</span>
                                                            <span className="font-bold bg-white px-2 rounded border border-slate-100">x{s.count}</span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                                                <button onClick={() => { setPackageForm(pkg); setIsEditingPackage(true); }} className="text-blue-600 font-bold text-xs hover:bg-blue-50 px-3 py-1.5 rounded-lg transition">Edit</button>
                                                <button onClick={() => deletePackage(pkg.id)} className="text-red-500 font-bold text-xs hover:bg-red-50 px-3 py-1.5 rounded-lg transition">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                    {packages.length === 0 && (
                                        <div className="col-span-full py-12 text-center text-slate-400">
                                            <PackageIcon size={48} className="mx-auto mb-4 opacity-20"/>
                                            <p>No packages created yet.</p>
                                        </div>
                                    )}
                               </div>
                           </SettingsCard>

                            {/* Package Modal */}
                            {isEditingPackage && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsEditingPackage(false)}>
                                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/50 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                                        <div className="px-8 py-6 border-b border-slate-100 bg-purple-50/50 flex justify-between items-center shrink-0">
                                            <h3 className="font-bold text-xl text-slate-800">{packageForm.id ? 'Edit Package' : 'Create Package'}</h3>
                                            <button onClick={() => setIsEditingPackage(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full"><X size={20}/></button>
                                        </div>
                                        <div className="p-8 space-y-6 overflow-y-auto">
                                            <div className="grid grid-cols-2 gap-5">
                                                <InputField label="Package Name" value={packageForm.name} onChange={(e: any) => setPackageForm({...packageForm, name: e.target.value})} />
                                                <InputField label="Price (₹)" type="number" value={packageForm.price} onChange={(e: any) => setPackageForm({...packageForm, price: Number(e.target.value)})} />
                                            </div>
                                            <InputField label="Validity (Days)" type="number" value={packageForm.validityDays} onChange={(e: any) => setPackageForm({...packageForm, validityDays: Number(e.target.value)})} />
                                            
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Included Services</label>
                                                <div className="flex gap-2 mb-4">
                                                    <select 
                                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                                        onChange={(e) => {
                                                            if(e.target.value) addServiceToPackage(e.target.value);
                                                            e.target.value = '';
                                                        }}
                                                    >
                                                        <option value="">+ Add Service to Package</option>
                                                        {services.map(s => <option key={s.id} value={s.id}>{s.name} (₹{s.price})</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    {packageForm.services?.map((s, i) => {
                                                        const srv = services.find(ser => ser.id === s.serviceId);
                                                        return (
                                                            <div key={i} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                                                <span className="text-sm font-bold text-slate-700">{srv?.name}</span>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-xs text-slate-500">Qty: {s.count}</span>
                                                                    <button onClick={() => removeServiceFromPackage(s.serviceId)} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {(!packageForm.services || packageForm.services.length === 0) && (
                                                        <p className="text-xs text-slate-400 text-center py-2">No services added yet.</p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <button 
                                                onClick={handlePackageSubmit}
                                                className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition mt-2"
                                            >
                                                Save Package
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                     )}

                     {/* ROLES SETTINGS */}
                     {activeTab === 'ROLES' && (
                        <SettingsCard 
                           title="Access Control" 
                           description="Configure role-based access permissions."
                           icon={Shield}
                           actions={
                               <button 
                                   onClick={handleSavePermissions}
                                   className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition shadow-lg flex items-center gap-2"
                               >
                                   <Save size={18}/> Save Changes
                               </button>
                           }
                        >
                            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                                <table className="w-full text-left bg-white/50">
                                     <thead className="bg-purple-50/50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                         <tr>
                                             <th className="p-5 border-b border-purple-100">Module Access</th>
                                             <th className="p-5 text-center border-b border-purple-100 bg-slate-50/50">Owner</th>
                                             <th className="p-5 text-center border-b border-purple-100">Manager</th>
                                             <th className="p-5 text-center border-b border-purple-100 bg-slate-50/50">Stylist</th>
                                             <th className="p-5 text-center border-b border-purple-100">Receptionist</th>
                                         </tr>
                                     </thead>
                                     <tbody className="text-sm">
                                         {Object.keys(localPermissions).map(module => (
                                             <tr key={module} className="border-b border-slate-50 hover:bg-purple-50/20 transition-colors">
                                                 <td className="p-5 font-bold text-slate-700 capitalize">
                                                     {module === 'CRM' ? 'Client Management (CRM)' : module.replace('_', ' ').toLowerCase()}
                                                 </td>
                                                 <td className="p-5 text-center bg-slate-50/30">
                                                     <div className="flex justify-center text-slate-300"><Lock size={16}/></div>
                                                 </td>
                                                 {[Role.MANAGER, Role.STYLIST, Role.RECEPTIONIST].map((role, idx) => {
                                                     const isEnabled = localPermissions[module]?.includes(role);
                                                     return (
                                                         <td key={role} className={`p-5 text-center ${idx % 2 !== 0 ? 'bg-slate-50/30' : ''}`}>
                                                             <button 
                                                                onClick={() => handlePermissionToggle(module, role)}
                                                                className={`w-12 h-7 rounded-full relative transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 mx-auto ${isEnabled ? 'bg-purple-600' : 'bg-slate-200'}`}
                                                             >
                                                                 <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition duration-300 ease-in-out shadow-md ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                                             </button>
                                                         </td>
                                                     );
                                                 })}
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                            </div>
                        </SettingsCard>
                     )}

                     {/* LOYALTY SETTINGS */}
                     {activeTab === 'LOYALTY' && (
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-500">
                             <div className="md:col-span-2 space-y-6">
                                <SettingsCard 
                                    title="Loyalty Configuration" 
                                    description="Define how customers earn and redeem points."
                                    icon={Gift}
                                >
                                     <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-100 mb-8 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl shadow-sm ${loyaltyConfig.enabled ? 'bg-green-100 text-green-700' : 'bg-white text-slate-400'}`}>
                                                {loyaltyConfig.enabled ? <CheckCircle2 size={24}/> : <X size={24}/>}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">Loyalty Program Status</h4>
                                                <p className="text-sm text-slate-500 font-medium">{loyaltyConfig.enabled ? 'Active and collecting points' : 'Program is currently disabled'}</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={loyaltyConfig.enabled} onChange={e => setLoyaltyConfig({...loyaltyConfig, enabled: e.target.checked})} />
                                            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600 shadow-inner"></div>
                                        </label>
                                     </div>

                                     <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-opacity duration-300 ${!loyaltyConfig.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <div className="relative p-6 rounded-2xl border border-slate-200 bg-white/50 shadow-sm hover:border-purple-300 transition-colors group">
                                            <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-purple-600 uppercase border border-purple-100 rounded-md">Earning Rule</div>
                                            <p className="text-sm text-slate-500 mb-4 font-medium">Customer spends</p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-bold text-slate-400">₹</span>
                                                <input 
                                                    type="number"
                                                    value={loyaltyConfig.spendForOnePoint}
                                                    onChange={e => setLoyaltyConfig({...loyaltyConfig, spendForOnePoint: Number(e.target.value)})}
                                                    className="w-full text-3xl font-bold text-purple-600 border-b-2 border-slate-200 focus:border-purple-600 outline-none bg-transparent py-1 transition-colors"
                                                />
                                            </div>
                                            <p className="text-sm font-bold text-slate-800 mt-4 flex items-center gap-2">
                                                To earn <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">1 Point</span>
                                            </p>
                                        </div>

                                        <div className="relative p-6 rounded-2xl border border-slate-200 bg-white/50 shadow-sm hover:border-purple-300 transition-colors group">
                                            <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-purple-600 uppercase border border-purple-100 rounded-md">Redemption Rule</div>
                                            <p className="text-sm text-slate-500 mb-4 font-medium">1 Point equals</p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-bold text-slate-400">₹</span>
                                                <input 
                                                    type="number"
                                                    value={loyaltyConfig.pointValue}
                                                    onChange={e => setLoyaltyConfig({...loyaltyConfig, pointValue: Number(e.target.value)})}
                                                    className="w-full text-3xl font-bold text-purple-600 border-b-2 border-slate-200 focus:border-purple-600 outline-none bg-transparent py-1 transition-colors"
                                                />
                                            </div>
                                            <p className="text-sm font-bold text-slate-800 mt-4">Discount Value</p>
                                        </div>
                                     </div>

                                     <div className="mt-8 pt-6 border-t border-purple-50 flex justify-end">
                                        <button 
                                            onClick={handleSaveLoyalty}
                                            className="px-8 py-3.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-200 flex items-center gap-2"
                                        >
                                            <Save size={18} /> Save Configuration
                                        </button>
                                     </div>
                                </SettingsCard>
                             </div>
                             
                             {/* Preview Card */}
                             <div className="space-y-6">
                                 <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-[2rem] p-8 text-white shadow-2xl shadow-pink-900/30 relative overflow-hidden group">
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-8 -mt-8 blur-xl group-hover:scale-110 transition-transform"></div>
                                     <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-8 -mb-8 blur-lg"></div>
                                     
                                     <div className="relative z-10 text-center">
                                         <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-6 flex items-center justify-center backdrop-blur-sm shadow-inner">
                                             <Gift size={32} className="text-white"/>
                                         </div>
                                         <h3 className="text-xl font-bold mb-1">Loyalty Preview</h3>
                                         <p className="text-pink-100 text-sm mb-8 font-medium">Customer Wallet View</p>
                                         
                                         <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-left relative overflow-hidden">
                                             <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full"></div>
                                             <div className="flex justify-between items-end mb-2">
                                                <span className="text-xs font-bold text-pink-100 uppercase tracking-wide">Points Balance</span>
                                                <span className="text-3xl font-bold">150</span>
                                             </div>
                                             <div className="h-2 bg-black/20 rounded-full overflow-hidden mb-3">
                                                 <div className="h-full bg-white w-3/4 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                                             </div>
                                             <p className="text-xs text-pink-100 font-medium">Worth <span className="font-bold text-white">₹{150 * loyaltyConfig.pointValue}</span> in discounts</p>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     )}

                    {/* NOTIFICATIONS SETTINGS */}
                    {activeTab === 'NOTIFICATIONS' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
                            <SettingsCard 
                                title="Notification Provider" 
                                description="Connect WhatsApp/SMS API."
                                icon={MessageCircle}
                            >
                                <div className="space-y-6">
                                     {/* Enable Toggle */}
                                     <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
                                         <div className="flex items-center gap-3">
                                             <div className={`p-2 rounded-lg ${notificationConfig.enabled ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                                                 {notificationConfig.enabled ? <CheckCircle2 size={20}/> : <X size={20}/>}
                                             </div>
                                             <div>
                                                 <p className="font-bold text-slate-800">Enable Notifications</p>
                                                 <p className="text-xs text-slate-500">Master switch for all alerts</p>
                                             </div>
                                         </div>
                                         <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={notificationConfig.enabled} 
                                                onChange={e => setNotificationConfig({...notificationConfig, enabled: e.target.checked})} 
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                        </label>
                                     </div>

                                     {/* Provider Select */}
                                     <div>
                                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block ml-1">SMS / WhatsApp Provider</label>
                                         <select 
                                            value={notificationConfig.provider}
                                            onChange={e => setNotificationConfig({...notificationConfig, provider: e.target.value as any})}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium outline-none focus:border-purple-500 transition appearance-none"
                                         >
                                             <option value="MANUAL_LINK">Manual WhatsApp Link (Free)</option>
                                             <option value="TWILIO">Twilio API (Paid)</option>
                                             <option value="WHATSAPP_CLOUD_API">WhatsApp Cloud API (Meta)</option>
                                         </select>
                                         <p className="text-xs text-slate-500 mt-2 px-1">
                                             {notificationConfig.provider === 'MANUAL_LINK' && 'Opens WhatsApp Web/App to send messages manually. No API key required.'}
                                             {notificationConfig.provider === 'TWILIO' && 'Requires Twilio Account SID and Auth Token.'}
                                             {notificationConfig.provider === 'WHATSAPP_CLOUD_API' && 'Requires Meta Developer Account and Phone Number ID.'}
                                         </p>
                                     </div>

                                     {/* API Keys */}
                                     {notificationConfig.provider !== 'MANUAL_LINK' && (
                                         <div className="space-y-4 pt-4 border-t border-slate-100">
                                             <InputField 
                                                label="API Key / Auth Token" 
                                                type="password"
                                                value={notificationConfig.apiKey || ''}
                                                onChange={(e: any) => setNotificationConfig({...notificationConfig, apiKey: e.target.value})}
                                             />
                                             <InputField 
                                                label="Phone Number ID / SID" 
                                                value={notificationConfig.phoneNumberId || ''}
                                                onChange={(e: any) => setNotificationConfig({...notificationConfig, phoneNumberId: e.target.value})}
                                             />
                                         </div>
                                     )}
                                </div>
                            </SettingsCard>

                            <SettingsCard 
                                title="Triggers & Events" 
                                description="Choose when to send messages."
                                icon={Send}
                                actions={
                                    <button 
                                        onClick={handleSaveNotifications}
                                        className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-200 flex items-center gap-2"
                                    >
                                        <Save size={18}/> Save Config
                                    </button>
                                }
                            >
                                <div className="space-y-3">
                                    {[
                                        { id: 'appointmentBooking', label: 'New Appointment Confirmation', desc: 'Sent to client when booking is created.' },
                                        { id: 'billGeneration', label: 'Invoice & Bill PDF', desc: 'Sent to client after checkout.' },
                                        { id: 'staffDailyReport', label: 'Staff Performance Report', desc: 'Sent to stylist at day end.' },
                                        { id: 'lowStock', label: 'Low Stock Alerts', desc: 'Sent to admin when inventory is low.' },
                                    ].map(trigger => (
                                        <div key={trigger.id} className="flex items-center justify-between p-4 bg-white/50 border border-slate-100 rounded-xl hover:bg-purple-50 transition">
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{trigger.label}</p>
                                                <p className="text-xs text-slate-500">{trigger.desc}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer" 
                                                    checked={(notificationConfig.triggers as any)[trigger.id]} 
                                                    onChange={e => setNotificationConfig({
                                                        ...notificationConfig, 
                                                        triggers: { ...notificationConfig.triggers, [trigger.id]: e.target.checked }
                                                    })} 
                                                />
                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </SettingsCard>
                        </div>
                    )}

                    {/* DATA MANAGEMENT */}
                    {activeTab === 'DATA_MGMT' && (
                        <div className="animate-in fade-in duration-500">
                             <SettingsCard 
                               title="Data Backup & Migration" 
                               description="Export your data or import from other systems."
                               icon={Database}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-white rounded-lg text-purple-600 shadow-sm"><Scissors size={20}/></div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">Service Menu</h4>
                                                <p className="text-xs text-slate-500">Manage list of services & prices</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <input 
                                                type="file" 
                                                ref={serviceImportRef} 
                                                onChange={handleImportServices} 
                                                accept=".csv" 
                                                className="hidden" 
                                            />
                                            <button onClick={() => serviceImportRef.current?.click()} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-purple-300 hover:text-purple-700 transition flex items-center justify-center gap-2">
                                                <FileUp size={16}/> Import CSV
                                            </button>
                                            <button onClick={handleExportServices} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 shadow-lg shadow-purple-200 transition flex items-center justify-center gap-2">
                                                <FileDown size={16}/> Export CSV
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm"><PackageIcon size={20}/></div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">Product Inventory</h4>
                                                <p className="text-xs text-slate-500">Manage stock levels & products</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <input 
                                                type="file" 
                                                ref={productImportRef} 
                                                onChange={handleImportProducts} 
                                                accept=".csv" 
                                                className="hidden" 
                                            />
                                            <button onClick={() => productImportRef.current?.click()} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-emerald-300 hover:text-emerald-700 transition flex items-center justify-center gap-2">
                                                <FileUp size={16}/> Import CSV
                                            </button>
                                            <button onClick={handleExportProducts} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition flex items-center justify-center gap-2">
                                                <FileDown size={16}/> Export CSV
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-700 mb-2">CSV Format Guidelines</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-500 bg-slate-50 p-4 rounded-xl">
                                        <div>
                                            <p className="font-bold text-purple-700 mb-1">Services CSV Columns:</p>
                                            <p className="font-mono">ID, Name, Category, Price, DurationMins</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-emerald-700 mb-1">Products CSV Columns:</p>
                                            <p className="font-mono">ID, Name, Category, Price, CostPrice, Stock, SKU</p>
                                        </div>
                                    </div>
                                </div>
                            </SettingsCard>
                        </div>
                    )}

                 </div>
             </div>
        </div>
    );
};

export default Settings;
