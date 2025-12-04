import React, { useState } from 'react';
import { Search, Plus, User, Phone, Mail, Calendar, Edit, Wallet, History, Gift, CreditCard, X, Package as PackageIcon, ArrowRight, Download, Upload, ChevronDown } from 'lucide-react';
import { Customer, Appointment, Bill, UserPackage, Service, PackageTemplate, GiftCard } from '../types';

interface CRMProps {
    customers: Customer[];
    appointments: Appointment[];
    bills: Bill[];
    onUpdateCustomers: (customers: Customer[]) => void;
    // Optional/Legacy props to ignore
    dbActions?: any;
    packages?: PackageTemplate[];
    services?: Service[];
    giftCards?: GiftCard[];
}

const CRM: React.FC<CRMProps> = ({ customers, appointments, bills, onUpdateCustomers }) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
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

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">CRM</h2>
        <button onClick={() => setShowModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"><Plus size={18}/> Add Customer</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-purple-50">
            <input className="w-full pl-4 pr-4 py-2 border border-purple-100 rounded-xl outline-none" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <table className="w-full text-left">
            <thead><tr className="border-b"><th className="p-4">Name</th><th className="p-4">Phone</th><th className="p-4">Wallet</th><th className="p-4">Action</th></tr></thead>
            <tbody>
                {filtered.map(c => (
                    <tr key={c.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedCustomer(c)}>
                        <td className="p-4">{c.name}</td>
                        <td className="p-4">{c.phone}</td>
                        <td className="p-4">₹{c.walletBalance}</td>
                        <td className="p-4"><button className="text-blue-600">View</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <form onSubmit={handleAddCustomer} className="bg-white p-6 rounded-2xl w-full max-w-md space-y-4">
                <h3 className="font-bold text-xl">New Customer</h3>
                <input name="name" placeholder="Name" className="w-full border p-2 rounded" required />
                <input name="phone" placeholder="Phone" className="w-full border p-2 rounded" required />
                <input name="email" placeholder="Email" className="w-full border p-2 rounded" />
                <input name="dob" type="date" className="w-full border p-2 rounded" />
                <div className="flex gap-2">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 border p-2 rounded">Cancel</button>
                    <button type="submit" className="flex-1 bg-purple-600 text-white p-2 rounded">Save</button>
                </div>
            </form>
        </div>
      )}
    </div>
  );
};

export default CRM;