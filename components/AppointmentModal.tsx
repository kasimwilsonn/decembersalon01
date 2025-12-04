
import React, { useState, useRef, useEffect } from 'react';
import { X, Calendar, UserPlus, Search, ArrowLeft, Plus, ChevronDown, Check } from 'lucide-react';
import { Customer, Service, Staff, Appointment, AppointmentStatus, Role } from '../types';

export interface BookingInitialData {
  date?: string;
  time?: string;
  stylistId?: string;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  services: Service[];
  staffList: Staff[];
  initialData?: BookingInitialData | null;
  onBook: (appointment: Appointment, newCustomer?: Customer, newService?: Service, newStaff?: Staff) => void;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ 
  isOpen, 
  onClose, 
  customers, 
  services, 
  staffList,
  initialData,
  onBook 
}) => {
  // Modal States
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Manual Entry States
  const [serviceInput, setServiceInput] = useState('');
  const [stylistInput, setStylistInput] = useState('');
  const [showServiceList, setShowServiceList] = useState(false);
  const [showStylistList, setShowStylistList] = useState(false);
  
  // Form States
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // New Customer Creation State
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', gender: 'Female', dob: '' });
  
  // Auto Job Card Option
  const [autoPrintJobCard, setAutoPrintJobCard] = useState(true);

  // Refs
  const serviceWrapperRef = useRef<HTMLDivElement>(null);
  const stylistWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serviceWrapperRef.current && !serviceWrapperRef.current.contains(event.target as Node)) {
        setShowServiceList(false);
      }
      if (stylistWrapperRef.current && !stylistWrapperRef.current.contains(event.target as Node)) {
        setShowStylistList(false);
      }
    };
    if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Reset/Initialize states when opened
  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setDate(initialData.date || new Date().toISOString().split('T')[0]);
            setTime(initialData.time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
            
            if (initialData.stylistId) {
                const staff = staffList.find(s => s.id === initialData.stylistId);
                if (staff) setStylistInput(staff.name);
            } else {
                setStylistInput('');
            }
        } else {
            setDate(new Date().toISOString().split('T')[0]);
            setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
            setStylistInput('');
        }
        
        // Reset other fields
        setCustomerSearch('');
        setSelectedCustomer(null);
        setServiceInput('');
        setIsNewCustomerMode(false);
        setNewCustomerData({ name: '', phone: '', gender: 'Female', dob: '' });
    }
  }, [isOpen, initialData, staffList]);

  const getFilteredCustomers = () => {
    if (!customerSearch) return [];
    return customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch));
  };

  const getFilteredServices = () => {
    return services.filter(s => s.name.toLowerCase().includes(serviceInput.toLowerCase()));
  };

  const getFilteredStaff = () => {
    return staffList.filter(s => s.name.toLowerCase().includes(stylistInput.toLowerCase()));
  };

  const switchToNewCustomer = () => {
     setIsNewCustomerMode(true);
     const isNum = /^\d+$/.test(customerSearch);
     setNewCustomerData({
         ...newCustomerData,
         name: isNum ? '' : customerSearch,
         phone: isNum ? customerSearch : ''
     });
     setIsSearchFocused(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Resolve Customer
    let finalCustomerId = '';
    let finalCustomerName = '';
    let newCustObj: Customer | undefined;

    if (isNewCustomerMode) {
        newCustObj = {
            id: 'C' + Date.now(),
            name: newCustomerData.name,
            phone: newCustomerData.phone,
            email: '',
            visits: 1,
            walletBalance: 0,
            loyaltyPoints: 0,
            dob: newCustomerData.dob,
            gender: newCustomerData.gender as any
        };
        finalCustomerId = newCustObj.id;
        finalCustomerName = newCustObj.name;
    } else {
        finalCustomerId = selectedCustomer?.id || 'WALKIN-' + Date.now();
        finalCustomerName = selectedCustomer?.name || 'Walk-in Customer';
    }

    // 2. Resolve Service
    let finalServiceId = '';
    let newServiceObj: Service | undefined;
    const existingService = services.find(s => s.name.toLowerCase() === serviceInput.toLowerCase());
    if (existingService) {
      finalServiceId = existingService.id;
    } else if (serviceInput.trim() !== '') {
      newServiceObj = {
        id: 'MANUAL_' + Date.now(),
        name: serviceInput,
        price: 0,
        durationMins: 30,
        category: 'Manual'
      };
      finalServiceId = newServiceObj.id;
    }

    // 3. Resolve Stylist
    let finalStylistId = '';
    let newStaffObj: Staff | undefined;
    const existingStylist = staffList.find(s => s.name.toLowerCase() === stylistInput.toLowerCase());
    if (existingStylist) {
      finalStylistId = existingStylist.id;
    } else if (stylistInput.trim() !== '') {
      newStaffObj = {
        id: 'MANUAL_ST_' + Date.now(),
        name: stylistInput,
        role: Role.STYLIST,
        commissionRate: 0,
        phone: '',
        isActive: true
      };
      finalStylistId = newStaffObj.id;
    }

    if (!finalServiceId || !finalStylistId) {
       alert("Please select or type a valid Service and Stylist.");
       return;
    }

    const newAppt: Appointment = {
      id: Date.now().toString(),
      customerId: finalCustomerId,
      customerName: finalCustomerName,
      serviceIds: [finalServiceId],
      date: date,
      time: time,
      stylistId: finalStylistId,
      status: AppointmentStatus.SCHEDULED,
      type: 'WALK_IN'
    };
    
    onBook(newAppt, newCustObj, newServiceObj, newStaffObj);
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto" 
        onClick={onClose} 
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl animate-in fade-in zoom-in duration-200 relative my-auto"
        onClick={e => e.stopPropagation()} 
      >
        <div className="p-5 border-b border-slate-100 bg-purple-50/50 flex justify-between items-center rounded-t-2xl">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Calendar className="text-purple-600"/> New Appointment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 hover:bg-slate-200 transition"><X size={20} /></button>
        </div>
        
        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit}>
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT COLUMN: CUSTOMER SELECTION (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col gap-6 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-8">
                    {isNewCustomerMode ? (
                      <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 animate-in slide-in-from-right-4 duration-300 relative">
                         <button 
                            type="button" 
                            onClick={() => setIsNewCustomerMode(false)}
                            className="absolute top-3 right-3 text-slate-400 hover:text-purple-600 flex items-center gap-1 text-xs font-bold"
                         >
                            <ArrowLeft size={12}/> Back to Search
                         </button>
                         <h4 className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2"><UserPlus size={16}/> New Customer Details</h4>
                         
                         <div className="grid grid-cols-1 gap-3">
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                                 <input 
                                    required
                                    placeholder="Enter Full Name"
                                    value={newCustomerData.name}
                                    onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})}
                                    className="w-full p-2.5 border border-purple-200 rounded-lg text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none" 
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 mb-1">Mobile Number</label>
                                 <input 
                                    required
                                    placeholder="10-digit Mobile"
                                    value={newCustomerData.phone}
                                    onChange={e => setNewCustomerData({...newCustomerData, phone: e.target.value})}
                                    className="w-full p-2.5 border border-purple-200 rounded-lg text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none" 
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 mb-1">Gender</label>
                                 <select 
                                    value={newCustomerData.gender}
                                    onChange={e => setNewCustomerData({...newCustomerData, gender: e.target.value})}
                                    className="w-full p-2.5 border border-purple-200 rounded-lg text-sm bg-white focus:border-purple-500 outline-none"
                                 >
                                     <option value="Female">Female</option>
                                     <option value="Male">Male</option>
                                     <option value="Other">Other</option>
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 mb-1">Date of Birth</label>
                                 <input 
                                    type="date"
                                    value={newCustomerData.dob}
                                    onChange={e => setNewCustomerData({...newCustomerData, dob: e.target.value})}
                                    className="w-full p-2.5 border border-purple-200 rounded-lg text-sm focus:border-purple-500 outline-none" 
                                 />
                             </div>
                         </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <label className="block text-sm font-bold mb-1.5 text-slate-700">Find Customer</label>
                        {selectedCustomer ? (
                          <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 shadow-sm animate-in fade-in">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold text-purple-700">{selectedCustomer.name[0]}</div>
                              <div>
                                 <p className="font-bold text-sm">{selectedCustomer.name}</p>
                                 <p className="text-xs opacity-80">{selectedCustomer.phone}</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => setSelectedCustomer(null)} className="text-purple-400 hover:text-purple-700"><X size={18}/></button>
                          </div>
                        ) : (
                          <div className="relative">
                            <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                            <input 
                              type="text"
                              placeholder="Search by Name or Phone..." 
                              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition shadow-sm"
                              value={customerSearch}
                              onChange={(e) => setCustomerSearch(e.target.value)}
                              onFocus={() => setIsSearchFocused(true)}
                              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                              autoComplete="off"
                            />
                            {(isSearchFocused) && (
                              <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                                {getFilteredCustomers().length > 0 ? (
                                  getFilteredCustomers().map(c => (
                                    <div 
                                      key={c.id} 
                                      onMouseDown={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                                      className="p-3 hover:bg-purple-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center group"
                                    >
                                      <div>
                                        <p className="font-bold text-slate-800 text-sm group-hover:text-purple-700">{c.name}</p>
                                        <p className="text-xs text-slate-500">{c.phone}</p>
                                      </div>
                                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Existing</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-3">
                                     {customerSearch && <p className="text-xs text-slate-400 mb-2 px-1">No customer found.</p>}
                                  </div>
                                )}
                                <div 
                                    onMouseDown={switchToNewCustomer}
                                    className="p-3 bg-purple-50 hover:bg-purple-100 cursor-pointer text-purple-700 border-t border-purple-100 flex items-center gap-2 font-bold text-sm sticky bottom-0"
                                >
                                    <Plus size={16} /> 
                                    {customerSearch ? `Create New "${customerSearch}"` : 'Add New Customer'}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-500 text-xs leading-relaxed hidden lg:block">
                        <p className="font-bold mb-1 uppercase">Booking Tips</p>
                        <p>Use the search bar to quickly find existing clients by name or mobile number. Creating a new customer profile only takes a few seconds.</p>
                    </div>
                </div>

                {/* RIGHT COLUMN: APPOINTMENT DETAILS (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col gap-5">
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-1.5 text-slate-700">Date</label>
                        <input 
                          name="date" 
                          type="date" 
                          required 
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none bg-white font-medium text-slate-700" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-1.5 text-slate-700">Time</label>
                        <input 
                          name="time" 
                          type="time" 
                          required 
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none bg-white font-medium text-slate-700" 
                        />
                      </div>
                   </div>
                   
                   {/* SERVICE COMBOBOX */}
                   <div className="relative z-30" ref={serviceWrapperRef}>
                    <label className="block text-sm font-bold mb-1.5 text-slate-700">Service</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={serviceInput}
                            onChange={(e) => { setServiceInput(e.target.value); setShowServiceList(true); }}
                            onFocus={() => setShowServiceList(true)}
                            placeholder="Select or Type Service"
                            className="w-full border border-slate-300 rounded-xl p-3 pr-10 focus:ring-2 focus:ring-purple-500 outline-none bg-white text-slate-700"
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowServiceList(!showServiceList)}
                            className="absolute right-2 top-3 text-slate-400 hover:text-purple-600"
                        >
                            <ChevronDown size={20} />
                        </button>
                    </div>
                    {showServiceList && (
                        <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                            {getFilteredServices().map(s => (
                                <div 
                                    key={s.id}
                                    onClick={() => { setServiceInput(s.name); setShowServiceList(false); }}
                                    className="p-3 hover:bg-purple-50 cursor-pointer border-b border-slate-50 last:border-0 text-sm font-bold text-slate-700"
                                >
                                    {s.name} <span className="text-xs font-normal text-slate-500 ml-1">({s.category})</span>
                                </div>
                            ))}
                             {serviceInput && getFilteredServices().length === 0 && (
                                <div className="p-3 text-sm text-purple-600 bg-purple-50 font-medium">
                                    Press Book to create "{serviceInput}"
                                </div>
                             )}
                        </div>
                    )}
                  </div>

                   {/* STYLIST COMBOBOX */}
                   <div className="relative z-20" ref={stylistWrapperRef}>
                    <label className="block text-sm font-bold mb-1.5 text-slate-700">Stylist</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={stylistInput}
                            onChange={(e) => { setStylistInput(e.target.value); setShowStylistList(true); }}
                            onFocus={() => setShowStylistList(true)}
                            placeholder="Select or Type Stylist"
                            className="w-full border border-slate-300 rounded-xl p-3 pr-10 focus:ring-2 focus:ring-purple-500 outline-none bg-white text-slate-700"
                        />
                         <button 
                            type="button" 
                            onClick={() => setShowStylistList(!showStylistList)}
                            className="absolute right-2 top-3 text-slate-400 hover:text-purple-600"
                        >
                            <ChevronDown size={20} />
                        </button>
                    </div>
                    {showStylistList && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                            {getFilteredStaff().map(s => (
                                <div 
                                    key={s.id}
                                    onClick={() => { setStylistInput(s.name); setShowStylistList(false); }}
                                    className="p-3 hover:bg-purple-50 cursor-pointer border-b border-slate-50 last:border-0 text-sm font-bold text-slate-700"
                                >
                                    {s.name}
                                </div>
                            ))}
                            {stylistInput && getFilteredStaff().length === 0 && (
                                <div className="p-3 text-sm text-purple-600 bg-purple-50 font-medium">
                                    Press Book to create "{stylistInput}"
                                </div>
                             )}
                        </div>
                    )}
                  </div>

                   <div className="flex items-center gap-2 pt-2">
                      <input 
                         type="checkbox" 
                         id="autoJobCard" 
                         checked={autoPrintJobCard}
                         onChange={(e) => setAutoPrintJobCard(e.target.checked)}
                         className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                      />
                      <label htmlFor="autoJobCard" className="text-sm text-slate-600 select-none cursor-pointer">Generate Job Card immediately</label>
                   </div>

                   <div className="pt-2">
                     <button type="submit" className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-200 flex justify-center items-center gap-2">
                       <Check size={20} /> Confirm Booking
                     </button>
                   </div>
                </div>
             </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
