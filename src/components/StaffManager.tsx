import React, { useState } from 'react';
import { Staff, Role, Appointment, AppointmentStatus } from '../types';
import { Plus, Edit, Trash2, User, Phone, Percent, Briefcase, Save, X } from 'lucide-react';

interface StaffManagerProps {
    staffList: Staff[];
    onUpdateStaff: (staff: Staff[]) => void;
    appointments: Appointment[];
    // Legacy prop
    dbActions?: any;
}

const StaffManager: React.FC<StaffManagerProps> = ({ staffList, onUpdateStaff, appointments }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Staff>>({});

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (formData.id) {
          // Update
          const updated = staffList.map(s => s.id === formData.id ? { ...s, ...formData } as Staff : s);
          onUpdateStaff(updated);
      } else {
          // Add
          const newStaff: Staff = { 
              ...formData as Staff, 
              id: 'S' + Date.now(), 
              isActive: true, 
              attendance: [] 
          };
          onUpdateStaff([...staffList, newStaff]);
      }
      setShowModal(false);
  };

  const handleDelete = (id: string) => {
      if(confirm('Delete staff?')) {
          const updated = staffList.filter(s => s.id !== id);
          onUpdateStaff(updated);
      }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold">Staff</h2>
          <button onClick={() => { setFormData({}); setShowModal(true); }} className="bg-purple-600 text-white px-4 py-2 rounded-xl flex gap-2"><Plus size={18}/> Add Staff</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {staffList.map(s => (
              <div key={s.id} className="bg-white p-6 rounded-2xl border shadow-sm">
                  <h3 className="font-bold text-lg">{s.name}</h3>
                  <p className="text-slate-500">{s.role}</p>
                  <div className="mt-4 flex gap-2">
                      <button onClick={() => { setFormData(s); setShowModal(true); }} className="p-2 border rounded hover:bg-slate-50"><Edit size={16}/></button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 border rounded hover:bg-red-50 text-red-500"><Trash2 size={16}/></button>
                  </div>
              </div>
          ))}
      </div>
      
      {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
              <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl w-full max-w-md space-y-4">
                  <h3 className="font-bold text-xl">{formData.id ? 'Edit' : 'Add'} Staff</h3>
                  <input placeholder="Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded" required />
                  <input placeholder="Phone" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border p-2 rounded" required />
                  <select value={formData.role || Role.SENIOR_STYLIST} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full border p-2 rounded">
                      <option value={Role.SENIOR_STYLIST}>Senior Stylist</option>
                      <option value={Role.JUNIOR_STYLIST}>Junior Stylist</option>
                      <option value={Role.SALON_MANAGER}>Salon Manager</option>
                      <option value={Role.RECEPTIONIST}>Receptionist</option>
                  </select>
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

export default StaffManager;