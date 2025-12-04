import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Role, Service, PackageTemplate } from '../types';

interface SettingsProps {
    permissions?: Record<string, Role[]>;
    shopSettings: any;
    onUpdateShopSettings: (settings: any) => void;
    // Legacy props
    dbActions?: any;
    services?: Service[];
    packages?: PackageTemplate[];
}

const Settings: React.FC<SettingsProps> = ({ permissions, shopSettings, onUpdateShopSettings }) => {
    const [settings, setSettings] = useState(shopSettings);

    const handleSave = () => {
        onUpdateShopSettings(settings);
        alert("Settings Saved");
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            <div className="bg-white p-6 rounded-2xl border space-y-4">
                <h3 className="font-bold text-lg">Salon Profile</h3>
                <div>
                    <label className="block text-sm font-bold mb-1">Salon Name</label>
                    <input value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1">Address</label>
                    <input value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1">Phone</label>
                    <input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <button onClick={handleSave} className="bg-slate-900 text-white px-6 py-2 rounded-xl flex items-center gap-2"><Save size={18}/> Save Changes</button>
            </div>
        </div>
    );
};

export default Settings;