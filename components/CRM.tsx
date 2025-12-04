
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, User, Phone, Mail, Calendar, Edit, Wallet, History, Gift, CreditCard, X, Check, Package as PackageIcon, ArrowRight, Download, Upload, ChevronDown } from 'lucide-react';
import { Customer, Appointment, Bill, UserPackage, Service, PackageTemplate, GiftCard } from '../types';

interface CRMProps {
    customers: Customer[];
    onUpdateCustomers: (customers: Customer[]) => void;
    appointments: Appointment[];
    bills: Bill[];
}

const CRM: React.FC<CRMProps> = ({ customers, onUpdateCustomers, appointments, bills }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [packageTemplates, setPackageTemplates] = useState<PackageTemplate[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'INFO' | 'HISTORY' | 'WALLET' | 'PACKAGES'>('INFO');
  
  // Edit State
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Package Modal
  const [showPackageAssign, setShowPackageAssign] = useState(false);

  // Gift Card Modal
  const [showGiftCardModal, setShowGiftCardModal] = useState(false);
  const [giftCardForm, setGiftCardForm] = useState({ amount: 1000, expiryDays: 365, notes: '' });

  // Import/Export State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedServices = localStorage.getItem('services');
    if (savedServices) setServices(JSON.parse(savedServices));

    const savedPackages = localStorage.getItem('packageTemplates');
    if (savedPackages) setPackageTemplates(JSON.parse(savedPackages));

    const savedGiftCards = localStorage.getItem('giftCards');
    if (savedGiftCards) setGiftCards(JSON.parse(savedGiftCards));
  }, []);

  useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') { 
            setShowModal(false); 
            setSelectedCustomer(null);
            setShowPackageAssign(false);
            setShowGiftCardModal(false);
            setShowExportMenu(false);
        }
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }, []);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newCustomer: Customer = {
      id: 'C' + Date.now(),
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      visits: 0,
      walletBalance: 0,
      loyaltyPoints: 0,
      dob: (form.elements.namedItem('dob') as HTMLInputElement).value,
    };
    
    onUpdateCustomers([...customers, newCustomer]);
    setShowModal(false);
  };

  const updateCustomer = (updatedData: Partial<Customer>) => {
      if (!selectedCustomer) return;
      const updatedList = customers.map(c => c.id === selectedCustomer.id ? { ...c, ...updatedData } : c);
      onUpdateCustomers(updatedList);
      setSelectedCustomer({ ...selectedCustomer, ...updatedData });
  };

  const addFunds = (amount: number) => {
      if (!selectedCustomer) return;
      updateCustomer({ walletBalance: selectedCustomer.walletBalance + amount });
  };

  const startEdit = (field: string, value: string) => {
      setEditingField(field);
      setEditValue(value || '');
  };

  const saveEdit = (field: keyof Customer) => {
      if (!selectedCustomer) return;
      updateCustomer({ [field]: editValue });
      setEditingField(null);
  };

  const assignPackage = (pkgTemplate: PackageTemplate) => {
      if (!selectedCustomer) return;
      
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + pkgTemplate.validityDays);

      const newPkg: UserPackage = {
          id: 'UPKG-' + Date.now(),
          name: pkgTemplate.name,
          expiryDate: expiry.toISOString().split('T')[0],
          servicesRemaining: pkgTemplate.services
      };

      const currentPackages = selectedCustomer.packages || [];
      updateCustomer({ packages: [...currentPackages, newPkg] });
      setShowPackageAssign(false);
      alert(`Package "${pkgTemplate.name}" assigned successfully!`);
  };

  const handleIssueGiftCard = (e: React.FormEvent) => {
      e.preventDefault();
      const code = 'GC-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + giftCardForm.expiryDays);

      const newCard: GiftCard = {
          code,
          initialAmount: giftCardForm.amount,
          balance: giftCardForm.amount,
          expiryDate: expiry.toISOString().split('T')[0],
          status: 'ACTIVE',
          issuedToName: selectedCustomer ? selectedCustomer.name : 'Unassigned'
      };

      const updated = [newCard, ...giftCards];
      setGiftCards(updated);
      localStorage.setItem('giftCards', JSON.stringify(updated));
      setShowGiftCardModal(false);
      alert(`Gift Card Generated: ${code}`);
  };

  // --- IMPORT / EXPORT LOGIC ---
  const handleExport = (genderFilter: 'ALL' | 'Male' | 'Female') => {
    let data = customers;
    if (genderFilter !== 'ALL') {
        data = customers.filter(c => c.gender === genderFilter);
    }

    if (data.length === 0) {
        alert("No customers found for the selected criteria.");
        return;
    }
    
    const headers = "Name,Phone,Email,Gender,DOB,WalletBalance,LoyaltyPoints";
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + 
        data.map(c => `"${c.name}",${c.phone},${c.email||''},${c.gender||''},${c.dob||''},${c.walletBalance},${c.loyaltyPoints||0}`).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_${genderFilter.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        // Expect header: Name,Phone,Email,Gender,DOB,WalletBalance,LoyaltyPoints
        const newCusts: Customer[] = [];
        let addedCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const parts = line.split(',').map(p => p.replace(/^"|"$/g, '').trim());
            
            if (parts.length < 2 || !parts[0] || !parts[1]) continue; // Name and Phone mandatory

            const phone = parts[1];
            // Check duplicates
            if (!customers.find(c => c.phone === phone) && !newCusts.find(c => c.phone === phone)) {
                 newCusts.push({
                    id: 'C' + Date.now() + Math.floor(Math.random() * 10000),
                    name: parts[0],
                    phone: phone,
                    email: parts[2] || '',
                    gender: (parts[3] as any) || 'Female',
                    dob: parts[4] || '',
                    visits: 0,
                    walletBalance: Number(parts[5]) || 0,
                    loyaltyPoints: Number(parts[6]) || 0
                });
                addedCount++;
            }
        }

        if (addedCount > 0) {
            const updated = [...customers, ...newCusts];
            onUpdateCustomers(updated);
            alert(`Successfully imported ${addedCount} new customers.`);
        } else {
            alert('No new unique customers found in file. Duplicates by phone number are skipped.');
        }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  // Service Name Lookup Helper
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || id;

  // Filter Logic
  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  const getCustomerHistory = () => {
      if (!selectedCustomer) return { historyAppts: [], historyBills: [] };
      const historyAppts = appointments.filter(a => a.customerId === selectedCustomer.id || a.customerName === selectedCustomer.name);
      const historyBills = bills.filter(b => b.customerName === selectedCustomer.name);
      return { historyAppts, historyBills };
  };

  const EditableField = ({ label, fieldKey, value, type = 'text' }: { label: string, fieldKey: keyof Customer, value: string, type?: string }) => {
      const isEditing = editingField === fieldKey;
      return (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group transition hover:border-purple-200">
            <h4 className="font-bold text-slate-500 text-xs uppercase mb-1">{label}</h4>
            {isEditing ? (
                <div className="flex items-center gap-2">
                    <input 
                        type={type}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full p-1.5 text-sm border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 outline-none"
                        autoFocus
                    />
                    <button onClick={() => saveEdit(fieldKey)} className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600"><Check size={14}/></button>
                    <button onClick={() => setEditingField(null)} className="p-1.5 bg-red-400 text-white rounded hover:bg-red-500"><X size={14}/></button>
                </div>
            ) : (
                <div className="flex justify-between items-center">
                    <p className="text-slate-800 font-bold truncate pr-6">{value || 'N/A'}</p>
                    <button 
                        onClick={() => startEdit(fieldKey, value)} 
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-purple-600 hover:bg-purple-100 p-1.5 rounded transition"
                        title="Edit"
                    >
                        <Edit size={14}/>
                    </button>
                </div>
            )}
        </div>
      );
  };

  const { historyBills } = getCustomerHistory();

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Customer Management</h2>
          <p className="text-slate-500">View profiles, history and wallet balances.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            
            {/* Import / Export Controls */}
            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1 mr-2 shadow-sm">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImportFile} 
                    accept=".csv" 
                    className="hidden" 
                />
                <button 
                    onClick={handleImportClick}
                    className="px-3 py-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                    title="Import CSV"
                >
                    <Upload size={16}/> Import
                </button>
                <div className="w-px h-6 bg-slate-200"></div>
                <div className="relative">
                    <button 
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="px-3 py-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                    >
                        <Download size={16}/> Export <ChevronDown size={14}/>
                    </button>
                    {showExportMenu && (
                        <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl w-40 overflow-hidden z-20 animate-in fade-in zoom-in-95">
                            <button onClick={() => handleExport('ALL')} className="w-full text-left px-4 py-2.5 hover:bg-purple-50 text-sm font-medium text-slate-700">All Clients</button>
                            <button onClick={() => handleExport('Male')} className="w-full text-left px-4 py-2.5 hover:bg-purple-50 text-sm font-medium text-slate-700">Male Clients</button>
                            <button onClick={() => handleExport('Female')} className="w-full text-left px-4 py-2.5 hover:bg-purple-50 text-sm font-medium text-slate-700">Female Clients</button>
                        </div>
                    )}
                </div>
            </div>

            <button 
            onClick={() => setShowGiftCardModal(true)}
            className="bg-white text-purple-600 border border-purple-200 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-50 shadow-sm"
            >
            <Gift size={18} /> Issue Gift Card
            </button>
            <button 
            onClick={() => setShowModal(true)}
            className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-200"
            >
            <Plus size={18} /> Add Customer
            </button>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/50">
        <div className="p-4 border-b border-purple-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-2 border border-purple-100 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-white" 
              placeholder="Search by Name or Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-purple-50/50 text-slate-500 font-bold text-xs uppercase">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Gender</th>
                <th className="p-4">Wallet</th>
                <th className="p-4 text-pink-600">Points</th>
                <th className="p-4">Birthday</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-purple-50/50 transition cursor-pointer" onClick={() => setSelectedCustomer(c)}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold border border-purple-200">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">ID: {c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600"><Phone size={14}/> {c.phone}</div>
                    <div className="flex items-center gap-2 text-slate-600 mt-1"><Mail size={14}/> {c.email || '-'}</div>
                  </td>
                  <td className="p-4 text-sm font-medium">{c.gender || '-'}</td>
                  <td className="p-4 text-sm font-bold text-emerald-600">₹{c.walletBalance}</td>
                  <td className="p-4 text-sm font-bold text-pink-600">{c.loyaltyPoints || 0}</td>
                  <td className="p-4 text-sm text-slate-500">{c.dob || '-'}</td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-purple-600"><Edit size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-xl mb-6 text-slate-800">Add New Customer</h3>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-600">Full Name</label>
                <input name="name" required className="w-full border border-purple-100 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-600">Phone Number</label>
                <input name="phone" required className="w-full border border-purple-100 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-600">Email (Optional)</label>
                <input name="email" type="email" className="w-full border border-purple-100 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-600">Date of Birth</label>
                <input name="dob" type="date" className="w-full border border-purple-100 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gift Card Modal */}
      {showGiftCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setShowGiftCardModal(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                  <h3 className="font-bold text-xl mb-4 text-slate-800">Issue Gift Card</h3>
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-xl mb-6 text-center shadow-lg">
                      <Gift size={32} className="mx-auto mb-2"/>
                      <p className="font-medium text-purple-100">Digital Gift Card</p>
                  </div>
                  <form onSubmit={handleIssueGiftCard} className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold mb-1 text-slate-600">Amount (₹)</label>
                          <input 
                            type="number" required 
                            value={giftCardForm.amount}
                            onChange={e => setGiftCardForm({...giftCardForm, amount: Number(e.target.value)})}
                            className="w-full border border-purple-100 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none text-lg font-bold" 
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold mb-1 text-slate-600">Validity (Days)</label>
                          <input 
                            type="number" required 
                            value={giftCardForm.expiryDays}
                            onChange={e => setGiftCardForm({...giftCardForm, expiryDays: Number(e.target.value)})}
                            className="w-full border border-purple-100 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none" 
                          />
                      </div>
                      <button type="submit" className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg mt-2">Generate Code</button>
                  </form>
                  <div className="mt-6 border-t pt-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Recent Gift Cards</h4>
                      <div className="max-h-32 overflow-y-auto space-y-2">
                          {giftCards.map(gc => (
                              <div key={gc.code} className="flex justify-between text-sm bg-slate-50 p-2 rounded border">
                                  <span className="font-mono font-bold text-purple-700">{gc.code}</span>
                                  <span className="font-bold">₹{gc.balance}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Detail View Modal */}
      {selectedCustomer && !showModal && !showGiftCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setSelectedCustomer(null)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="p-6 bg-purple-600 text-white flex justify-between items-start shrink-0">
                      <div className="flex items-center gap-4">
                         <div className="h-16 w-16 bg-white text-purple-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                            {selectedCustomer.name.charAt(0)}
                         </div>
                         <div>
                             <h2 className="text-2xl font-bold">{selectedCustomer.name}</h2>
                             <p className="opacity-90 flex items-center gap-2 text-sm"><Phone size={14}/> {selectedCustomer.phone}</p>
                         </div>
                      </div>
                      <button onClick={() => setSelectedCustomer(null)} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition"><X size={20}/></button>
                  </div>
                  
                  <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 overflow-x-auto">
                      <button onClick={() => setActiveTab('INFO')} className={`px-6 py-4 text-sm font-bold whitespace-nowrap ${activeTab === 'INFO' ? 'border-b-2 border-purple-600 text-purple-600 bg-white' : 'text-slate-500 hover:text-purple-600'}`}>Profile Info</button>
                      <button onClick={() => setActiveTab('HISTORY')} className={`px-6 py-4 text-sm font-bold whitespace-nowrap ${activeTab === 'HISTORY' ? 'border-b-2 border-purple-600 text-purple-600 bg-white' : 'text-slate-500 hover:text-purple-600'}`}>Visit History</button>
                      <button onClick={() => setActiveTab('WALLET')} className={`px-6 py-4 text-sm font-bold whitespace-nowrap ${activeTab === 'WALLET' ? 'border-b-2 border-purple-600 text-purple-600 bg-white' : 'text-slate-500 hover:text-purple-600'}`}>Wallet & Loyalty</button>
                      <button onClick={() => setActiveTab('PACKAGES')} className={`px-6 py-4 text-sm font-bold whitespace-nowrap ${activeTab === 'PACKAGES' ? 'border-b-2 border-purple-600 text-purple-600 bg-white' : 'text-slate-500 hover:text-purple-600'}`}>Packages</button>
                  </div>

                  <div className="p-8 overflow-y-auto flex-1 bg-white">
                      {activeTab === 'INFO' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div>
                                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={18}/> Personal Details</h4>
                                  <div className="space-y-4">
                                      <EditableField label="Full Name" fieldKey="name" value={selectedCustomer.name} />
                                      <EditableField label="Phone Number" fieldKey="phone" value={selectedCustomer.phone} />
                                      <EditableField label="Email Address" fieldKey="email" value={selectedCustomer.email || ''} />
                                      <EditableField label="Date of Birth" fieldKey="dob" value={selectedCustomer.dob || ''} type="date" />
                                      <EditableField label="Gender" fieldKey="gender" value={selectedCustomer.gender || ''} />
                                  </div>
                              </div>
                              <div className="space-y-6">
                                   <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                                      <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2"><CreditCard size={18}/> Membership Status</h4>
                                      <div className="flex justify-between items-center mb-2">
                                          <span className="text-sm text-indigo-700 font-medium">Current Tier</span>
                                          <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-indigo-600 border border-indigo-200">Silver Member</span>
                                      </div>
                                      <p className="text-xs text-indigo-500">Upgrade to Gold by spending ₹5000 more.</p>
                                   </div>
                                   
                                   <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed flex flex-col items-center justify-center text-center h-48">
                                       <User size={32} className="text-slate-300 mb-2"/>
                                       <p className="text-sm font-bold text-slate-500">Customer Photo</p>
                                       <button className="text-xs text-purple-600 font-bold mt-2 hover:underline">Upload Image</button>
                                   </div>
                              </div>
                          </div>
                      )}

                      {activeTab === 'WALLET' && (
                          <div className="max-w-3xl mx-auto space-y-8 pt-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white p-8 rounded-2xl shadow-xl text-center relative overflow-hidden group">
                                      <div className="absolute -right-4 -top-4 bg-white/10 w-24 h-24 rounded-full group-hover:scale-150 transition duration-500"></div>
                                      <p className="opacity-90 font-medium mb-1 flex items-center justify-center gap-2"><Wallet size={18}/> Wallet Balance</p>
                                      <h3 className="text-4xl font-bold">₹{selectedCustomer.walletBalance}</h3>
                                      <div className="flex gap-2 justify-center mt-6 relative z-10">
                                          <button onClick={() => addFunds(500)} className="px-4 py-2 bg-white/20 rounded-lg text-xs font-bold hover:bg-white/30 backdrop-blur-sm border border-white/10">+ ₹500</button>
                                          <button onClick={() => addFunds(1000)} className="px-4 py-2 bg-white/20 rounded-lg text-xs font-bold hover:bg-white/30 backdrop-blur-sm border border-white/10">+ ₹1000</button>
                                      </div>
                                  </div>

                                  <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white p-8 rounded-2xl shadow-xl text-center relative overflow-hidden">
                                       <div className="absolute -left-4 -bottom-4 bg-white/10 w-24 h-24 rounded-full"></div>
                                      <p className="opacity-90 font-medium mb-1 flex items-center justify-center gap-2"><Gift size={18}/> Loyalty Points</p>
                                      <h3 className="text-4xl font-bold">{selectedCustomer.loyaltyPoints || 0}</h3>
                                      <p className="text-xs opacity-80 mt-2">Earn points on every service.</p>
                                  </div>
                              </div>
                          </div>
                      )}

                      {activeTab === 'HISTORY' && (
                          <div>
                              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><History size={18}/> Past Appointments</h4>
                              {historyBills.length > 0 ? (
                                  <div className="space-y-4">
                                      {historyBills.map((bill, idx) => (
                                          <div key={idx} className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition">
                                              <div className="flex justify-between items-start mb-2">
                                                  <div>
                                                      <p className="font-bold text-slate-800 text-sm">Bill #{bill.id}</p>
                                                      <p className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={12}/> {bill.date}</p>
                                                  </div>
                                                  <div className="text-right">
                                                      <p className="font-bold text-purple-700">₹{bill.total}</p>
                                                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${bill.status === 'REFUNDED' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {bill.status || 'PAID'}
                                                      </span>
                                                  </div>
                                              </div>
                                              <div className="mt-2 pt-2 border-t border-slate-100">
                                                  <p className="text-xs text-slate-600 font-medium">Services:</p>
                                                  <div className="flex flex-wrap gap-1 mt-1">
                                                      {bill.items.map((item, i) => (
                                                          <span key={i} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">{item.name}</span>
                                                      ))}
                                                  </div>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              ) : (
                                  <div className="text-center text-slate-400 py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                      <History size={48} className="mx-auto mb-4 opacity-50"/>
                                      <p>No billing history found.</p>
                                  </div>
                              )}
                          </div>
                      )}
                      
                       {activeTab === 'PACKAGES' && (
                          <div>
                              <div className="flex justify-between items-center mb-6">
                                  <h4 className="font-bold text-slate-800 flex items-center gap-2"><PackageIcon size={18}/> Active Packages</h4>
                                  <button onClick={() => setShowPackageAssign(true)} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-purple-700 shadow-sm">Assign New Package</button>
                              </div>

                              {(selectedCustomer.packages && selectedCustomer.packages.length > 0) ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {selectedCustomer.packages.map((pkg, i) => (
                                          <div key={i} className="bg-white border border-purple-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                                              <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">ACTIVE</div>
                                              <h5 className="font-bold text-slate-800 mb-1">{pkg.name}</h5>
                                              <p className="text-xs text-slate-500 mb-4">Expires: {pkg.expiryDate}</p>
                                              
                                              <div className="space-y-2">
                                                  {pkg.servicesRemaining.map((srv, idx) => (
                                                      <div key={idx} className="flex justify-between items-center text-sm">
                                                          <span className="text-slate-600">{getServiceName(srv.serviceId)}</span>
                                                          <span className="font-bold text-purple-700 bg-purple-50 px-2 rounded">{srv.count} left</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              ) : (
                                  <div className="text-center text-slate-400 py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                      <Gift size={48} className="mx-auto mb-4 opacity-50"/>
                                      <p>No packages assigned to this customer.</p>
                                      <button onClick={() => setShowPackageAssign(true)} className="mt-4 text-purple-600 font-bold text-sm hover:underline">Assign a Package</button>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </div>

              {/* Package Assign Modal */}
              {showPackageAssign && (
                  <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-lg text-slate-800">Select Package</h3>
                              <button onClick={() => setShowPackageAssign(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                          </div>
                          <div className="space-y-3">
                              {packageTemplates.length > 0 ? packageTemplates.map(pkg => (
                                  <div key={pkg.id} className="border border-slate-200 rounded-xl p-4 hover:border-purple-300 hover:bg-purple-50 transition cursor-pointer group" onClick={() => assignPackage(pkg)}>
                                      <div className="flex justify-between items-center mb-2">
                                          <h4 className="font-bold text-purple-700">{pkg.name}</h4>
                                          <span className="font-bold text-slate-900">₹{pkg.price}</span>
                                      </div>
                                      <div className="text-xs text-slate-500 mb-3 space-x-2">
                                          <span>Valid: {pkg.validityDays} Days</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                          {pkg.services.map((s, i) => (
                                              <span key={i} className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                                                  {getServiceName(s.serviceId)} x{s.count}
                                              </span>
                                          ))}
                                      </div>
                                      <div className="mt-3 text-center text-xs font-bold text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                          Click to Assign <ArrowRight size={12}/>
                                      </div>
                                  </div>
                              )) : (
                                  <div className="text-center p-4 text-slate-400">
                                      <p>No package templates found.</p>
                                      <p className="text-xs">Go to Settings to create packages.</p>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default CRM;
