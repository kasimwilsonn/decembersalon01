import React, { useState } from 'react';
import { Product, Vendor, PurchaseOrder } from '../types';
import { Plus, Search } from 'lucide-react';

interface InventoryProps {
    products: Product[];
    vendors: Vendor[];
    orders: PurchaseOrder[];
    onUpdateProducts: (p: Product[]) => void;
    onUpdateVendors: (v: Vendor[]) => void;
    onUpdateOrders: (o: PurchaseOrder[]) => void;
    // Legacy prop
    dbActions?: any;
}

const Inventory: React.FC<InventoryProps> = ({ products, vendors, orders, onUpdateProducts, onUpdateVendors, onUpdateOrders }) => {
  const [activeTab, setActiveTab] = useState('STOCK');
  const [showModal, setShowModal] = useState(false);
  const [prodForm, setProdForm] = useState<Partial<Product>>({});
  const [vendorForm, setVendorForm] = useState<Partial<Vendor>>({});

  const handleSaveProduct = (e: React.FormEvent) => {
      e.preventDefault();
      if(prodForm.id) {
          // Update
          const updated = products.map(p => p.id === prodForm.id ? { ...p, ...prodForm } as Product : p);
          onUpdateProducts(updated);
      } else {
          // Add
          const newProduct = { ...prodForm, id: 'P'+Date.now() } as Product;
          onUpdateProducts([...products, newProduct]);
      }
      setShowModal(false);
  };

  const handleSaveVendor = (e: React.FormEvent) => {
      e.preventDefault();
      const newVendor = { ...vendorForm, id: 'V'+Date.now() } as Vendor;
      onUpdateVendors([...vendors, newVendor]);
      setShowModal(false);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold">Inventory</h2>
          <div className="flex gap-2">
              <button onClick={() => setActiveTab('STOCK')} className={`px-4 py-2 rounded ${activeTab==='STOCK' ? 'bg-purple-100 text-purple-700' : ''}`}>Stock</button>
              <button onClick={() => setActiveTab('VENDORS')} className={`px-4 py-2 rounded ${activeTab==='VENDORS' ? 'bg-purple-100 text-purple-700' : ''}`}>Vendors</button>
          </div>
      </div>

      {activeTab === 'STOCK' && (
          <div>
              <button onClick={() => { setProdForm({}); setShowModal(true); }} className="mb-4 bg-purple-600 text-white px-4 py-2 rounded flex gap-2"><Plus size={18}/> Add Product</button>
              <div className="bg-white rounded-2xl border p-4">
                  <table className="w-full text-left">
                      <thead><tr className="border-b"><th className="p-2">Name</th><th className="p-2">Stock</th><th className="p-2">Price</th></tr></thead>
                      <tbody>
                          {products.map(p => (
                              <tr key={p.id} className="border-b">
                                  <td className="p-2">{p.name}</td>
                                  <td className="p-2">{p.stock}</td>
                                  <td className="p-2">{p.price}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {activeTab === 'VENDORS' && (
          <div>
              <button onClick={() => { setVendorForm({}); setShowModal(true); }} className="mb-4 bg-purple-600 text-white px-4 py-2 rounded flex gap-2"><Plus size={18}/> Add Vendor</button>
              <div className="bg-white rounded-2xl border p-4">
                  {vendors.map(v => <div key={v.id} className="p-2 border-b">{v.name}</div>)}
              </div>
          </div>
      )}

      {showModal && activeTab === 'STOCK' && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
              <form onSubmit={handleSaveProduct} className="bg-white p-6 rounded-2xl w-full max-w-md space-y-4">
                  <h3 className="font-bold">Product</h3>
                  <input placeholder="Name" value={prodForm.name||''} onChange={e => setProdForm({...prodForm, name: e.target.value})} className="w-full border p-2 rounded" required/>
                  <input type="number" placeholder="Stock" value={prodForm.stock||''} onChange={e => setProdForm({...prodForm, stock: Number(e.target.value)})} className="w-full border p-2 rounded" required/>
                  <input type="number" placeholder="Price" value={prodForm.price||''} onChange={e => setProdForm({...prodForm, price: Number(e.target.value)})} className="w-full border p-2 rounded" required/>
                  <div className="flex gap-2">
                      <button type="button" onClick={() => setShowModal(false)} className="flex-1 border p-2 rounded">Cancel</button>
                      <button type="submit" className="flex-1 bg-purple-600 text-white p-2 rounded">Save</button>
                  </div>
              </form>
          </div>
      )}

      {showModal && activeTab === 'VENDORS' && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
              <form onSubmit={handleSaveVendor} className="bg-white p-6 rounded-2xl w-full max-w-md space-y-4">
                  <h3 className="font-bold">Vendor</h3>
                  <input placeholder="Name" value={vendorForm.name||''} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} className="w-full border p-2 rounded" required/>
                  <input placeholder="Phone" value={vendorForm.phone||''} onChange={e => setVendorForm({...vendorForm, phone: e.target.value})} className="w-full border p-2 rounded" required/>
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

export default Inventory;