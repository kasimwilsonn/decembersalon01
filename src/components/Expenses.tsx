import React, { useState } from 'react';
import { Expense } from '../types';
import { Plus } from 'lucide-react';

interface ExpensesProps {
    expenses: Expense[];
    onUpdateExpenses: (e: Expense[]) => void;
    // Legacy prop
    dbActions?: any;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, onUpdateExpenses }) => {
    const [showModal, setShowModal] = useState(false);
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({});

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const expense: Expense = { 
            ...newExpense as Expense, 
            id: 'EXP-'+Date.now(), 
            date: new Date().toISOString().split('T')[0] 
        };
        onUpdateExpenses([...expenses, expense]);
        setShowModal(false);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-bold">Expenses</h2>
                <button onClick={() => setShowModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded-xl flex gap-2"><Plus size={18}/> Add Expense</button>
            </div>
            <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-left">
                    <thead><tr className="bg-slate-50"><th className="p-4">Title</th><th className="p-4">Amount</th><th className="p-4">Date</th></tr></thead>
                    <tbody>
                        {expenses.map(e => (
                            <tr key={e.id} className="border-t">
                                <td className="p-4">{e.title}</td>
                                <td className="p-4">₹{e.amount}</td>
                                <td className="p-4">{e.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
                    <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl w-full max-w-md space-y-4">
                        <h3 className="font-bold">Add Expense</h3>
                        <input placeholder="Title" onChange={e => setNewExpense({...newExpense, title: e.target.value})} className="w-full border p-2 rounded" required />
                        <input type="number" placeholder="Amount" onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} className="w-full border p-2 rounded" required />
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

export default Expenses;