
import React, { useState } from 'react';
import { Staff, Appointment, AppointmentStatus, Role } from '../types';
import { Check, X, Clock, Plus, Edit, Trash2, User, Phone, Percent, Briefcase, Save, MessageCircle, Star, Users, Crown, Sparkles, Scissors } from 'lucide-react';
import { sendStaffDailyReport } from '../services/notificationService';

interface StaffManagerProps {
    staffList: Staff[];
    onUpdateStaff: (staff: Staff[]) => void;
}

// Helper to categorize roles
const isManagementRole = (role: Role) => {
    const managementRoles: Role[] = [Role.OWNER, Role.SALON_MANAGER, Role.STORE_MANAGER, Role.MARKETING_MANAGER, Role.RECEPTIONIST, Role.MANAGER];
    return managementRoles.includes(role);
};

const StaffManager: React.FC<StaffManagerProps> = ({ staffList, onUpdateStaff }) => {
  const [activeCategory, setActiveCategory] = useState<'SERVICE_STAFF' | 'MANAGEMENT'>('SERVICE_STAFF');
  const [viewMode, setViewMode] = useState<'CARDS' | 'ATTENDANCE'>('CARDS');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Staff>>({
      name: '',
      phone: '',
      role: Role.SENIOR_STYLIST,
      commissionRate: 0,
      isActive: true
  });

  const appointments: Appointment[] = JSON.parse(localStorage.getItem('appointments') || '[]');
  const today = new Date().toISOString().split('T')[0];

  const markAttendance = (id: string, status: 'PRESENT' | 'ABSENT' | 'HALF_DAY') => {
      const updatedList = staffList.map(s => {
          if (s.id === id) {
              const prev = s.attendance?.filter(a => a.date !== today) || [];
              return { ...s, attendance: [...prev, { date: today, status }]};
          }
          return s;
      });
      onUpdateStaff(updatedList);
  };

  const handleOpenAdd = (category: 'SERVICE_STAFF' | 'MANAGEMENT') => {
      setIsEditing(false);
      // Set default based on active tab
      const defaultRole = category === 'SERVICE_STAFF' ? Role.SENIOR_STYLIST : Role.SALON_MANAGER;
      const defaultComm = category === 'SERVICE_STAFF' ? 10 : 0;
      
      setFormData({ name: '', phone: '', role: defaultRole, commissionRate: defaultComm, isActive: true });
      setShowModal(true);
  };

  const handleOpenEdit = (staff: Staff) => {
      setIsEditing(true);
      setFormData(staff);
      setShowModal(true);
  };

  const handleDelete = (id: string) => {
      if (confirm('Are you sure you want to remove this team member?')) {
          const updated = staffList.filter(s => s.id !== id);
          onUpdateStaff(updated);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (isEditing && formData.id) {
          // Update
          const updated = staffList.map(s => s.id === formData.id ? { ...s, ...formData } as Staff : s);
          onUpdateStaff(updated);
      } else {
          // Create
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

  // Filter lists
  const managementTeam = staffList.filter(s => isManagementRole(s.role));
  const serviceStaff = staffList.filter(s => !isManagementRole(s.role));

  const displayList = activeCategory === 'MANAGEMENT' ? managementTeam : serviceStaff;

  // Calculate Performance Metrics
  const getStaffMetrics = (staff: Staff) => {
    const completedToday = appointments.filter(a => a.stylistId === staff.id && a.status === AppointmentStatus.COMPLETED && a.date === today);
    const serviceCount = completedToday.length;
    
    const allCompleted = appointments.filter(a => a.stylistId === staff.id && a.status === AppointmentStatus.COMPLETED);
    const totalRevenue = allCompleted.length * 800; // Estimated avg ticket for demo
    const commission = (totalRevenue * staff.commissionRate) / 100;
    const todayRevenue = serviceCount * 800;

    return { serviceCount, totalRevenue, commission, todayRevenue };
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Team & Staff</h2>
            <p className="text-slate-500 font-medium">Manage your salon's workforce and performance.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <button 
                    onClick={() => setViewMode('CARDS')} 
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${viewMode === 'CARDS' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Users size={16}/> Profiles
                </button>
                <button 
                    onClick={() => setViewMode('ATTENDANCE')} 
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${viewMode === 'ATTENDANCE' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Clock size={16}/> Attendance
                </button>
            </div>
            
            <button 
                onClick={() => handleOpenAdd(activeCategory)}
                className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-200 transition"
            >
                <Plus size={18} /> Add {activeCategory === 'MANAGEMENT' ? 'Member' : 'Stylist'}
            </button>
          </div>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-slate-200 mb-8 gap-8">
          <button 
            onClick={() => setActiveCategory('SERVICE_STAFF')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${activeCategory === 'SERVICE_STAFF' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
              <Scissors size={18} /> Service Staff
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{serviceStaff.length}</span>
          </button>
          <button 
            onClick={() => setActiveCategory('MANAGEMENT')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${activeCategory === 'MANAGEMENT' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
              <Briefcase size={18} /> Management Team
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{managementTeam.length}</span>
          </button>
      </div>
      
      {/* --- CARDS VIEW --- */}
      {viewMode === 'CARDS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4">
            {displayList.map(staff => {
              const metrics = getStaffMetrics(staff);
              
              // Role Badge Logic
              const isSenior = staff.role.includes('SENIOR') || staff.role.includes('MANAGER');
              const badgeColor = isSenior ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-purple-50 text-purple-700 border-purple-100';
              const Icon = isManagementRole(staff.role) ? Crown : Sparkles;

              return (
                <div key={staff.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden relative">
                   {/* Header Background */}
                   <div className="h-20 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-100"></div>
                   
                   {/* Avatar & Actions */}
                   <div className="px-6 relative -mt-10 flex justify-between items-end">
                        <div className="h-20 w-20 bg-white rounded-2xl p-1 shadow-sm">
                            <div className="h-full w-full bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center text-purple-700 font-bold text-2xl">
                                {staff.name.charAt(0)}
                            </div>
                        </div>
                        <div className="flex gap-2 mb-1">
                             <button onClick={() => handleOpenEdit(staff)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit size={16}/></button>
                             <button onClick={() => handleDelete(staff.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={16}/></button>
                        </div>
                   </div>

                   <div className="p-6 pt-4">
                        <div className="mb-4">
                            <h3 className="font-bold text-lg text-slate-900 leading-tight flex items-center gap-2">
                                {staff.name} 
                                {isSenior && <Icon size={14} className="text-amber-500 fill-amber-500"/>}
                            </h3>
                            <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg text-xs font-bold border uppercase tracking-wide ${badgeColor}`}>
                                {staff.role.replace('_', ' ')}
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                <Phone size={14}/> {staff.phone}
                            </div>
                            {!isManagementRole(staff.role) && (
                                <div className="flex items-center gap-3 text-sm text-slate-500">
                                    <Percent size={14}/> {staff.commissionRate}% Commission
                                </div>
                            )}
                        </div>

                        {/* Metrics Section - Only for Service Staff */}
                        {!isManagementRole(staff.role) ? (
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Today's Rev</span>
                                    <span className="text-sm font-bold text-slate-800">₹{metrics.todayRevenue.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Comm. Earned</span>
                                    <span className="text-sm font-bold text-purple-600">₹{metrics.commission.toLocaleString()}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                                    <div className="h-full bg-purple-500 w-3/4 rounded-full"></div>
                                </div>
                                
                                <button 
                                    onClick={() => sendStaffDailyReport(staff, metrics.todayRevenue, metrics.serviceCount)}
                                    className="w-full mt-2 bg-white text-purple-700 py-2 rounded-lg font-bold text-xs border border-purple-100 hover:border-purple-300 hover:shadow-sm flex items-center justify-center gap-2 transition"
                                >
                                    <MessageCircle size={14}/> Daily Report
                                </button>
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Status</p>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active
                                </span>
                            </div>
                        )}
                   </div>
                </div>
              );
            })}
            
            {/* Add New Card */}
            <button 
                onClick={() => handleOpenAdd(activeCategory)}
                className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-slate-400 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50/50 transition duration-300 min-h-[350px] group"
            >
                <div className="bg-slate-50 p-4 rounded-full mb-4 shadow-sm group-hover:scale-110 transition-transform"><Plus size={24}/></div>
                <span className="font-bold">Add to {activeCategory === 'MANAGEMENT' ? 'Team' : 'Staff'}</span>
            </button>
          </div>
      )}

      {/* --- ATTENDANCE VIEW --- */}
      {viewMode === 'ATTENDANCE' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in fade-in">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Clock size={20} className="text-purple-600"/> Attendance for {today}</h3>
                  <div className="text-sm font-medium text-slate-500">
                      Showing: <span className="text-slate-900 font-bold">{activeCategory === 'MANAGEMENT' ? 'Management Team' : 'Service Staff'}</span>
                  </div>
              </div>
              <div className="space-y-3">
                  {displayList.map(staff => {
                      const status = staff.attendance?.find(a => a.date === today)?.status;
                      return (
                          <div key={staff.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 gap-4 hover:border-purple-200 transition">
                              <div className="flex items-center gap-4 w-full sm:w-auto">
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${isManagementRole(staff.role) ? 'bg-slate-200 text-slate-600' : 'bg-purple-100 text-purple-700'}`}>
                                      {staff.name[0]}
                                  </div>
                                  <div>
                                      <p className="font-bold text-slate-800">{staff.name}</p>
                                      <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">{staff.role.replace('_', ' ')}</p>
                                  </div>
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto">
                                  <button onClick={() => markAttendance(staff.id, 'PRESENT')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition ${status === 'PRESENT' ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-green-300 hover:text-green-600'}`}>
                                      <Check size={14}/> Present
                                  </button>
                                  <button onClick={() => markAttendance(staff.id, 'HALF_DAY')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition ${status === 'HALF_DAY' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-600'}`}>
                                      <Clock size={14}/> Half Day
                                  </button>
                                  <button onClick={() => markAttendance(staff.id, 'ABSENT')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition ${status === 'ABSENT' ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-red-300 hover:text-red-600'}`}>
                                      <X size={14}/> Absent
                                  </button>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* Add/Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-slate-800">{isEditing ? 'Edit Profile' : `Add ${activeCategory === 'MANAGEMENT' ? 'Team Member' : 'Service Staff'}`}</h3>
                <button onClick={() => setShowModal(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition"><X size={20} className="text-slate-500"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                        <input 
                            required
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white transition font-medium"
                            placeholder="e.g. Rahul Verma"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Phone Number</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                        <input 
                            required
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white transition font-medium"
                            placeholder="e.g. 9876543210"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Designation</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                            <select 
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value as Role})}
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white transition appearance-none font-medium text-sm"
                            >
                                <optgroup label="Management Team">
                                    <option value={Role.OWNER}>Owner</option>
                                    <option value={Role.SALON_MANAGER}>Salon Manager</option>
                                    <option value={Role.STORE_MANAGER}>Store Manager</option>
                                    <option value={Role.MARKETING_MANAGER}>Marketing Manager</option>
                                    <option value={Role.RECEPTIONIST}>Receptionist</option>
                                </optgroup>
                                <optgroup label="Service Staff">
                                    <option value={Role.SENIOR_STYLIST}>Senior Stylist</option>
                                    <option value={Role.JUNIOR_STYLIST}>Junior Stylist</option>
                                    <option value={Role.HAIRDRESSER}>Hairdresser</option>
                                    <option value={Role.MAKEUP_ARTIST}>Makeup Artist</option>
                                    <option value={Role.BEAUTICIAN}>Beautician</option>
                                    <option value={Role.NAIL_TECHNICIAN}>Nail Technician</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Commission %</label>
                        <div className="relative">
                            <Percent className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                            <input 
                                type="number"
                                required
                                min="0"
                                max="100"
                                value={formData.commissionRate}
                                onChange={e => setFormData({...formData, commissionRate: Number(e.target.value)})}
                                disabled={isManagementRole(formData.role!)}
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

                <button type="submit" className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-black shadow-lg shadow-slate-900/20 mt-4 flex items-center justify-center gap-2 transition-transform active:scale-95">
                    <Save size={20} /> {isEditing ? 'Update Profile' : 'Save Member'}
                </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManager;
