
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Printer, Check, Calendar, Clock, List, FileText, Receipt, ArrowRight as ArrowRightIcon, CreditCard, Wallet, Gift, Split, ChevronLeft, ChevronRight, MessageCircle, RefreshCw, Search, Trash2, LayoutGrid, Rows, AlertTriangle, DollarSign, Percent, ShoppingBag, User, XCircle } from 'lucide-react';
import type { Appointment, Bill, Customer, Service, Staff, PaymentTransaction, Product } from '../types';
import { AppointmentStatus } from '../types';
import { sendBillNotification } from '../services/notificationService';

interface OperationsProps {
  activeTab: 'APPOINTMENTS' | 'BILLING';
  onNavigate: (tab: 'APPOINTMENTS' | 'BILLING') => void;
  targetAppointmentId?: string | null;
  onClearTargetAppointment?: () => void;
  // New Props for Data Access
  customers: Customer[];
  services: Service[];
  staffList: Staff[];
  appointments: Appointment[];
  products: Product[];
  setAppointments: (appts: Appointment[]) => void;
  onNewAppointment: (data?: { date?: string; time?: string; stylistId?: string }) => void;
  // Lifted State Props
  bills: Bill[];
  onUpdateBills: (bills: Bill[]) => void;
  shopSettings: any;
}

const Operations: React.FC<OperationsProps> = ({ 
  activeTab, 
  onNavigate, 
  targetAppointmentId, 
  onClearTargetAppointment,
  customers,
  services,
  staffList,
  appointments,
  products,
  setAppointments,
  onNewAppointment,
  bills,
  onUpdateBills,
  shopSettings
}) => {
  const [view, setView] = useState<'CALENDAR' | 'LIST' | 'JOB_CARD' | 'BILLING'>(
      activeTab === 'BILLING' ? 'BILLING' : 'CALENDAR'
  );
  
  // Calendar Sub-view State
  const [calendarView, setCalendarView] = useState<'DAY' | 'WEEK' | 'MONTH'>('DAY');
  
  // Billing Sub-view State
  const [billingView, setBillingView] = useState<'POS' | 'HISTORY'>('POS');
  const [billSearch, setBillSearch] = useState('');

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Current Time State for Calendar Line
  const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(null);

  // Sync view when activeTab prop changes
  useEffect(() => {
    if (activeTab === 'APPOINTMENTS' && view === 'BILLING') {
      setView('CALENDAR');
    } else if (activeTab === 'BILLING' && view !== 'BILLING') {
      setView('BILLING');
    }
  }, [activeTab, view]);

  // Handle Deep Linking / Target Appointment
  useEffect(() => {
    if (targetAppointmentId && appointments.length > 0) {
        const target = appointments.find(a => a.id === targetAppointmentId);
        if (target) {
            setSelectedAppointment(target);
            setView('JOB_CARD');
            // Clear the target so navigation works normally afterwards
            if (onClearTargetAppointment) onClearTargetAppointment();
        }
    }
  }, [targetAppointmentId, appointments, onClearTargetAppointment]);

  // Current Time Indicator Logic
  useEffect(() => {
      const updateTime = () => {
          const now = new Date();
          // Assuming calendar starts at 9:00 AM (540 minutes)
          // Row height is approx 140px for 60 mins -> 2.33px per min
          const startHour = 9;
          const currentHour = now.getHours();
          const currentMin = now.getMinutes();
          
          if (currentHour < startHour || currentHour > 20) {
              setCurrentTimePosition(null);
          } else {
              const minutesPassed = (currentHour - startHour) * 60 + currentMin;
              // 140px per hour slot (approx based on CSS below)
              const pxPerMin = 140 / 60; 
              setCurrentTimePosition(minutesPassed * pxPerMin);
          }
      };
      
      updateTime();
      const interval = setInterval(updateTime, 60000); // Update every minute
      return () => clearInterval(interval);
  }, []);

  // Billing State
  const [generatedBill, setGeneratedBill] = useState<Bill | null>(null);
  const [discountValue, setDiscountValue] = useState(0); // Can be amount or percent value
  const [discountMode, setDiscountMode] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');
  
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI' | 'SPLIT' | 'WALLET'>('CASH');
  const [splitPayment, setSplitPayment] = useState({ cash: 0, card: 0, upi: 0, wallet: 0 });
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [amountPaid, setAmountPaid] = useState(0);
  const [sendNotification, setSendNotification] = useState(true);
  
  // Manual Item Entry State & Smart Search
  const [manualItem, setManualItem] = useState({ name: '', price: '', qty: 1, type: 'SERVICE' as 'SERVICE' | 'PRODUCT' });
  const [itemSearch, setItemSearch] = useState('');
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const itemSearchRef = useRef<HTMLDivElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // Balance Settlement State
  const [settlingBill, setSettlingBill] = useState<Bill | null>(null);
  const [billingContext, setBillingContext] = useState<'CHECKOUT' | 'ADVANCE' | 'NONE'>('NONE');

  // Loyalty State
  const [loyaltyConfig, setLoyaltyConfig] = useState({ enabled: true, spendForOnePoint: 100, pointValue: 1 });
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  // Load remaining data
  useEffect(() => {
    const savedLoyalty = localStorage.getItem('loyaltySettings');
    if (savedLoyalty) setLoyaltyConfig(JSON.parse(savedLoyalty));

    // Click outside handler for item suggestions
    const handleClickOutside = (event: MouseEvent) => {
        if (itemSearchRef.current && !itemSearchRef.current.contains(event.target as Node)) {
            setShowItemSuggestions(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);

  }, []);

  const generateJobCard = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setView('JOB_CARD');
  };

  const handleNoteUpdate = (note: string) => {
    if(!selectedAppointment) return;
    const updatedAppt = { ...selectedAppointment, technicianNotes: note };
    setSelectedAppointment(updatedAppt);
    
    // Update local and global
    const updatedList = appointments.map(a => a.id === selectedAppointment.id ? updatedAppt : a);
    setAppointments(updatedList);
    localStorage.setItem('appointments', JSON.stringify(updatedList));
  };
  
  const calculateBillTotals = (items: any[], discVal: number, discMode: 'AMOUNT' | 'PERCENT', pointsRedeemed: number) => {
    const subtotal = items.reduce((sum, s) => sum + s.price * s.qty, 0);
    // Use dynamic Tax Rate from settings
    const tax = subtotal * ((shopSettings.taxRate || 0) / 100); 
    
    // Calculate Discount
    let calculatedDiscount = 0;
    if (discMode === 'PERCENT') {
        calculatedDiscount = (subtotal * discVal) / 100;
    } else {
        calculatedDiscount = discVal;
    }

    const loyaltyDisc = pointsRedeemed * loyaltyConfig.pointValue;
    const total = Math.max(0, subtotal + tax - calculatedDiscount - loyaltyDisc);
    return { subtotal, tax, total, loyaltyDisc, calculatedDiscount };
  };

  // Helper to update bill when items change manually
  const updateBillItems = (newItems: any[]) => {
      if (!generatedBill) return;
      const { subtotal, tax, total } = calculateBillTotals(newItems, discountValue, discountMode, pointsToRedeem);
      setGeneratedBill({
          ...generatedBill,
          items: newItems,
          subtotal,
          tax,
          total
      });
      // Reset amount paid to full total if not partial, otherwise keep it but don't exceed total
      if (!isPartialPayment) {
          setAmountPaid(total);
      }
  };

  const handleAddManualItem = () => {
      if (!manualItem.name || !manualItem.price || Number(manualItem.price) < 0) return;
      if (!generatedBill) return;

      const newItem = {
          name: manualItem.name,
          price: Number(manualItem.price),
          qty: Number(manualItem.qty) || 1,
          type: manualItem.type
      };

      const updatedItems = [...generatedBill.items, newItem];
      updateBillItems(updatedItems);
      setManualItem({ name: '', price: '', qty: 1, type: 'SERVICE' });
      setItemSearch('');
  };

  const handleRemoveItem = (index: number) => {
      if (!generatedBill) return;
      const updatedItems = generatedBill.items.filter((_, i) => i !== index);
      updateBillItems(updatedItems);
  };

  // Smart Search Selection
  const handleSelectItem = (item: any, type: 'SERVICE' | 'PRODUCT') => {
      setManualItem({
          name: item.name,
          price: item.price.toString(),
          qty: 1,
          type
      });
      setItemSearch(item.name);
      setShowItemSuggestions(false);
      // Focus quantity for quick entry
      setTimeout(() => qtyInputRef.current?.focus(), 50);
  };

  const prepareBillFromAppointment = (appt: Appointment, context: 'CHECKOUT' | 'ADVANCE') => {
    // 1. Check if bill already exists for this appointment
    const existingBill = bills.find(b => b.appointmentId === appt.id && b.status !== 'REFUNDED');
    
    if (existingBill) {
        // If bill exists, we are likely settling balance
        if (context === 'CHECKOUT' && existingBill.status === 'PARTIAL') {
            setBillingContext('CHECKOUT');
            handleSettleDue(existingBill);
            // Ensure we are in Billing View
            if (activeTab !== 'BILLING') onNavigate('BILLING');
            setView('BILLING');
            return;
        } else if (context === 'ADVANCE') {
            alert('An advance/bill already exists for this appointment. Please check Billing History.');
            return;
        }
    }

    // 2. Create New Bill
    const serviceDetails = appt.serviceIds.map(id => services.find(s => s.id === id)!);
    const items = serviceDetails.filter(Boolean).map(s => ({ name: s.name, price: s.price, qty: 1, type: 'SERVICE' as const }));
    
    const { subtotal, tax, total } = calculateBillTotals(items, 0, 'AMOUNT', 0);

    const bill: Bill = {
      id: 'INV-' + Date.now().toString().slice(-6),
      appointmentId: appt.id,
      customerName: appt.customerName,
      items,
      subtotal,
      tax,
      discount: 0,
      total,
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'CASH',
      pointsRedeemed: 0,
      pointsEarned: 0,
      status: 'PAID',
      amountPaid: total,
      dueAmount: 0,
      payments: []
    };
    
    setGeneratedBill(bill);
    setDiscountValue(0);
    setDiscountMode('AMOUNT');
    setAmountPaid(total); // Default to full amount
    setIsPartialPayment(context === 'ADVANCE'); // Default to partial if taking advance
    setPointsToRedeem(0);
    setSendNotification(true);
    setBillingContext(context);
    setManualItem({ name: '', price: '', qty: 1, type: 'SERVICE' });
    setItemSearch('');

    const cust = customers.find(c => c.id === appt.customerId);
    setCurrentCustomer(cust || null);
    
    // Navigation
    if (activeTab !== 'BILLING') onNavigate('BILLING');
    setView('BILLING');
    setBillingView('POS');
  };

  const handleRecordAdvance = (appt: Appointment) => {
      prepareBillFromAppointment(appt, 'ADVANCE');
  };

  const completeServiceAndBill = (appt: Appointment) => {
      prepareBillFromAppointment(appt, 'CHECKOUT');
  };

  const finalizeBill = async () => {
    if (!generatedBill) return;
    const { total, loyaltyDisc, calculatedDiscount } = calculateBillTotals(generatedBill.items, discountValue, discountMode, pointsToRedeem);
    
    if (paymentMode === 'SPLIT') {
        const splitTotal = splitPayment.cash + splitPayment.card + splitPayment.upi + splitPayment.wallet;
        if (Math.abs(splitTotal - total) > 1 && !isPartialPayment) {
            alert(`Split total (${splitTotal}) must match Bill Total (${total})`);
            return;
        }
    }

    const finalAmountPaid = isPartialPayment ? amountPaid : total;
    const dueAmount = total - finalAmountPaid;
    const status = dueAmount > 0 ? 'PARTIAL' : 'PAID';
    const pointsEarned = loyaltyConfig.enabled ? Math.floor(finalAmountPaid / loyaltyConfig.spendForOnePoint) : 0;

    const initialTransaction: PaymentTransaction = {
        id: 'TXN-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        amount: finalAmountPaid,
        mode: paymentMode,
        note: dueAmount > 0 ? 'Advance Payment' : 'Full Payment'
    };

    const finalBill: Bill = { 
        ...generatedBill, 
        discount: calculatedDiscount, 
        total,
        paymentMode,
        isPartialPayment,
        amountPaid: finalAmountPaid,
        dueAmount,
        splitDetails: paymentMode === 'SPLIT' ? splitPayment : undefined,
        pointsRedeemed: pointsToRedeem,
        loyaltyDiscount: loyaltyDisc,
        pointsEarned,
        status,
        payments: [initialTransaction]
    };

    const updatedBills = [...bills, finalBill];
    onUpdateBills(updatedBills);
    
    const savedCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
    const updatedCustomers = savedCustomers.map((c: Customer) => {
        if (c.name === finalBill.customerName) {
            let newWallet = c.walletBalance;
            if (paymentMode === 'WALLET') newWallet -= finalAmountPaid;
            if (paymentMode === 'SPLIT') newWallet -= splitPayment.wallet;
            
            let newPoints = (c.loyaltyPoints || 0) - pointsToRedeem + pointsEarned;
            return { ...c, visits: c.visits + 1, walletBalance: newWallet, loyaltyPoints: newPoints };
        }
        return c;
    });
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));

    // --- APPOINTMENT STATUS UPDATE LOGIC ---
    if (billingContext === 'CHECKOUT' && generatedBill.appointmentId) {
        const updated = appointments.map(a => a.id === generatedBill.appointmentId ? { ...a, status: AppointmentStatus.COMPLETED } : a);
        setAppointments(updated);
        localStorage.setItem('appointments', JSON.stringify(updated));
    }
    // Note: If context is ADVANCE, we keep appointment as SCHEDULED/IN_PROGRESS

    if (sendNotification && currentCustomer) {
        await sendBillNotification(finalBill, currentCustomer.phone);
    }

    alert(`Bill Saved! Status: ${status}`);
    window.print();
    setGeneratedBill(null);
    setBillingContext('NONE');
  };

  const handleSettleDue = (bill: Bill) => {
      setSettlingBill(bill);
      setAmountPaid(bill.dueAmount); // Default to full due amount
      setPaymentMode('CASH');
      setBillingView('POS');
  };

  const submitSettlement = () => {
      if(!settlingBill) return;
      if (amountPaid > settlingBill.dueAmount || amountPaid <= 0) {
          alert("Invalid Amount");
          return;
      }
      
      const newTransaction: PaymentTransaction = {
          id: 'TXN-' + Date.now(),
          date: new Date().toISOString().split('T')[0],
          amount: amountPaid,
          mode: paymentMode,
          note: 'Balance Settlement'
      };

      const newAmountPaid = settlingBill.amountPaid + amountPaid;
      const newDue = settlingBill.dueAmount - amountPaid;
      const newStatus = newDue <= 0 ? 'PAID' : 'PARTIAL';

      const updatedBill: Bill = {
          ...settlingBill,
          amountPaid: newAmountPaid,
          dueAmount: newDue,
          status: newStatus,
          payments: [...(settlingBill.payments || []), newTransaction]
      };

      const updatedBills = bills.map(b => b.id === settlingBill.id ? updatedBill : b);
      onUpdateBills(updatedBills);

      // --- COMPLETE APPOINTMENT IF FULLY PAID AND IN CHECKOUT CONTEXT ---
      if (billingContext === 'CHECKOUT' && settlingBill.appointmentId) {
         const updated = appointments.map(a => a.id === settlingBill.appointmentId ? { ...a, status: AppointmentStatus.COMPLETED } : a);
         setAppointments(updated);
         localStorage.setItem('appointments', JSON.stringify(updated));
      }
      
      setSettlingBill(null);
      setBillingContext('NONE');
      alert("Payment Recorded Successfully!");
  };

  const handleRefund = (bill: Bill) => {
    if (confirm(`Are you sure you want to refund Bill #${bill.id}? This cannot be undone.`)) {
        const updatedBills = bills.map(b => b.id === bill.id ? { ...b, status: 'REFUNDED' } as Bill : b);
        onUpdateBills(updatedBills);
        alert('Bill marked as Refunded.');
    }
  };

  const handleReprint = (bill: Bill) => {
    setGeneratedBill(bill);
    setBillingView('POS');
  };
  
  const getPendingAppointments = () => {
      // Show appointments that are completed/in-progress but NOT yet billed (fully or partially)
      const billedApptIds = new Set(bills.filter(b => b.status === 'PAID').map(b => b.appointmentId));
      
      return appointments.filter(a => 
          (a.status === AppointmentStatus.COMPLETED || a.status === AppointmentStatus.IN_PROGRESS) && 
          !billedApptIds.has(a.id)
      );
  };

  const createBlankBill = () => {
      const bill: Bill = {
        id: 'INV-' + Date.now().toString().slice(-6),
        appointmentId: '',
        customerName: 'Walk-in Customer',
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        date: new Date().toISOString().split('T')[0],
        paymentMode: 'CASH',
        status: 'PAID',
        amountPaid: 0,
        dueAmount: 0,
        payments: []
      };
      setGeneratedBill(bill);
      setCurrentCustomer(null);
      setDiscountValue(0);
      setDiscountMode('AMOUNT');
      setAmountPaid(0);
      setIsPartialPayment(false);
      setManualItem({ name: '', price: '', qty: 1, type: 'SERVICE' });
      setItemSearch('');
      setView('BILLING');
      setBillingView('POS');
      setBillingContext('NONE');
  };

  const handleNavigateDate = (direction: 'PREV' | 'NEXT') => {
      const d = new Date(selectedDate);
      if (calendarView === 'DAY') {
          d.setDate(d.getDate() + (direction === 'NEXT' ? 1 : -1));
      } else if (calendarView === 'WEEK') {
          d.setDate(d.getDate() + (direction === 'NEXT' ? 7 : -7));
      } else {
          d.setMonth(d.getMonth() + (direction === 'NEXT' ? 1 : -1));
      }
      setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Filtered lists for smart search
  const filteredServices = services.filter(s => s.name.toLowerCase().includes(itemSearch.toLowerCase()));
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase()));

  const TIME_SLOTS = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const getWeekDays = (dateStr: string) => {
      const curr = new Date(dateStr);
      const day = curr.getDay(); // 0 is Sunday
      // Set to Sunday of this week
      const first = new Date(curr);
      first.setDate(curr.getDate() - day);
      
      const days = [];
      for (let i = 0; i < 7; i++) {
          const next = new Date(first);
          next.setDate(first.getDate() + i);
          days.push(next.toISOString().split('T')[0]);
      }
      return days;
  };

  const getDateRangeLabel = () => {
      const date = new Date(selectedDate);
      if (calendarView === 'DAY') return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      if (calendarView === 'MONTH') return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      if (calendarView === 'WEEK') {
          const week = getWeekDays(selectedDate);
          const start = new Date(week[0]);
          const end = new Date(week[6]);
          return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      }
      return '';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-[1800px] mx-auto animate-in fade-in duration-300 overflow-hidden">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-2 gap-4 no-print bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm shrink-0 mx-4 mt-4">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center w-full xl:w-auto">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              {view === 'BILLING' ? (billingView === 'POS' ? 'Point of Sale' : 'Billing History') : 'Operations Schedule'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
               {view === 'BILLING' ? 'Manage invoices, payments, and refunds' : getDateRangeLabel()}
            </p>
          </div>
          
          {/* Calendar Navigation */}
          {view === 'CALENDAR' && (
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                  <button onClick={() => handleNavigateDate('PREV')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-purple-600 transition"><ChevronLeft size={20}/></button>
                  <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="px-4 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-md">Today</button>
                  <button onClick={() => handleNavigateDate('NEXT')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-purple-600 transition"><ChevronRight size={20}/></button>
              </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 w-full xl:w-auto justify-end">
          {(view === 'JOB_CARD') && (
             <button onClick={() => setView('CALENDAR')} className="px-4 py-2 border border-purple-200 rounded-xl text-purple-700 hover:bg-purple-50 font-bold text-sm bg-white">Back to Calendar</button>
          )}
          
          {(view === 'BILLING' && generatedBill) && (
              <button onClick={() => setGeneratedBill(null)} className="px-4 py-2 border border-purple-200 rounded-xl text-purple-700 hover:bg-purple-50 font-bold text-sm bg-white">Back to Dashboard</button>
          )}

          {view === 'BILLING' && !generatedBill && !settlingBill && (
             <div className="flex gap-1 bg-purple-100/50 p-1 rounded-xl border border-purple-100">
                 <button 
                    onClick={() => setBillingView('POS')} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${billingView === 'POS' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-purple-600'}`}
                 >
                    <Receipt size={16} /> POS
                 </button>
                 <button 
                    onClick={() => setBillingView('HISTORY')} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${billingView === 'HISTORY' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-purple-600'}`}
                 >
                    <List size={16} /> History
                 </button>
             </div>
          )}

          {(view === 'CALENDAR' || view === 'LIST') && (
             <div className="flex flex-wrap gap-3">
                 {/* Calendar View Toggle */}
                 {view === 'CALENDAR' && (
                     <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
                         <button onClick={() => setCalendarView('DAY')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${calendarView === 'DAY' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Day</button>
                         <button onClick={() => setCalendarView('WEEK')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${calendarView === 'WEEK' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Week</button>
                         <button onClick={() => setCalendarView('MONTH')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${calendarView === 'MONTH' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Month</button>
                     </div>
                 )}

                 <div className="flex gap-1 bg-purple-100/50 p-1 rounded-xl border border-purple-100">
                     <button 
                        onClick={() => setView('CALENDAR')} 
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${view === 'CALENDAR' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-purple-600'}`}
                     >
                        <Calendar size={16} /> <span className="hidden sm:inline">Calendar</span>
                     </button>
                     <button 
                        onClick={() => setView('LIST')} 
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${view === 'LIST' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-purple-600'}`}
                     >
                        <List size={16} /> <span className="hidden sm:inline">List</span>
                     </button>
                 </div>

                 <button 
                    onClick={() => onNewAppointment({ date: selectedDate })}
                    className="px-5 py-2.5 bg-purple-600 text-white rounded-xl flex items-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-200 transition font-bold"
                 >
                    <Plus size={18} /> <span className="hidden sm:inline">New Booking</span>
                 </button>
             </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-4 pb-4">
        {view === 'CALENDAR' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col relative">
                
                {/* --- DAY VIEW (STAFF SCHEDULER) --- */}
                {calendarView === 'DAY' && (
                    <div className="flex-1 overflow-auto custom-scrollbar relative">
                        <div className="min-w-[800px] inline-block w-full relative">
                            {/* Current Time Line (Only show if today) */}
                            {selectedDate === new Date().toISOString().split('T')[0] && currentTimePosition !== null && (
                                <div 
                                    className="absolute w-full h-[2px] bg-red-500 z-40 pointer-events-none flex items-center"
                                    style={{ top: `${currentTimePosition + 50}px` }} // +50 to offset header roughly
                                >
                                    <div className="h-3 w-3 rounded-full bg-red-500 -ml-1.5 shadow-sm"></div>
                                    <div className="text-[10px] font-bold text-white bg-red-500 px-1.5 rounded ml-1">Now</div>
                                </div>
                            )}

                            {/* Header: Staff Names */}
                            <div 
                                className="grid bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm"
                                style={{ gridTemplateColumns: `80px repeat(${staffList.length}, minmax(200px, 1fr))` }}
                            >
                                <div className="p-4 font-bold text-slate-400 text-xs uppercase text-center border-r border-slate-200 bg-white sticky left-0 z-40">Time</div>
                                {staffList.map(staff => (
                                    <div key={staff.id} className="p-4 border-r border-slate-200 text-center relative group bg-white">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-sm font-bold text-purple-700 border border-purple-200 shadow-sm">{staff.name.charAt(0)}</div>
                                            <span className="font-bold text-slate-800 text-sm truncate w-full">{staff.name}</span>
                                            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{staff.role}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Body: Time Slots */}
                            {TIME_SLOTS.map((time, index) => (
                                <div 
                                    key={time} 
                                    className="grid border-b border-slate-100 min-h-[140px]"
                                    style={{ gridTemplateColumns: `80px repeat(${staffList.length}, minmax(200px, 1fr))` }}
                                >
                                    <div className="text-xs font-bold text-slate-400 border-r border-slate-200 text-right pr-4 pt-4 sticky left-0 bg-white z-20">
                                        {time}
                                    </div>
                                    {staffList.map(staff => {
                                        const appt = appointments.find(a => 
                                            a.stylistId === staff.id && 
                                            a.date === selectedDate &&
                                            a.time.startsWith(time.split(':')[0]) &&
                                            a.status !== AppointmentStatus.CANCELLED
                                        );
                                        return (
                                            <div key={staff.id} className="border-r border-slate-100 p-2 relative group hover:bg-slate-50/40 transition-colors">
                                                {appt ? (
                                                    <div 
                                                        className={`
                                                            h-full rounded-xl p-3 border-l-[6px] shadow-sm cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between relative overflow-hidden
                                                            ${appt.status === AppointmentStatus.COMPLETED 
                                                                ? 'bg-emerald-50/80 border-emerald-500' 
                                                                : 'bg-purple-50/80 border-purple-500'}
                                                        `}
                                                        onClick={() => generateJobCard(appt)}
                                                    >
                                                        <div className="relative z-10">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="font-bold text-sm truncate text-slate-800">{appt.customerName}</span>
                                                            </div>
                                                            <div className="text-xs text-slate-600 line-clamp-2 leading-tight">
                                                                {appt.serviceIds.map(id => services.find(s=>s.id===id)?.name).join(', ')}
                                                            </div>
                                                        </div>
                                                        <div className="relative z-10 flex items-center justify-between mt-2">
                                                            <div className="text-[10px] font-bold opacity-70 flex items-center gap-1 bg-white/50 px-1.5 py-0.5 rounded">
                                                                <Clock size={10} /> {appt.time}
                                                            </div>
                                                            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${appt.status === AppointmentStatus.COMPLETED ? 'bg-emerald-200 text-emerald-800' : 'bg-purple-200 text-purple-800'}`}>
                                                                {appt.status === AppointmentStatus.IN_PROGRESS ? 'ACTV' : appt.status.substring(0,3)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-full w-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                                                        <button 
                                                            onClick={() => onNewAppointment({ date: selectedDate, time: time, stylistId: staff.id })} 
                                                            className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-lg"
                                                            title="Add Appointment"
                                                        >
                                                            <Plus size={20} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- WEEK VIEW --- */}
                {calendarView === 'WEEK' && (
                    <div className="flex-1 overflow-auto custom-scrollbar relative">
                        <div className="min-w-[1000px]">
                            {/* Header Row */}
                            <div className="grid grid-cols-8 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                                <div className="p-4 font-bold text-slate-400 text-xs uppercase text-center border-r border-slate-200 sticky left-0 bg-white z-40">Time</div>
                                {getWeekDays(selectedDate).map(dateStr => {
                                    const d = new Date(dateStr);
                                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                                    return (
                                        <div key={dateStr} className={`p-3 text-center border-r border-slate-200 ${isToday ? 'bg-purple-50/50' : 'bg-white'}`}>
                                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">{d.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                            <div className={`text-xl font-bold mx-auto w-10 h-10 rounded-full flex items-center justify-center ${isToday ? 'bg-purple-600 text-white shadow-md' : 'text-slate-800'}`}>
                                                {d.getDate()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Body Rows */}
                            {TIME_SLOTS.map(time => (
                                <div key={time} className="grid grid-cols-8 border-b border-slate-100 min-h-[100px]">
                                    <div className="text-xs font-bold text-slate-400 border-r border-slate-200 text-right pr-4 pt-3 sticky left-0 bg-white z-20">{time}</div>
                                    {getWeekDays(selectedDate).map(dateStr => {
                                        const slotAppts = appointments.filter(a => 
                                            a.date === dateStr && 
                                            a.time.startsWith(time.split(':')[0]) &&
                                            a.status !== AppointmentStatus.CANCELLED
                                        );
                                        return (
                                            <div key={dateStr} className="border-r border-slate-100 p-1 relative group hover:bg-slate-50/30 transition-colors">
                                                {slotAppts.length > 0 ? (
                                                    <div className="flex flex-col gap-1">
                                                        {slotAppts.map(appt => (
                                                            <div 
                                                                key={appt.id}
                                                                onClick={() => generateJobCard(appt)}
                                                                className={`
                                                                    p-2 rounded-lg border-l-4 text-xs cursor-pointer shadow-sm hover:shadow-md transition-all 
                                                                    ${appt.status === AppointmentStatus.COMPLETED ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-white border-purple-500 text-slate-800'}
                                                                `}
                                                            >
                                                                <div className="font-bold truncate">{appt.customerName}</div>
                                                                <div className="text-[10px] opacity-70 truncate flex items-center gap-1 mt-0.5">
                                                                    <User size={8}/> {staffList.find(s=>s.id===appt.stylistId)?.name?.split(' ')[0]}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="h-full w-full opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                                        <button onClick={() => onNewAppointment({ date: dateStr, time })} className="text-slate-300 hover:text-purple-600 transition-colors">
                                                            <Plus size={20} className="bg-white rounded-full p-0.5 shadow-sm border border-slate-200"/>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- MONTH VIEW --- */}
                {calendarView === 'MONTH' && (
                    <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
                        <div className="grid grid-cols-7 mb-4">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="text-right pr-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 border-t border-l border-slate-200 bg-slate-100 gap-px shadow-sm rounded-lg overflow-hidden">
                            {(() => {
                                const date = new Date(selectedDate);
                                const year = date.getFullYear();
                                const month = date.getMonth();
                                const firstDay = new Date(year, month, 1);
                                const lastDay = new Date(year, month + 1, 0);
                                const daysInMonth = lastDay.getDate();
                                const startDayOfWeek = firstDay.getDay(); 

                                const days = [];
                                for (let i = 0; i < startDayOfWeek; i++) {
                                    days.push(<div key={`empty-${i}`} className="min-h-[140px] bg-white/50"></div>);
                                }
                                for (let d = 1; d <= daysInMonth; d++) {
                                    const currentDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                    const isToday = currentDayStr === new Date().toISOString().split('T')[0];
                                    const dayAppts = appointments.filter(a => a.date === currentDayStr && a.status !== AppointmentStatus.CANCELLED);
                                    days.push(
                                        <div 
                                            key={d} 
                                            onClick={() => { setSelectedDate(currentDayStr); setCalendarView('DAY'); }}
                                            className={`min-h-[140px] bg-white p-2 cursor-pointer transition-colors hover:bg-purple-50 group relative`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-sm font-bold h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500'}`}>{d}</span>
                                            </div>
                                            <div className="space-y-1">
                                                {dayAppts.slice(0, 3).map(appt => (
                                                    <div key={appt.id} className={`text-[10px] truncate px-1.5 py-0.5 rounded font-bold border ${appt.status === AppointmentStatus.COMPLETED ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-purple-50 border-purple-100 text-purple-800'}`}>
                                                        {appt.time} {appt.customerName.split(' ')[0]}
                                                    </div>
                                                ))}
                                                {dayAppts.length > 3 && (
                                                    <div className="text-[10px] text-slate-400 font-bold pl-1 mt-1">+{dayAppts.length - 3} more</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                                return days;
                            })()}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* LIST VIEW */}
        {view === 'LIST' && (
            <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden p-6 h-full flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-purple-50/50 text-slate-500 font-bold text-xs uppercase border-b border-purple-100 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 bg-purple-50/50 backdrop-blur-sm">Time</th>
                                <th className="p-4 bg-purple-50/50 backdrop-blur-sm">Customer</th>
                                <th className="p-4 bg-purple-50/50 backdrop-blur-sm">Service</th>
                                <th className="p-4 bg-purple-50/50 backdrop-blur-sm">Stylist</th>
                                <th className="p-4 bg-purple-50/50 backdrop-blur-sm">Status</th>
                                <th className="p-4 text-right bg-purple-50/50 backdrop-blur-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-50">
                            {appointments
                                .filter(a => a.date === selectedDate)
                                .sort((a,b) => a.time.localeCompare(b.time))
                                .map(appt => (
                                <tr key={appt.id} className="hover:bg-purple-50/30">
                                    <td className="p-4 font-bold text-slate-700">{appt.time}</td>
                                    <td className="p-4 font-bold text-slate-900">{appt.customerName}</td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {appt.serviceIds.map(id => services.find(s=>s.id===id)?.name).join(', ')}
                                    </td>
                                    <td className="p-4 text-sm">
                                        {staffList.find(s => s.id === appt.stylistId)?.name}
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${appt.status === AppointmentStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {appt.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        {appt.status !== AppointmentStatus.COMPLETED && (
                                            <>
                                                <button 
                                                    onClick={() => generateJobCard(appt)}
                                                    className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded transition"
                                                    title="View Job Card"
                                                >
                                                    <FileText size={16}/>
                                                </button>
                                                <button 
                                                    onClick={() => completeServiceAndBill(appt)}
                                                    className="p-2 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                                                    title="Complete & Bill"
                                                >
                                                    <Check size={16}/>
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* JOB CARD UI (unchanged) */}
        {view === 'JOB_CARD' && selectedAppointment && (
            <div className="h-full overflow-auto">
                <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-200 print-area animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b pb-6 mb-6">
                        <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">JOB CARD</h1>
                        <p className="text-slate-500 text-sm mt-1 font-mono">#{selectedAppointment.id.toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                        <div className="text-sm text-slate-500 mb-1">Date</div>
                        <div className="font-bold text-slate-800">{new Date(selectedAppointment.date).toLocaleDateString()}</div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
                        <p className="text-xs text-purple-500 uppercase tracking-wide font-bold mb-2">Customer Details</p>
                        <p className="text-xl font-bold text-slate-900">{selectedAppointment.customerName}</p>
                        <p className="text-sm text-slate-600 mt-1">ID: {selectedAppointment.customerId}</p>
                        </div>
                        <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
                        <p className="text-xs text-purple-500 uppercase tracking-wide font-bold mb-2">Service Details</p>
                        <p className="text-lg font-bold text-slate-900">Stylist: {staffList.find(s => s.id === selectedAppointment.stylistId)?.name}</p>
                        <p className="text-sm text-slate-600 mt-1">Time: {selectedAppointment.time}</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Check size={18} className="text-green-500"/> Selected Services</h3>
                        <ul className="divide-y divide-slate-100 border rounded-xl overflow-hidden shadow-sm">
                        {selectedAppointment.serviceIds.map(sid => {
                            const s = services.find(srv => srv.id === sid);
                            return s ? (
                            <li key={sid} className="flex justify-between items-center bg-white p-4">
                                <div>
                                    <span className="font-bold text-slate-900 block">{s.name}</span>
                                    <span className="text-xs text-slate-500 uppercase font-semibold">{s.category}</span>
                                </div>
                                <span className="text-sm bg-slate-100 px-3 py-1 rounded-full text-slate-700 font-medium">{s.durationMins} mins</span>
                            </li>
                            ) : null;
                        })}
                        </ul>
                    </div>

                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 h-48 mb-8 bg-slate-50/50 print:bg-white print:border-slate-800">
                        <p className="text-sm text-slate-400 font-bold mb-2 uppercase flex items-center gap-2">
                            Chemicals Used / Technician Notes 
                            <span className="text-[10px] font-normal normal-case bg-white px-2 py-0.5 rounded border border-slate-200 no-print">Auto-saves</span>
                        </p>
                        <textarea 
                            className="w-full h-[80%] bg-transparent border-none outline-none resize-none text-slate-800 font-medium text-lg leading-relaxed placeholder:text-slate-300 print:placeholder:hidden"
                            placeholder="Start typing details here or leave empty for handwriting..."
                            value={selectedAppointment.technicianNotes || ''}
                            onChange={(e) => handleNoteUpdate(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3 no-print pt-4 border-t border-slate-100">
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition">
                        <Printer size={18} /> Print Card
                        </button>
                        <button onClick={() => handleRecordAdvance(selectedAppointment)} className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 font-bold transition">
                        <DollarSign size={18} /> Record Advance
                        </button>
                        <button onClick={() => completeServiceAndBill(selectedAppointment)} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200 font-bold transition">
                        <Check size={18} /> Complete & Bill
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* BILLING UI (Scrollable) */}
        {view === 'BILLING' && (
            <div className="h-full overflow-auto animate-in fade-in">
                {/* ... existing billing content, just wrapping in scroll container ... */}
                {settlingBill && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                      {/* ... (Modal content) ... */}
                      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                          <h3 className="font-bold text-xl mb-4 text-slate-800">Settle Balance Payment</h3>
                          
                          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-6">
                              <p className="text-xs font-bold text-amber-700 uppercase mb-1">Outstanding Amount</p>
                              <h2 className="text-3xl font-bold text-amber-800">₹{settlingBill.dueAmount}</h2>
                              <p className="text-sm text-slate-600 mt-2">Bill ID: {settlingBill.id} ({settlingBill.customerName})</p>
                          </div>

                          <div className="space-y-4 mb-6">
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-2">Payment Amount</label>
                                  <input 
                                      type="number" 
                                      value={amountPaid} 
                                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                                      className="w-full border border-purple-200 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none transition text-lg font-bold"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-2">Payment Mode</label>
                                  <div className="grid grid-cols-3 gap-2">
                                    {['CASH', 'CARD', 'UPI', 'WALLET'].map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setPaymentMode(mode as any)}
                                            className={`text-xs py-2 rounded-lg border font-bold ${paymentMode === mode ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200'}`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                  </div>
                              </div>
                          </div>

                          <div className="flex gap-3">
                              <button onClick={() => setSettlingBill(null)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                              <button onClick={submitSettlement} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg">Confirm Payment</button>
                          </div>
                      </div>
                  </div>
                )}

                {!generatedBill && billingView === 'POS' && !settlingBill && (
                    <div className="max-w-6xl mx-auto space-y-8">
                        {/* ... Billing Dashboard Content ... */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <button onClick={createBlankBill} className="bg-white p-8 rounded-2xl shadow-sm border border-purple-100 hover:shadow-lg hover:border-purple-300 transition group text-left">
                               <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                   <Receipt size={32}/>
                               </div>
                               <h3 className="text-xl font-bold text-slate-800 mb-1">New Quick Bill</h3>
                               <p className="text-slate-500">Create a blank invoice for walk-in customers or product sales.</p>
                           </button>
                           
                           <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100">
                               <div className="flex items-center justify-between mb-4">
                                   <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                                       <Wallet size={32}/>
                                   </div>
                                   <span className="text-3xl font-bold text-slate-900">₹{bills.filter(b => b.status !== 'REFUNDED').reduce((sum, b) => sum + b.total, 0).toLocaleString()}</span>
                               </div>
                               <h3 className="text-xl font-bold text-slate-800 mb-1">Total Sales</h3>
                               <p className="text-slate-500">Revenue generated from completed bills today.</p>
                           </div>
                       </div>

                       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                           <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                               <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Clock size={20} className="text-amber-500"/> Pending Checkouts</h3>
                               <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">{getPendingAppointments().length} Pending</span>
                           </div>
                           <div className="divide-y divide-slate-100">
                               {getPendingAppointments().length > 0 ? (
                                   getPendingAppointments().map(appt => (
                                       <div key={appt.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                                           <div className="flex items-center gap-4">
                                               <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold border border-purple-200">
                                                   {appt.customerName[0]}
                                               </div>
                                               <div>
                                                   <p className="font-bold text-slate-900">{appt.customerName}</p>
                                                   <p className="text-xs text-slate-500">{appt.serviceIds.map(id => services.find(s=>s.id===id)?.name).join(', ')}</p>
                                               </div>
                                           </div>
                                           <div className="flex items-center gap-4">
                                               <div className="text-right hidden sm:block">
                                                   <p className="text-sm font-bold text-slate-700">Stylist: {staffList.find(s => s.id === appt.stylistId)?.name}</p>
                                                   <p className="text-xs text-slate-400">{appt.time}</p>
                                               </div>
                                               <button 
                                                    onClick={() => completeServiceAndBill(appt)}
                                                    className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 shadow-sm flex items-center gap-2"
                                               >
                                                   Process Bill <ArrowRightIcon size={16}/>
                                               </button>
                                           </div>
                                       </div>
                                   ))
                               ) : (
                                   <div className="p-8 text-center text-slate-400">
                                       <Check size={48} className="mx-auto mb-3 opacity-20"/>
                                       <p>No pending appointments to checkout.</p>
                                   </div>
                               )}
                           </div>
                       </div>
                    </div>
                )}

                {!generatedBill && billingView === 'HISTORY' && !settlingBill && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-6xl mx-auto">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Transaction History</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input 
                                    className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-500"
                                    placeholder="Search Bill ID or Customer..."
                                    value={billSearch}
                                    onChange={(e) => setBillSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-purple-50/50 text-slate-500 font-bold text-xs uppercase sticky top-0 bg-white shadow-sm">
                                    <tr>
                                        <th className="p-4">Bill ID</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Customer</th>
                                        <th className="p-4">Amount</th>
                                        <th className="p-4">Paid</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {bills.filter(b => b.id.includes(billSearch) || b.customerName.toLowerCase().includes(billSearch.toLowerCase()))
                                          .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                          .map(bill => (
                                        <tr key={bill.id} className="hover:bg-purple-50/20">
                                            <td className="p-4 font-mono font-bold text-slate-600 text-xs">{bill.id}</td>
                                            <td className="p-4 text-sm text-slate-600">{bill.date}</td>
                                            <td className="p-4 font-bold text-slate-800">{bill.customerName}</td>
                                            <td className="p-4 font-bold text-slate-900">₹{bill.total}</td>
                                            <td className="p-4 text-sm font-medium text-slate-600">₹{bill.amountPaid}</td>
                                            <td className="p-4">
                                                {bill.status === 'REFUNDED' ? (
                                                    <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-red-100 text-red-700">REFUNDED</span>
                                                ) : bill.status === 'PARTIAL' ? (
                                                    <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-amber-100 text-amber-700">Due: ₹{bill.dueAmount}</span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-emerald-100 text-emerald-700">PAID</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                {bill.status === 'PARTIAL' && (
                                                     <button onClick={() => handleSettleDue(bill)} className="px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 shadow-sm" title="Pay Balance">
                                                         Pay Balance
                                                     </button>
                                                )}
                                                <button onClick={() => handleReprint(bill)} className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded" title="Reprint">
                                                    <Printer size={16}/>
                                                </button>
                                                {bill.status !== 'REFUNDED' && bill.status !== 'PARTIAL' && (
                                                    <button onClick={() => handleRefund(bill)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded" title="Refund">
                                                        <RefreshCw size={16}/>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {bills.length === 0 && (
                                        <tr><td colSpan={7} className="p-8 text-center text-slate-400">No billing history found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ... Generated Bill Preview (Use existing structure but ensure it is visible) ... */}
                {generatedBill && !settlingBill && (
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500 pb-10">
                        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-xl border border-slate-200 print-area relative overflow-hidden h-fit">
                            {/* ... Invoice Preview Content same as before ... */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                            <div className="text-center mb-10 pb-8 border-b border-slate-100">
                                {shopSettings.logo ? (
                                    <img src={shopSettings.logo} alt="Salon Logo" className="h-20 mx-auto mb-4 object-contain" />
                                ) : null}
                                <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-900">Tax Invoice</h2>
                                {/* ... details ... */}
                                <p className="text-slate-800 text-lg mt-2 font-bold">{shopSettings.name}</p>
                                <p className="text-slate-500 text-sm whitespace-pre-line">{shopSettings.address}</p>
                                <p className="text-xs text-slate-400 mt-1">GSTIN: {shopSettings.gstin} | Ph: {shopSettings.phone}</p>
                            </div>
                            
                            {/* ... Rest of Invoice Preview (Items, Totals) ... */}
                            <div className="flex justify-between mb-8 text-sm">
                                <div>
                                <p className="text-slate-400 text-xs uppercase font-bold mb-1">Billed To</p>
                                <p className="font-bold text-slate-900 text-xl">{generatedBill.customerName}</p>
                                </div>
                                <div className="text-right">
                                <p className="text-slate-400 text-xs uppercase font-bold mb-1">Invoice Details</p>
                                <p className="font-mono font-bold text-slate-900 text-lg">#{generatedBill.id}</p>
                                <p className="text-slate-500">{generatedBill.date}</p>
                                {generatedBill.status === 'REFUNDED' && <p className="text-red-600 font-bold uppercase border-2 border-red-600 inline-block px-2 py-1 mt-2 transform -rotate-12">REFUNDED</p>}
                                {generatedBill.status === 'PARTIAL' && <p className="text-amber-600 font-bold uppercase border-2 border-amber-600 inline-block px-2 py-1 mt-2">PARTIAL PAYMENT</p>}
                                </div>
                            </div>

                            <table className="w-full mb-8">
                                <thead className="bg-purple-50 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="py-3 px-4 text-left rounded-l-lg">Item</th>
                                    <th className="py-3 px-4 text-center">Qty</th>
                                    <th className="py-3 px-4 text-right">Price</th>
                                    <th className="py-3 px-4 text-right">Amount</th>
                                    <th className="py-3 px-2 rounded-r-lg w-10"></th>
                                </tr>
                                </thead>
                                <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                                {generatedBill.items.map((item, i) => (
                                    <tr key={i} className="group hover:bg-slate-50">
                                    <td className="py-4 px-4 font-medium">
                                        {item.name}
                                        {item.type === 'PRODUCT' && <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">PROD</span>}
                                    </td>
                                    <td className="py-4 px-4 text-center">{item.qty}</td>
                                    <td className="py-4 px-4 text-right">₹{item.price}</td>
                                    <td className="py-4 px-4 text-right font-bold">₹{item.price * item.qty}</td>
                                    <td className="py-4 px-2 text-right">
                                        {!bills.some(b => b.id === generatedBill.id) && (
                                            <button 
                                                onClick={() => handleRemoveItem(i)}
                                                className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 no-print"
                                            >
                                                <Trash2 size={16}/>
                                            </button>
                                        )}
                                    </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>

                            {/* Manual Item Entry */}
                            {!bills.some(b => b.id === generatedBill.id) && (
                                <div className="flex gap-2 mb-8 bg-slate-50 p-3 rounded-xl border border-slate-100 no-print shadow-inner items-start">
                                    {/* ... Smart Search ... */}
                                    <div className="flex-1 relative" ref={itemSearchRef}>
                                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200 transition">
                                            <Search size={16} className="text-slate-400"/>
                                            <input 
                                                className="flex-1 text-sm outline-none font-medium placeholder:text-slate-400" 
                                                placeholder="Search Service or Product (Press Enter)"
                                                value={itemSearch}
                                                onChange={e => { setItemSearch(e.target.value); setShowItemSuggestions(true); }}
                                                onFocus={() => setShowItemSuggestions(true)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        if (showItemSuggestions && filteredServices.length + filteredProducts.length > 0) {
                                                            const first = filteredServices[0] || filteredProducts[0];
                                                            handleSelectItem(first, first ? ('category' in first ? 'SERVICE' : 'PRODUCT') : 'SERVICE');
                                                        } else {
                                                            setManualItem({...manualItem, name: itemSearch});
                                                            qtyInputRef.current?.focus();
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                        {/* Suggestions Dropdown */}
                                        {showItemSuggestions && itemSearch && (
                                            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-60 overflow-y-auto">
                                                {filteredServices.length > 0 && (
                                                    <div className="p-2">
                                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1 px-2">Services</div>
                                                        {filteredServices.map(s => (
                                                            <button key={s.id} onClick={() => handleSelectItem(s, 'SERVICE')} className="w-full text-left p-2 hover:bg-purple-50 rounded-lg flex justify-between items-center text-sm font-medium text-slate-700">
                                                                <span>{s.name}</span><span className="text-slate-500 font-bold">₹{s.price}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {filteredProducts.length > 0 && (
                                                    <div className="p-2 border-t border-slate-100">
                                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1 px-2">Products</div>
                                                        {filteredProducts.map(p => (
                                                            <button key={p.id} onClick={() => handleSelectItem(p, 'PRODUCT')} className="w-full text-left p-2 hover:bg-emerald-50 rounded-lg flex justify-between items-center text-sm font-medium text-slate-700">
                                                                <div className="flex flex-col"><span>{p.name}</span><span className="text-[10px] text-slate-400">Stock: {p.stock}</span></div>
                                                                <span className="text-slate-500 font-bold">₹{p.price}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <input className="w-16 p-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200" placeholder="Qty" type="number" ref={qtyInputRef} value={manualItem.qty} onChange={e => setManualItem({...manualItem, qty: Number(e.target.value)})} onKeyDown={(e) => { if(e.key === 'Enter') handleAddManualItem(); }}/>
                                    <input className="w-24 p-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200" placeholder="Price" type="number" value={manualItem.price} onChange={e => setManualItem({...manualItem, price: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter') handleAddManualItem(); }}/>
                                    <button onClick={handleAddManualItem} className="p-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm" title="Add Item"><Plus size={18}/></button>
                                </div>
                            )}

                            {/* Totals & Payments */}
                            <div className="flex justify-end pt-4">
                                <div className="w-2/3 md:w-1/2 space-y-3">
                                    <div className="flex justify-between text-slate-600 text-sm"><span>Subtotal</span><span>₹{generatedBill.subtotal}</span></div>
                                    <div className="flex justify-between text-slate-600 text-sm"><span>GST ({(shopSettings.taxRate || 0)}%)</span><span>₹{generatedBill.tax.toFixed(2)}</span></div>
                                    {(() => {
                                        const { calculatedDiscount } = calculateBillTotals(generatedBill.items, discountValue, discountMode, pointsToRedeem);
                                        return calculatedDiscount > 0 ? (
                                            <div className="flex justify-between text-green-600 text-sm font-medium"><span>Discount {discountMode === 'PERCENT' ? `(${discountValue}%)` : ''}</span><span>- ₹{calculatedDiscount.toFixed(2)}</span></div>
                                        ) : null;
                                    })()}
                                    {pointsToRedeem > 0 && (<div className="flex justify-between text-pink-600 text-sm font-medium"><span>Loyalty Redeemed ({pointsToRedeem} pts)</span><span>- ₹{pointsToRedeem * loyaltyConfig.pointValue}</span></div>)}
                                    <div className="flex justify-between text-2xl font-bold text-slate-900 pt-4 border-t-2 border-slate-100 mt-2"><span>Total</span><span>₹{calculateBillTotals(generatedBill.items, discountValue, discountMode, pointsToRedeem).total.toFixed(2)}</span></div>
                                    <div className="border-t border-slate-100 pt-3 mt-3 space-y-2">
                                        {generatedBill.payments && generatedBill.payments.length > 0 && (<><p className="text-xs font-bold text-slate-400 uppercase">Payment History</p>{generatedBill.payments.map(p => (<div key={p.id} className="flex justify-between text-sm text-slate-600"><span>{p.date} ({p.mode})</span><span className="font-bold">₹{p.amount}</span></div>))}</>)}
                                        <div className="flex justify-between text-sm font-bold text-emerald-700 bg-emerald-50 p-2 rounded"><span>Total Paid</span><span>₹{generatedBill.amountPaid}</span></div>
                                        {generatedBill.dueAmount > 0 && (<div className="flex justify-between text-sm font-bold text-amber-700 bg-amber-50 p-2 rounded"><span>Balance Due</span><span>₹{generatedBill.dueAmount}</span></div>)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Checkout Controls */}
                        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50 h-fit no-print">
                            <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2"><CreditCard size={20} className="text-purple-600"/> Payment Details</h3>
                            {/* ... (Same checkout controls as before) ... */}
                            {generatedBill.status === 'REFUNDED' ? (
                                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center font-bold">This bill has been refunded.</div>
                            ) : (
                                <>
                                    {/* Loyalty, Discount, Payment Mode, Notification, Buttons */}
                                    {loyaltyConfig.enabled && currentCustomer && (
                                        <div className="bg-pink-50/80 p-4 rounded-xl border border-pink-100 mb-6">
                                            <h4 className="font-bold text-pink-800 flex items-center gap-2 mb-2"><Gift size={16}/> Loyalty Program</h4>
                                            <div className="flex justify-between text-sm text-pink-700 mb-3"><span>Available Points:</span><span className="font-bold">{currentCustomer.loyaltyPoints || 0}</span></div>
                                            <div className="flex items-center gap-2">
                                                <input type="number" className="w-full text-sm p-2 border border-pink-200 rounded-lg outline-none focus:border-pink-500" placeholder="Points to redeem" value={pointsToRedeem > 0 ? pointsToRedeem : ''} onChange={(e) => { const val = Number(e.target.value); if (val <= (currentCustomer.loyaltyPoints || 0)) setPointsToRedeem(val); }} disabled={!!generatedBill.id && generatedBill.status !== 'PAID' && bills.some(b => b.id === generatedBill.id)}/>
                                                <span className="text-xs font-bold text-pink-500 whitespace-nowrap">= ₹{pointsToRedeem * loyaltyConfig.pointValue} Off</span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Discount</label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} className="w-full border border-purple-200 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none transition bg-white" placeholder="0" disabled={!!generatedBill.id && generatedBill.status !== 'PAID' && bills.some(b => b.id === generatedBill.id)}/>
                                            </div>
                                            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                                                <button onClick={() => setDiscountMode('AMOUNT')} className={`p-2 rounded-lg text-xs font-bold transition-all ${discountMode === 'AMOUNT' ? 'bg-white shadow-sm text-purple-700' : 'text-slate-500'}`}><DollarSign size={16}/></button>
                                                <button onClick={() => setDiscountMode('PERCENT')} className={`p-2 rounded-lg text-xs font-bold transition-all ${discountMode === 'PERCENT' ? 'bg-white shadow-sm text-purple-700' : 'text-slate-500'}`}><Percent size={16}/></button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="block text-sm font-bold text-slate-700">Payment Mode</label>
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" id="partial" checked={isPartialPayment} onChange={e => setIsPartialPayment(e.target.checked)} className="rounded text-purple-600" disabled={!!generatedBill.id && generatedBill.status !== 'PAID' && bills.some(b => b.id === generatedBill.id)}/>
                                                <label htmlFor="partial" className="text-xs font-bold text-slate-600 select-none cursor-pointer">Advance / Partial Pay</label>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            {['CASH', 'CARD', 'UPI', 'WALLET', 'SPLIT'].map(mode => (<button key={mode} onClick={() => setPaymentMode(mode as any)} className={`text-xs py-3 rounded-xl border font-bold transition-all ${paymentMode === mode ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50'}`} disabled={!!generatedBill.id && generatedBill.status !== 'PAID' && bills.some(b => b.id === generatedBill.id)}>{mode}</button>))}
                                        </div>
                                        {/* Split & Partial inputs... */}
                                        {paymentMode === 'SPLIT' && (<div className="bg-purple-50 p-4 rounded-xl mb-4 border border-purple-100"><p className="text-xs font-bold text-purple-800 mb-2 flex items-center gap-1"><Split size={12}/> Split Amount</p><div className="space-y-2"><div className="flex items-center gap-2"><span className="text-xs w-12 font-bold text-slate-500">Cash</span><input type="number" className="w-full p-2 text-sm border rounded-lg" value={splitPayment.cash} onChange={e => setSplitPayment({...splitPayment, cash: Number(e.target.value)})}/></div><div className="flex items-center gap-2"><span className="text-xs w-12 font-bold text-slate-500">Card</span><input type="number" className="w-full p-2 text-sm border rounded-lg" value={splitPayment.card} onChange={e => setSplitPayment({...splitPayment, card: Number(e.target.value)})}/></div><div className="flex items-center gap-2"><span className="text-xs w-12 font-bold text-slate-500">UPI</span><input type="number" className="w-full p-2 text-sm border rounded-lg" value={splitPayment.upi} onChange={e => setSplitPayment({...splitPayment, upi: Number(e.target.value)})}/></div><div className="flex items-center gap-2"><span className="text-xs w-12 font-bold text-slate-500">Wallet</span><input type="number" className="w-full p-2 text-sm border rounded-lg" value={splitPayment.wallet} onChange={e => setSplitPayment({...splitPayment, wallet: Number(e.target.value)})}/></div></div></div>)}
                                        {isPartialPayment && (<div className="mb-4"><label className="block text-sm font-bold text-amber-700 mb-2">Advance Amount (₹)</label><input type="number" value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value))} className="w-full border border-amber-300 bg-amber-50 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 outline-none transition font-bold text-amber-900"/><div className="mt-2 text-xs text-amber-600 flex justify-between"><span>Remaining Balance:</span><span className="font-bold">₹{calculateBillTotals(generatedBill.items, discountValue, discountMode, pointsToRedeem).total - amountPaid}</span></div></div>)}
                                    </div>

                                    <div className="mb-6 bg-green-50 p-3 rounded-xl border border-green-100 flex items-center gap-3">
                                        <MessageCircle size={20} className="text-green-600"/>
                                        <div className="flex-1"><p className="text-sm font-bold text-slate-800">WhatsApp Invoice</p><p className="text-xs text-slate-500">Send bill to customer after payment</p></div>
                                        <input type="checkbox" checked={sendNotification} onChange={e => setSendNotification(e.target.checked)} className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300"/>
                                    </div>

                                    {bills.some(b => b.id === generatedBill.id) ? (
                                        <button onClick={() => window.print()} className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 shadow-lg transition flex items-center justify-center gap-2"><Printer size={20} /> Print Duplicate</button>
                                    ) : (
                                        <button onClick={finalizeBill} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition flex items-center justify-center gap-2"><Check size={20} /> {isPartialPayment ? 'Record Advance & Print' : 'Confirm & Print'}</button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default Operations;
