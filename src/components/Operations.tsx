import React, { useState, useEffect, useRef } from 'react';
import { Plus, Printer, Check, Calendar, Clock, List, FileText, Receipt, ArrowRight as ArrowRightIcon, CreditCard, Wallet, Gift, Split, ChevronLeft, ChevronRight, MessageCircle, RefreshCw, Search, Trash2 } from 'lucide-react';
import type { Appointment, Bill, Customer, Service, Staff, PaymentTransaction, Product } from '../types';
import { AppointmentStatus } from '../types';
import { sendBillNotification } from '../services/notificationService';

interface OperationsProps {
  activeTab: 'APPOINTMENTS' | 'BILLING';
  onNavigate: (tab: 'APPOINTMENTS' | 'BILLING') => void;
  customers: Customer[];
  services: Service[];
  staffList: Staff[];
  appointments: Appointment[];
  products: Product[];
  bills: Bill[];
  shopSettings: any;
  onNewAppointment: (data?: { date?: string; time?: string; stylistId?: string }) => void;
  targetAppointmentId?: string | null;
  onClearTargetAppointment?: () => void;
  setAppointments: (appts: Appointment[]) => void;
  onUpdateBills: (bills: Bill[]) => void;
  // Ignore legacy props if passed
  dbActions?: any;
}

const Operations: React.FC<OperationsProps> = ({ 
  activeTab, onNavigate, customers, services, staffList, appointments, products, bills, shopSettings, onNewAppointment, setAppointments, onUpdateBills
}) => {
  const [view, setView] = useState<'CALENDAR' | 'LIST' | 'JOB_CARD' | 'BILLING'>(activeTab === 'BILLING' ? 'BILLING' : 'CALENDAR');
  const [calendarView, setCalendarView] = useState<'DAY' | 'WEEK' | 'MONTH'>('DAY');
  const [billingView, setBillingView] = useState<'POS' | 'HISTORY'>('POS');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [generatedBill, setGeneratedBill] = useState<Bill | null>(null);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMode, setPaymentMode] = useState<any>('CASH');
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [settlingBill, setSettlingBill] = useState<Bill | null>(null);
  
  useEffect(() => {
    if (activeTab === 'APPOINTMENTS' && view === 'BILLING') setView('CALENDAR');
    else if (activeTab === 'BILLING' && view !== 'BILLING') setView('BILLING');
  }, [activeTab]);

  const handleNoteUpdate = (note: string) => {
    if(!selectedAppointment) return;
    const updatedAppt = { ...selectedAppointment, technicianNotes: note };
    setSelectedAppointment(updatedAppt);
    // Update global state via prop
    const updatedList = appointments.map(a => a.id === selectedAppointment.id ? updatedAppt : a);
    setAppointments(updatedList);
  };

  const finalizeBill = async () => {
    if (!generatedBill) return;
    const finalBill: Bill = { 
        ...generatedBill, 
        amountPaid: isPartialPayment ? amountPaid : generatedBill.total,
        dueAmount: isPartialPayment ? generatedBill.total - amountPaid : 0,
        status: (isPartialPayment && amountPaid < generatedBill.total) ? 'PARTIAL' : 'PAID',
        paymentMode
    };
    
    // Save Bill via prop
    onUpdateBills([...bills, finalBill]);

    // Update Appointment Status
    if(generatedBill.appointmentId) {
        const updatedList = appointments.map(a => a.id === generatedBill.appointmentId ? { ...a, status: AppointmentStatus.COMPLETED } : a);
        setAppointments(updatedList);
    }
    
    alert("Bill Saved!");
    setGeneratedBill(null);
  };

  const handleSettleDue = (bill: Bill) => {
      setSettlingBill(bill);
      setAmountPaid(bill.dueAmount);
  };

  const submitSettlement = async () => {
      if(!settlingBill) return;
      const newPaid = settlingBill.amountPaid + amountPaid;
      const newDue = settlingBill.dueAmount - amountPaid;
      const newStatus: Bill['status'] = newDue <= 0 ? 'PAID' : 'PARTIAL';
      
      const updatedBill: Bill = { ...settlingBill, amountPaid: newPaid, dueAmount: newDue, status: newStatus };
      const updatedBillsList = bills.map(b => b.id === settlingBill.id ? updatedBill : b);
      onUpdateBills(updatedBillsList);
      
      setSettlingBill(null);
  };

  const handleRefund = async (bill: Bill) => {
      if(confirm('Refund this bill?')) {
          const updatedBillsList = bills.map(b => b.id === bill.id ? { ...b, status: 'REFUNDED' as const } : b);
          onUpdateBills(updatedBillsList);
      }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-[1800px] mx-auto overflow-hidden">
      <div className="flex justify-between items-center mb-4 gap-4 no-print bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mx-6 mt-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">{view === 'BILLING' ? 'Billing' : 'Schedule'}</h2>
            <p className="text-slate-500 text-sm">{selectedDate}</p>
        </div>
        <div className="flex gap-2">
            {view !== 'BILLING' && <button onClick={() => onNewAppointment({ date: selectedDate })} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm">New Booking</button>}
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setView('CALENDAR')} className={`px-4 py-2 rounded-lg text-sm font-bold ${view === 'CALENDAR' ? 'bg-white shadow' : ''}`}>Calendar</button>
                <button onClick={() => setView('BILLING')} className={`px-4 py-2 rounded-lg text-sm font-bold ${view === 'BILLING' ? 'bg-white shadow' : ''}`}>Billing</button>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        {view === 'CALENDAR' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 h-full p-4 overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {appointments.filter(a => a.date === selectedDate).map(appt => (
                        <div key={appt.id} onClick={() => { setSelectedAppointment(appt); setView('JOB_CARD'); }} className="p-4 rounded-xl border border-l-4 border-l-purple-500 bg-slate-50 cursor-pointer hover:shadow-md transition">
                            <div className="font-bold text-slate-800">{appt.customerName}</div>
                            <div className="text-sm text-slate-500">{appt.time}</div>
                            <div className="mt-2 text-xs bg-white px-2 py-1 rounded w-fit border">{appt.status}</div>
                        </div>
                    ))}
                    {appointments.filter(a => a.date === selectedDate).length === 0 && <p className="text-slate-400 p-4">No appointments for this date.</p>}
                </div>
            </div>
        )}

        {view === 'JOB_CARD' && selectedAppointment && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold mb-4">Job Card: {selectedAppointment.customerName}</h2>
                <div className="mb-6 space-y-2">
                    <p className="text-slate-600"><strong>Service:</strong> {selectedAppointment.serviceIds.join(', ')}</p>
                    <p className="text-slate-600"><strong>Time:</strong> {selectedAppointment.date} at {selectedAppointment.time}</p>
                    <p className="text-slate-600"><strong>Status:</strong> {selectedAppointment.status}</p>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-bold mb-1">Technician Notes</label>
                    <textarea 
                        className="w-full border rounded p-2"
                        value={selectedAppointment.technicianNotes || ''}
                        onChange={(e) => handleNoteUpdate(e.target.value)}
                    />
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setView('CALENDAR')} className="px-4 py-2 border rounded-xl font-bold">Back</button>
                    <button onClick={() => {
                        const bill: Bill = {
                            id: 'INV-' + Date.now().toString().slice(-6),
                            appointmentId: selectedAppointment.id,
                            customerName: selectedAppointment.customerName,
                            items: [{ name: 'Service', price: 500, qty: 1, type: 'SERVICE' }], // Simplified
                            subtotal: 500, tax: 90, discount: 0, total: 590, date: new Date().toISOString().split('T')[0],
                            paymentMode: 'CASH', status: 'PAID', amountPaid: 590, dueAmount: 0, payments: []
                        };
                        setGeneratedBill(bill);
                        setView('BILLING');
                        setBillingView('POS');
                    }} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold">Create Bill</button>
                </div>
            </div>
        )}

        {view === 'BILLING' && (
            <div className="h-full overflow-auto">
                {!generatedBill && !settlingBill ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                        <div className="flex justify-between mb-4">
                            <h3 className="font-bold text-lg">Billing History</h3>
                            <button onClick={() => {
                                setGeneratedBill({
                                    id: 'INV-' + Date.now().toString().slice(-6),
                                    appointmentId: '', customerName: 'Walk-in',
                                    items: [], subtotal: 0, tax: 0, discount: 0, total: 0, date: new Date().toISOString().split('T')[0],
                                    paymentMode: 'CASH', status: 'PAID', amountPaid: 0, dueAmount: 0, payments: []
                                });
                            }} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold">New Bill</button>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 font-bold text-slate-500">
                                <tr><th className="p-3">ID</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Action</th></tr>
                            </thead>
                            <tbody>
                                {bills.map(b => (
                                    <tr key={b.id} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="p-3 font-mono">{b.id}</td><td className="p-3">{b.customerName}</td><td className="p-3">₹{b.total}</td><td className="p-3">{b.status}</td>
                                        <td className="p-3">
                                            {b.status === 'PARTIAL' && <button onClick={() => handleSettleDue(b)} className="text-blue-600 mr-2">Pay Due</button>}
                                            {b.status !== 'REFUNDED' && <button onClick={() => handleRefund(b)} className="text-red-600">Refund</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold mb-6">{settlingBill ? 'Settle Payment' : 'New Invoice'}</h2>
                        {settlingBill ? (
                            <div className="space-y-4">
                                <p>Total Due: {settlingBill.dueAmount}</p>
                                <input type="number" value={amountPaid} onChange={e => setAmountPaid(Number(e.target.value))} className="border p-2 rounded"/>
                                <button onClick={submitSettlement} className="bg-emerald-600 text-white px-4 py-2 rounded">Submit</button>
                                <button onClick={() => setSettlingBill(null)} className="text-slate-500 ml-2">Cancel</button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                                    <p className="font-bold text-lg">Total: ₹{generatedBill?.total}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setGeneratedBill(null)} className="px-6 py-3 border rounded-xl font-bold">Cancel</button>
                                    <button onClick={finalizeBill} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg">Complete Payment</button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default Operations;