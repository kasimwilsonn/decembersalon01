
import React, { useState, useEffect } from 'react';
import { Product, Vendor, PurchaseOrder } from '../types';
import { AlertTriangle, Package, Plus, Search, Filter, Truck, ShoppingCart, Check, X, ClipboardList, ScanLine, Calendar } from 'lucide-react';

interface InventoryProps {
    products: Product[];
    onUpdateProducts: (products: Product[]) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, onUpdateProducts }) => {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'VENDORS' | 'ORDERS'>('STOCK');
  
  // Stock State (Managed by Parent via props)
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState<Partial<Product>>({ name: '', stock: 0, price: 0, costPrice: 0, lowStockThreshold: 5, category: 'General' });
  
  // Vendor State
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showVendorModal, setShowVendorModal] = useState(false);

  // Order State
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    // Load Vendors
    const savedVendors = localStorage.getItem('vendors');
    if (savedVendors) {
        setVendors(JSON.parse(savedVendors));
    } else {
        setVendors([{ id: 'V1', name: 'Beauty Supplies Co', contactPerson: 'John Doe', phone: '9876543210', category: 'General' }]);
    }

    // Load Orders
    const savedOrders = localStorage.getItem('purchaseOrders');
    if (savedOrders) setOrders(JSON.parse(savedOrders));
  }, []);

  const saveVendors = (list: Vendor[]) => {
      setVendors(list);
      localStorage.setItem('vendors', JSON.stringify(list));
  };

  const saveOrders = (list: PurchaseOrder[]) => {
      setOrders(list);
      localStorage.setItem('purchaseOrders', JSON.stringify(list));
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
        ...productForm as Product,
        id: 'P' + Date.now(),
        sku: productForm.sku || `SKU-${Date.now().toString().slice(-4)}`
    };
    onUpdateProducts([...products, newProduct]);
    setShowProductModal(false);
    setProductForm({ name: '', stock: 0, price: 0, costPrice: 0, lowStockThreshold: 5, category: 'General' });
  };

  const addVendor = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const newVendor: Vendor = {
          id: 'V' + Date.now(),
          name: (form.elements.namedItem('vname') as HTMLInputElement).value,
          contactPerson: (form.elements.namedItem('vcontact') as HTMLInputElement).value,
          phone: (form.elements.namedItem('vphone') as HTMLInputElement).value,
          category: (form.elements.namedItem('vcat') as HTMLInputElement).value,
      };
      saveVendors([...vendors, newVendor]);
      setShowVendorModal(false);
  };

  const createOrder = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const vendorId = (form.elements.namedItem('vendor') as HTMLSelectElement).value;
      const vendor = vendors.find(v => v.id === vendorId);
      
      const productName = (form.elements.namedItem('product') as HTMLInputElement).value;
      const qty = Number((form.elements.namedItem('qty') as HTMLInputElement).value);
      const cost = Number((form.elements.namedItem('cost') as HTMLInputElement).value);

      const newOrder: PurchaseOrder = {
          id: 'PO-' + Date.now().toString().slice(-6),
          vendorId,
          vendorName: vendor?.name || 'Unknown',
          date: new Date().toISOString().split('T')[0],
          status: 'PENDING',
          items: [{ productName, qty, cost }],
          totalAmount: qty * cost
      };
      saveOrders([newOrder, ...orders]);
      setShowOrderModal(false);
  };

  const markOrderReceived = (orderId: string) => {
      const updated = orders.map(o => o.id === orderId ? { ...o, status: 'RECEIVED' as const } : o);
      saveOrders(updated);
      alert("Order marked received. Please update stock manually if needed.");
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
           <p className="text-slate-500">Track stock, vendors and purchase orders.</p>
        </div>
        <div className="flex items-center gap-3">
             <div className="flex bg-white/50 p-1 rounded-xl border border-purple-100">
                <button onClick={() => setActiveTab('STOCK')} className={`px-4 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'STOCK' ? 'bg-white shadow-sm text-purple-700' : 'text-slate-500'}`}>Stock</button>
                <button onClick={() => setActiveTab('VENDORS')} className={`px-4 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'VENDORS' ? 'bg-white shadow-sm text-purple-700' : 'text-slate-500'}`}>Vendors</button>
                <button onClick={() => setActiveTab('ORDERS')} className={`px-4 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'ORDERS' ? 'bg-white shadow-sm text-purple-700' : 'text-slate-500'}`}>Orders</button>
            </div>
            {activeTab === 'STOCK' && (
                <button onClick={() => setShowProductModal(true)} className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-200">
                    <Plus size={18} /> Add Product
                </button>
            )}
            {activeTab === 'VENDORS' && (
                <button onClick={() => setShowVendorModal(true)} className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-200">
                    <Plus size={18} /> Add Vendor
                </button>
            )}
            {activeTab === 'ORDERS' && (
                <button onClick={() => setShowOrderModal(true)} className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-200">
                    <Plus size={18} /> Create PO
                </button>
            )}
        </div>
      </div>

      {activeTab === 'STOCK' && (
          <div className="animate-in fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm">
                <p className="text-slate-500 text-sm font-bold mb-1">Total Products</p>
                <h3 className="text-3xl font-bold text-slate-800">{products.length}</h3>
                </div>
                <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm">
                <p className="text-slate-500 text-sm font-bold mb-1">Total Stock Value</p>
                <h3 className="text-3xl font-bold text-slate-800">₹{products.reduce((acc, p) => acc + (p.stock * p.price), 0)}</h3>
                </div>
                <div className="bg-red-50/80 backdrop-blur-md p-6 rounded-2xl border border-red-100 shadow-sm">
                <div className="flex items-center gap-2 text-red-700 mb-1">
                    <AlertTriangle size={18} />
                    <p className="text-sm font-bold">Low Stock Alerts</p>
                </div>
                <h3 className="text-3xl font-bold text-red-800">{products.filter(p => p.stock <= p.lowStockThreshold).length}</h3>
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden">
                <div className="p-4 border-b border-purple-50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                        <input className="w-full pl-10 pr-4 py-2 rounded-xl border border-purple-100 outline-none focus:ring-2 focus:ring-purple-500 bg-white/50" placeholder="Search product..."/>
                    </div>
                    <button className="px-4 py-2 border border-purple-100 rounded-xl bg-white text-slate-600 font-bold flex items-center gap-2"><Filter size={16}/> Filter</button>
                    <button className="px-4 py-2 border border-purple-100 rounded-xl bg-white text-slate-600 font-bold flex items-center gap-2"><ScanLine size={16}/> Scan Barcode</button>
                </div>
                <table className="w-full text-left">
                <thead className="bg-purple-50/50 border-b border-purple-100 text-slate-500 font-bold text-xs uppercase">
                    <tr>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Batch / Expiry</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                    {products.map(p => (
                    <tr key={p.id} className="hover:bg-purple-50/30">
                        <td className="p-4 font-bold text-slate-900">{p.name} <span className="text-xs text-slate-400 block font-normal mt-0.5">{p.sku}</span></td>
                        <td className="p-4 text-slate-600">{p.category}</td>
                        <td className="p-4 font-bold">{p.stock}</td>
                        <td className="p-4 text-sm text-slate-500">
                            {p.batchNumber ? (
                                <div>
                                    <span className="block text-xs font-bold text-slate-600">Batch: {p.batchNumber}</span>
                                    {p.expiryDate && <span className="flex items-center gap-1 text-xs"><Calendar size={10}/> {p.expiryDate}</span>}
                                </div>
                            ) : '-'}
                        </td>
                        <td className="p-4">₹{p.price}</td>
                        <td className="p-4">
                        {p.stock <= p.lowStockThreshold ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                            Low Stock
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                            In Stock
                            </span>
                        )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>
      )}

      {activeTab === 'VENDORS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
              {vendors.map(v => (
                  <div key={v.id} className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm relative group">
                      <div className="flex items-center gap-4 mb-4">
                          <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-700 font-bold"><Truck size={24}/></div>
                          <div>
                              <h3 className="font-bold text-slate-900">{v.name}</h3>
                              <p className="text-xs text-slate-500 uppercase font-bold">{v.category}</p>
                          </div>
                      </div>
                      <div className="space-y-2 text-sm text-slate-600">
                          <div className="flex justify-between"><span>Contact:</span> <span className="font-bold">{v.contactPerson}</span></div>
                          <div className="flex justify-between"><span>Phone:</span> <span className="font-bold">{v.phone}</span></div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                          <button className="flex-1 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100">View History</button>
                      </div>
                  </div>
              ))}
              <button onClick={() => setShowVendorModal(true)} className="border-2 border-dashed border-purple-200 rounded-2xl flex flex-col items-center justify-center p-8 text-purple-300 hover:text-purple-600 hover:bg-purple-50/50 transition h-full min-h-[200px]">
                  <Plus size={32} />
                  <span className="font-bold mt-2">Add New Vendor</span>
              </button>
          </div>
      )}

      {activeTab === 'ORDERS' && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 overflow-hidden animate-in fade-in">
                <table className="w-full text-left">
                <thead className="bg-purple-50/50 border-b border-purple-100 text-slate-500 font-bold text-xs uppercase">
                    <tr>
                    <th className="p-4">PO Number</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Vendor</th>
                    <th className="p-4">Items</th>
                    <th className="p-4 text-right">Total Cost</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                    {orders.map(o => (
                    <tr key={o.id} className="hover:bg-purple-50/30">
                        <td className="p-4 font-mono font-bold text-xs text-slate-600">{o.id}</td>
                        <td className="p-4 text-sm">{o.date}</td>
                        <td className="p-4 font-bold text-slate-800">{o.vendorName}</td>
                        <td className="p-4 text-sm">{o.items[0]?.productName} {o.items.length > 1 && `+${o.items.length - 1} more`}</td>
                        <td className="p-4 text-right font-bold">₹{o.totalAmount}</td>
                        <td className="p-4">
                             <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${o.status === 'RECEIVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                 {o.status}
                             </span>
                        </td>
                        <td className="p-4 text-right">
                             {o.status === 'PENDING' && (
                                 <button onClick={() => markOrderReceived(o.id)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-green-700">Mark Received</button>
                             )}
                        </td>
                    </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-400">No purchase orders found.</td></tr>}
                </tbody>
                </table>
          </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95">
                <h3 className="font-bold text-xl mb-4 text-slate-800">Add New Product</h3>
                <form onSubmit={handleAddProduct} className="space-y-4">
                    <input 
                        placeholder="Product Name" 
                        className="w-full border p-3 rounded-xl"
                        value={productForm.name}
                        onChange={e => setProductForm({...productForm, name: e.target.value})}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                         <input 
                            placeholder="Category" 
                            className="w-full border p-3 rounded-xl"
                            value={productForm.category}
                            onChange={e => setProductForm({...productForm, category: e.target.value})}
                         />
                         <input 
                            placeholder="SKU (Optional)" 
                            className="w-full border p-3 rounded-xl"
                            value={productForm.sku}
                            onChange={e => setProductForm({...productForm, sku: e.target.value})}
                         />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input 
                            type="number" placeholder="Stock Qty" 
                            className="w-full border p-3 rounded-xl"
                            value={productForm.stock}
                            onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})}
                        />
                         <input 
                            type="number" placeholder="Low Stock Limit" 
                            className="w-full border p-3 rounded-xl"
                            value={productForm.lowStockThreshold}
                            onChange={e => setProductForm({...productForm, lowStockThreshold: Number(e.target.value)})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input 
                            type="number" placeholder="Selling Price" 
                            className="w-full border p-3 rounded-xl"
                            value={productForm.price}
                            onChange={e => setProductForm({...productForm, price: Number(e.target.value)})}
                        />
                         <input 
                            type="number" placeholder="Cost Price" 
                            className="w-full border p-3 rounded-xl"
                            value={productForm.costPrice}
                            onChange={e => setProductForm({...productForm, costPrice: Number(e.target.value)})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Batch Number</label>
                            <input 
                                className="w-full border p-2 rounded-lg text-sm"
                                value={productForm.batchNumber}
                                onChange={e => setProductForm({...productForm, batchNumber: e.target.value})}
                            />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Expiry Date</label>
                            <input 
                                type="date"
                                className="w-full border p-2 rounded-lg text-sm"
                                value={productForm.expiryDate}
                                onChange={e => setProductForm({...productForm, expiryDate: e.target.value})}
                            />
                         </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-3 border rounded-xl font-bold">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold">Save Product</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Vendor Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <h3 className="font-bold text-xl mb-4 text-slate-800">Add Supplier</h3>
                <form onSubmit={addVendor} className="space-y-4">
                    <input name="vname" required placeholder="Vendor Name" className="w-full border p-3 rounded-xl"/>
                    <input name="vcontact" required placeholder="Contact Person" className="w-full border p-3 rounded-xl"/>
                    <input name="vphone" required placeholder="Phone Number" className="w-full border p-3 rounded-xl"/>
                    <input name="vcat" required placeholder="Category (e.g. Cosmetics)" className="w-full border p-3 rounded-xl"/>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setShowVendorModal(false)} className="flex-1 py-3 border rounded-xl font-bold">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold">Save</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* PO Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <h3 className="font-bold text-xl mb-4 text-slate-800">Create Purchase Order</h3>
                <form onSubmit={createOrder} className="space-y-4">
                    <select name="vendor" className="w-full border p-3 rounded-xl bg-white" required>
                        <option value="">Select Vendor</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                    <input name="product" required placeholder="Product Name" className="w-full border p-3 rounded-xl"/>
                    <div className="flex gap-4">
                        <input name="qty" type="number" required placeholder="Qty" className="w-full border p-3 rounded-xl"/>
                        <input name="cost" type="number" required placeholder="Cost Per Unit" className="w-full border p-3 rounded-xl"/>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 py-3 border rounded-xl font-bold">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold">Create Order</button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;
