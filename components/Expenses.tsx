
import React, { useState } from 'react';
import { Expense } from '../types';
import { Plus, TrendingDown } from 'lucide-react';

interface ExpensesProps {
    expenses: Expense[];
    onUpdateExpenses: (expenses: Expense[]) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, onUpdateExpenses }) => {
    const [showModal, setShowModal] = useState(false);
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({
        title: '',
        amount: 0,
        category: 'OTHER',
        paidBy: 'Manager',
        paymentMode: 'Cash'
    });

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        const expense: Expense = {
            ...newExpense as Expense,
            id: 'EXP-' + Date.now(),
            date: new Date().toISOString().split('T')[0]
        };
        const updated = [expense, ...expenses];
        onUpdateExpenses(updated);
        setShowModal(false);
        setNewExpense({ title: '', amount: 0, category: 'OTHER', paidBy: 'Manager', paymentMode: 'Cash' });
    };

    const currentMonthExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Expense Management</h2>
                    <p className="text-slate-500">Track daily expenses and payments.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-200"
                >
                    <Plus size={18} /> Add Expense
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-xl"><TrendingDown size={24}/></div>
                    <div>
                        <p className="text-slate-500 text-sm font-bold">Total Expenses</p>
                        <h3 className="text-2xl font-bold text-slate-900">₹{currentMonthExpenses.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-purple-50/50 text-slate-500 font-bold text-xs uppercase border-b border-purple-100">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Expense Title</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Paid By</th>
                            <th className="p-4 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50">
                        {expenses.map(e => (
                            <tr key={e.id} className="hover:bg-purple-50/30">
                                <td className="p-4 font-medium text-slate-600">{e.date}</td>
                                <td className="p-4 font-bold text-slate-800">{e.title}</td>
                                <td className="p-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">{e.category}</span></td>
                                <td className="p-4 text-slate-600">{e.paidBy}</td>
                                <td className="p-4 text-right font-bold text-red-600">- ₹{e.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-xl mb-4 text-slate-800">Add New Expense</h3>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1 text-slate-600">Title</label>
                                <input 
                                    className="w-full border border-purple-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                    value={newExpense.title}
                                    onChange={e => setNewExpense({...newExpense, title: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 text-slate-600">Amount</label>
                                <input 
                                    type="number" 
                                    className="w-full border border-purple-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                    value={newExpense.amount || ''}
                                    onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-bold mb-1 text-slate-600">Category</label>
                                <select 
                                    className="w-full border border-purple-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                    value={newExpense.category}
                                    onChange={e => setNewExpense({...newExpense, category: e.target.value as any})}
                                >
                                    <option>RENT</option>
                                    <option>SALARY</option>
                                    <option>VENDOR</option>
                                    <option>UTILITY</option>
                                    <option>OTHER</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-bold mb-1 text-slate-600">Paid By</label>
                                <input 
                                    className="w-full border border-purple-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500"
                                    value={newExpense.paidBy}
                                    onChange={e => setNewExpense({...newExpense, paidBy: e.target.value})}
                                />
                            </div>
                            <button className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 mt-4 shadow-lg shadow-purple-200">Save Expense</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
