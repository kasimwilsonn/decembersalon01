
import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, ArrowUpRight, FileSpreadsheet, Users, Scissors, ChevronDown, PieChart, Package } from 'lucide-react';
import { Appointment, Service, Staff, AppointmentStatus, Bill } from '../types';

interface ReportsProps {
    appointments: Appointment[];
    bills: Bill[];
    staffList: Staff[];
    servicesList: Service[];
}

type ReportType = 'OVERVIEW' | 'COMMISSION' | 'SALES' | 'PACKAGES' | 'SERVICE_ANALYSIS';
type DateRangeOption = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'LAST_6_MONTHS' | 'THIS_YEAR' | 'CUSTOM';

const Reports: React.FC<ReportsProps> = ({ appointments, bills, staffList, servicesList }) => {
  const [activeReport, setActiveReport] = useState<ReportType>('OVERVIEW');
  
  // Date Range State
  const [dateRangeType, setDateRangeType] = useState<DateRangeOption>('THIS_MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Report Data States
  const [reportData, setReportData] = useState<{
    staffName: string;
    role: string;
    servicesCount: number;
    totalRevenue: number;
    commissionRate: number;
    commissionEarned: number;
  }[]>([]);

  const [totalStats, setTotalStats] = useState({
    revenue: 0,
    services: 0,
    avgTicket: 0
  });

  const [salesData, setSalesData] = useState<{date: string, amount: number, count: number}[]>([]);
  
  // New State for Service Analysis
  const [serviceStats, setServiceStats] = useState<{
      byCategory: { category: string, count: number, revenue: number }[],
      byService: { id: string, name: string, category: string, count: number, revenue: number }[]
  }>({ byCategory: [], byService: [] });

  // Initialize Date Logic
  useEffect(() => {
      handleDateRangeChange('THIS_MONTH');
  }, []);

  // Handle Date Preset Changes
  const handleDateRangeChange = (type: DateRangeOption) => {
      setDateRangeType(type);
      const today = new Date();
      let start = new Date();
      let end = new Date();

      switch (type) {
          case 'TODAY':
              // Start and End are today
              break;
          case 'YESTERDAY':
              start.setDate(today.getDate() - 1);
              end.setDate(today.getDate() - 1);
              break;
          case 'THIS_WEEK':
              const day = today.getDay();
              const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
              start.setDate(diff);
              break;
          case 'THIS_MONTH':
              start.setDate(1);
              break;
          case 'LAST_MONTH':
              start.setMonth(today.getMonth() - 1);
              start.setDate(1);
              end.setDate(0); // Last day of prev month
              break;
          case 'THIS_QUARTER':
              const currQuarter = Math.floor(today.getMonth() / 3);
              start.setMonth(currQuarter * 3);
              start.setDate(1);
              break;
          case 'LAST_6_MONTHS':
              start.setMonth(today.getMonth() - 6);
              start.setDate(1);
              break;
          case 'THIS_YEAR':
              start.setMonth(0);
              start.setDate(1);
              break;
          case 'CUSTOM':
              // Do not update dates, let user pick
              return;
      }

      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
  };

  // Main Data Processing Effect
  useEffect(() => {
    if (!startDate || !endDate) return;

    // 1. Filter Completed & Date Range
    const completedAppts = appointments.filter(a => {
        const isCompleted = a.status === AppointmentStatus.COMPLETED;
        const inDateRange = a.date >= startDate && a.date <= endDate;
        return isCompleted && inDateRange;
    });

    // Helper to get service details
    const getService = (id: string) => servicesList.find(s => s.id === id);

    // 3. Calculate Overall & Staff Stats
    let grandTotalRevenue = 0;
    
    // Staff Stats Calculation
    const staffStats = staffList.map(staff => {
      const staffAppts = completedAppts.filter(a => a.stylistId === staff.id);
      
      let staffRevenue = 0;
      staffAppts.forEach(appt => {
        const apptRevenue = appt.serviceIds.reduce((sum, sid) => sum + (getService(sid)?.price || 0), 0);
        staffRevenue += apptRevenue;
      });

      grandTotalRevenue += staffRevenue;

      return {
        staffName: staff.name,
        role: staff.role,
        servicesCount: staffAppts.length,
        totalRevenue: staffRevenue,
        commissionRate: staff.commissionRate,
        commissionEarned: (staffRevenue * staff.commissionRate) / 100
      };
    });

    setReportData(staffStats);
    setTotalStats({
      revenue: grandTotalRevenue,
      services: completedAppts.length,
      avgTicket: completedAppts.length ? Math.round(grandTotalRevenue / completedAppts.length) : 0
    });

    // 4. Generate Sales Timeline Data
    const salesMap = new Map<string, {amount: number, count: number}>();
    
    // Fill gaps if range is small enough, otherwise just show dates with data
    completedAppts.forEach(appt => {
        const dateKey = appt.date;
        const apptRevenue = appt.serviceIds.reduce((sum, sid) => sum + (getService(sid)?.price || 0), 0);
        
        if (salesMap.has(dateKey)) {
            const current = salesMap.get(dateKey)!;
            salesMap.set(dateKey, { amount: current.amount + apptRevenue, count: current.count + 1 });
        } else {
            salesMap.set(dateKey, { amount: apptRevenue, count: 1 });
        }
    });

    const timelineData = Array.from(salesMap.entries())
        .map(([date, data]) => ({ date, amount: data.amount, count: data.count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    setSalesData(timelineData);

    // 5. Generate Service Analysis Data
    const categoryMap = new Map<string, {count: number, revenue: number}>();
    const serviceMap = new Map<string, {name: string, category: string, count: number, revenue: number}>();

    completedAppts.forEach(appt => {
        appt.serviceIds.forEach(sid => {
            const srv = getService(sid);
            if (srv) {
                // By Category
                const catStats = categoryMap.get(srv.category) || { count: 0, revenue: 0 };
                categoryMap.set(srv.category, { 
                    count: catStats.count + 1, 
                    revenue: catStats.revenue + srv.price 
                });

                // By Specific Service
                const srvStats = serviceMap.get(srv.id) || { name: srv.name, category: srv.category, count: 0, revenue: 0 };
                serviceMap.set(srv.id, {
                    ...srvStats,
                    count: srvStats.count + 1,
                    revenue: srvStats.revenue + srv.price
                });
            }
        });
    });

    const byCategory = Array.from(categoryMap.entries())
        .map(([category, stats]) => ({ category, ...stats }))
        .sort((a, b) => b.revenue - a.revenue);

    const byService = Array.from(serviceMap.entries())
        .map(([id, stats]) => ({ id, ...stats }))
        .sort((a, b) => b.count - a.count); // Sort by popularity

    setServiceStats({ byCategory, byService });

  }, [startDate, endDate, servicesList, staffList, appointments, bills]);

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
        alert("No data to export");
        return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SidebarItem = ({ id, icon: Icon, label }: { id: ReportType, icon: any, label: string }) => (
      <button 
        onClick={() => setActiveReport(id)}
        className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-bold transition-all ${activeReport === id ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'text-slate-500 hover:bg-purple-50 hover:text-purple-600'}`}
      >
          <Icon size={18} /> {label}
      </button>
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] overflow-hidden">
        
        {/* Reports Navigation Sidebar */}
        <div className="w-full md:w-64 bg-white/70 backdrop-blur-md border-r border-white/50 p-4 space-y-2 h-full overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-4 mt-2">Report Menu</h3>
            <SidebarItem id="OVERVIEW" icon={PieChart} label="Overview" />
            <SidebarItem id="SERVICE_ANALYSIS" icon={Scissors} label="Service Analysis" />
            <SidebarItem id="COMMISSION" icon={Users} label="Staff Commission" />
            <SidebarItem id="SALES" icon={TrendingUp} label="Sales Reports" />
            <SidebarItem id="PACKAGES" icon={Package} label="Package Sales" />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 md:p-8 animate-in fade-in duration-300">
            
            {/* Header & Date Filters */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-4 border-b border-purple-100 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {activeReport === 'OVERVIEW' && 'Business Overview'}
                        {activeReport === 'SERVICE_ANALYSIS' && 'Service & Category Analysis'}
                        {activeReport === 'COMMISSION' && 'Staff Commission Report'}
                        {activeReport === 'SALES' && 'Sales & Revenue Report'}
                        {activeReport === 'PACKAGES' && 'Package Sales Report'}
                    </h2>
                    <p className="text-slate-500 mt-1">Real-time data for your business analysis.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {/* Date Presets Dropdown */}
                    <div className="relative">
                        <select 
                            value={dateRangeType} 
                            onChange={(e) => handleDateRangeChange(e.target.value as DateRangeOption)}
                            className="appearance-none bg-white border border-purple-200 text-purple-700 text-sm font-bold rounded-xl pl-4 pr-10 py-2.5 outline-none focus:border-purple-500 hover:bg-purple-50 transition cursor-pointer shadow-sm"
                        >
                            <option value="TODAY">Today</option>
                            <option value="YESTERDAY">Yesterday</option>
                            <option value="THIS_WEEK">This Week</option>
                            <option value="THIS_MONTH">This Month</option>
                            <option value="LAST_MONTH">Last Month</option>
                            <option value="THIS_QUARTER">This Quarter</option>
                            <option value="LAST_6_MONTHS">Last 6 Months</option>
                            <option value="THIS_YEAR">This Year</option>
                            <option value="CUSTOM">Custom Range</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none"/>
                    </div>

                    {/* Custom Date Inputs (Show if custom, or just visual feedback for other ranges) */}
                    <div className="flex items-center gap-2 bg-white/70 p-1.5 rounded-xl border border-white shadow-sm">
                        <div className="flex items-center gap-2 px-2">
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => { setDateRangeType('CUSTOM'); setStartDate(e.target.value); }}
                                className="bg-transparent text-sm font-bold text-slate-700 outline-none border-b border-transparent focus:border-purple-500 transition-colors w-28"
                            />
                        </div>
                        <span className="text-slate-400">-</span>
                        <div className="flex items-center gap-2 px-2">
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => { setDateRangeType('CUSTOM'); setEndDate(e.target.value); }}
                                className="bg-transparent text-sm font-bold text-slate-700 outline-none border-b border-transparent focus:border-purple-500 transition-colors w-28"
                            />
                        </div>
                    </div>

                    {activeReport !== 'OVERVIEW' && (
                        <button 
                            onClick={() => {
                                if(activeReport === 'COMMISSION') downloadCSV(reportData, 'commission_report');
                                if(activeReport === 'SALES') downloadCSV(salesData, 'sales_report');
                                if(activeReport === 'SERVICE_ANALYSIS') downloadCSV(serviceStats.byService, 'service_report');
                                if(activeReport === 'PACKAGES') alert("Mock data export"); 
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 font-bold transition ml-2"
                        >
                            <FileSpreadsheet size={18} /> Export
                        </button>
                    )}
                </div>
            </div>

            {/* OVERVIEW */}
            {activeReport === 'OVERVIEW' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                     {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm flex items-center gap-5">
                            <div className="p-4 bg-emerald-100 rounded-xl text-emerald-600"><DollarSign size={28}/></div>
                            <div>
                                <p className="text-slate-500 text-sm font-medium mb-1">Total Revenue</p>
                                <h3 className="text-3xl font-bold text-slate-900">₹{totalStats.revenue.toLocaleString()}</h3>
                                <p className="text-xs text-slate-400 mt-1">For selected period</p>
                            </div>
                        </div>
                        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm flex items-center gap-5">
                            <div className="p-4 bg-blue-100 rounded-xl text-blue-600"><TrendingUp size={28}/></div>
                            <div>
                                <p className="text-slate-500 text-sm font-medium mb-1">Services Done</p>
                                <h3 className="text-3xl font-bold text-slate-900">{totalStats.services}</h3>
                                <p className="text-xs text-slate-400 mt-1">Completed Appointments</p>
                            </div>
                        </div>
                        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm flex items-center gap-5">
                            <div className="p-4 bg-violet-100 rounded-xl text-violet-600"><BarChart3 size={28}/></div>
                            <div>
                                <p className="text-slate-500 text-sm font-medium mb-1">Avg Ticket Size</p>
                                <h3 className="text-3xl font-bold text-slate-900">₹{totalStats.avgTicket.toLocaleString()}</h3>
                                <p className="text-xs text-slate-400 mt-1">Revenue / Services</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white/70 backdrop-blur-md p-8 rounded-2xl border border-white/50 shadow-sm">
                            <h3 className="font-bold text-lg text-slate-800 mb-6">Top Categories by Revenue</h3>
                            <div className="space-y-6">
                                {serviceStats.byCategory.slice(0, 5).map(cat => (
                                    <div key={cat.category}>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-bold text-slate-700">{cat.category}</span>
                                            <span className="text-slate-500 font-medium">₹{cat.revenue.toLocaleString()}</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-purple-500 rounded-full" 
                                                style={{ width: `${totalStats.revenue > 0 ? (cat.revenue / totalStats.revenue) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                                {serviceStats.byCategory.length === 0 && <p className="text-slate-400 text-sm text-center">No category data available.</p>}
                            </div>
                        </div>
                         <div className="bg-white/70 backdrop-blur-md p-8 rounded-2xl border border-white/50 shadow-sm">
                            <h3 className="font-bold text-lg text-slate-800 mb-6">Recent Sales Trend</h3>
                             <div className="h-64 flex items-end justify-between gap-3 px-2 border-b border-slate-100 pb-2">
                                {salesData.slice(-10).map((d, i) => {
                                    const heightPercent = salesData.length > 0 
                                        ? (d.amount / Math.max(...salesData.map(s => s.amount), 1)) * 100 
                                        : 0;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                            <div className="relative w-full flex justify-center items-end h-full">
                                                <div 
                                                    className="w-full bg-indigo-500 rounded-t-lg opacity-80 group-hover:opacity-100 transition-all min-h-[4px]"
                                                    style={{ height: `${heightPercent}%` }}
                                                ></div>
                                                <div className="absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                    ₹{d.amount}
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 rotate-0 md:-rotate-45 truncate w-full text-center mt-2">{d.date.slice(5)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SERVICE ANALYSIS REPORT */}
            {activeReport === 'SERVICE_ANALYSIS' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         {/* Category Breakdown */}
                         <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden">
                            <div className="p-4 border-b border-purple-50 bg-purple-50/20">
                                <h3 className="font-bold text-slate-700">Category Performance</h3>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-purple-50/50 text-slate-500 font-bold text-xs uppercase">
                                    <tr>
                                        <th className="p-4">Category</th>
                                        <th className="p-4 text-center">Volume</th>
                                        <th className="p-4 text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-50 text-sm">
                                    {serviceStats.byCategory.map((cat, i) => (
                                        <tr key={i} className="hover:bg-purple-50/30">
                                            <td className="p-4 font-bold text-slate-700">{cat.category}</td>
                                            <td className="p-4 text-center">{cat.count}</td>
                                            <td className="p-4 text-right font-bold">₹{cat.revenue.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>

                         {/* Detailed Service List */}
                         <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden">
                            <div className="p-4 border-b border-purple-50 bg-purple-50/20">
                                <h3 className="font-bold text-slate-700">Top Services</h3>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-purple-50/50 text-slate-500 font-bold text-xs uppercase sticky top-0 bg-white">
                                        <tr>
                                            <th className="p-4">Service Name</th>
                                            <th className="p-4 text-center">Qty</th>
                                            <th className="p-4 text-right">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-purple-50 text-sm">
                                        {serviceStats.byService.map((srv, i) => (
                                            <tr key={i} className="hover:bg-purple-50/30">
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-700">{srv.name}</div>
                                                    <div className="text-xs text-slate-400">{srv.category}</div>
                                                </td>
                                                <td className="p-4 text-center font-bold text-purple-600">{srv.count}</td>
                                                <td className="p-4 text-right font-bold">₹{srv.revenue.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                         </div>
                     </div>
                </div>
            )}

            {/* STAFF COMMISSION */}
            {activeReport === 'COMMISSION' && (
                <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden animate-in slide-in-from-bottom-4">
                    <div className="p-6 border-b border-purple-50 flex justify-between items-center bg-purple-50/30">
                        <div className="flex items-center gap-2">
                             <span className="text-slate-500 font-bold text-sm">Payout Period:</span>
                             <span className="text-slate-800 font-bold text-sm">{startDate} to {endDate}</span>
                        </div>
                        <div className="bg-white px-4 py-2 rounded-xl text-purple-700 font-bold text-sm border border-purple-100 shadow-sm">
                            Total Commission: ₹{reportData.reduce((acc, curr) => acc + curr.commissionEarned, 0).toLocaleString()}
                        </div>
                    </div>
                    {reportData.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="bg-purple-50/50 text-slate-500 font-bold text-xs uppercase">
                                <tr>
                                    <th className="p-4">Staff Name</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4 text-center">Services</th>
                                    <th className="p-4 text-right">Revenue</th>
                                    <th className="p-4 text-center">Rate</th>
                                    <th className="p-4 text-right text-emerald-700">Commission</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-50 text-sm">
                                {reportData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-purple-50/30 transition">
                                        <td className="p-4 font-bold text-slate-800">{row.staffName}</td>
                                        <td className="p-4 text-slate-500">{row.role}</td>
                                        <td className="p-4 text-center font-medium">{row.servicesCount}</td>
                                        <td className="p-4 text-right font-medium">₹{row.totalRevenue.toLocaleString()}</td>
                                        <td className="p-4 text-center"><span className="bg-slate-100 px-2 py-1 rounded">{row.commissionRate}%</span></td>
                                        <td className="p-4 text-right font-bold text-emerald-600">₹{row.commissionEarned.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-slate-500 font-medium">
                            No commission data found for this period.
                        </div>
                    )}
                </div>
            )}

            {/* SALES REPORT */}
            {activeReport === 'SALES' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                    <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden">
                         <div className="p-4 border-b border-purple-50 flex justify-between items-center bg-purple-50/30">
                            <h3 className="font-bold text-slate-700">Sales Timeline</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-bold text-sm">Total:</span>
                                <span className="text-slate-900 font-bold text-lg">₹{salesData.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</span>
                            </div>
                         </div>
                         <div className="max-h-[500px] overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-purple-50/50 text-slate-500 font-bold text-xs uppercase sticky top-0 bg-white">
                                    <tr>
                                        <th className="p-4">Date</th>
                                        <th className="p-4 text-center">Bills Generated</th>
                                        <th className="p-4 text-right">Total Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-50 text-sm">
                                    {salesData.map((row, i) => (
                                        <tr key={i} className="hover:bg-purple-50/30">
                                            <td className="p-4 font-medium">{row.date}</td>
                                            <td className="p-4 text-center">{row.count}</td>
                                            <td className="p-4 text-right font-bold text-slate-800">₹{row.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {salesData.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-slate-500">No sales found for the selected range.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                         </div>
                    </div>
                </div>
            )}

            {/* PACKAGES REPORT */}
            {activeReport === 'PACKAGES' && (
                 <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden animate-in slide-in-from-bottom-4">
                    <div className="p-4 border-b border-purple-50">
                         <h3 className="font-bold text-slate-700">Package Sales Performance</h3>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-purple-50/50 text-slate-500 font-bold text-xs uppercase">
                            <tr>
                                <th className="p-4">Package Name</th>
                                <th className="p-4 text-right">Price</th>
                                <th className="p-4 text-center">Units Sold</th>
                                <th className="p-4 text-right">Total Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-50 text-sm">
                            {[
                                { name: 'Bridal Gold Package', price: 15000, sold: 4 },
                                { name: 'Men Grooming Kit', price: 2500, sold: 12 },
                                { name: 'Anti-Aging Facial Series', price: 8000, sold: 3 }
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-purple-50/30">
                                    <td className="p-4 font-bold text-slate-800">{row.name}</td>
                                    <td className="p-4 text-right">₹{row.price.toLocaleString()}</td>
                                    <td className="p-4 text-center font-bold text-purple-700">{row.sold}</td>
                                    <td className="p-4 text-right font-bold text-slate-800">₹{(row.price * row.sold).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
  );
};

export default Reports;
