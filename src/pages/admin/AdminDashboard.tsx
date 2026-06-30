import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Car, 
  CalendarDays, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  X,
  Users,
  Percent
} from 'lucide-react';
import type { Vendor, MonetizationPlan } from '../../types';
import { api } from '../../services/api';
import Header from '../../components/Header';

export default function AdminDashboard() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState({ 
    totalRevenue: 0, 
    totalTransfers: 0, 
    activeVendors: 0, 
    activeVehicles: 0,
    totalAffiliates: 0,
    totalAffiliateCommissions: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Add Vendor Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '', contact_name: '', phone: '', email: '', monetization_plan: 'MIXED' as MonetizationPlan, commission_rate: 10
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [vendorData, statsData] = await Promise.all([
        api.getVendors(),
        api.getSystemStats()
      ]);
      setVendors(vendorData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVendorStatus = async (id: string, currentStatus: boolean) => {
    try {
      const updated = await api.updateVendorStatus(id, !currentStatus);
      setVendors(vendors.map(v => v.id === id ? updated : v));
      loadDashboard(); // Refresh stats
    } catch (error) {
      console.error('Failed to update vendor status', error);
    }
  };

  const updateMonetization = async (id: string, plan: MonetizationPlan) => {
    try {
      const updated = await api.updateVendorMonetization(id, plan);
      setVendors(vendors.map(v => v.id === id ? updated : v));
    } catch (error) {
      console.error('Failed to update monetization', error);
    }
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.addVendor({
        ...newVendor,
        is_active: true
      });
      setVendors([...vendors, created]);
      setIsAddModalOpen(false);
      setNewVendor({ name: '', contact_name: '', phone: '', email: '', monetization_plan: 'MIXED', commission_rate: 10 });
      loadDashboard();
    } catch (error) {
      console.error('Failed to add vendor', error);
    }
  };

  if (loading && vendors.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header title="TRFSYNC" subtitle="Süper Yönetici Kontrol Paneli" />

      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Genel Bakış</h1>
            <p className="text-slate-500 mt-1">Sistem metriklerini ve acente operasyonlarını yönetin.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium w-full sm:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            Yeni Acente Ekle
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-emerald-200 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Net Sistem Geliri</p>
                <h3 className="text-xl font-black text-slate-900 mt-1">₺{stats.totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 w-max px-2.5 py-1 rounded-md">
              <TrendingUp className="w-3 h-3" /> +12% bu ay
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-blue-200 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Toplam Transfer</p>
                <h3 className="text-xl font-black text-slate-900 mt-1">{stats.totalTransfers}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <CalendarDays className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-slate-500">
              Sistem üzerinden geçen
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-purple-200 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Aktif Acente</p>
                <h3 className="text-xl font-black text-slate-900 mt-1">{stats.activeVendors}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-slate-500">
              Kayıtlı {vendors.length} firmadan
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-orange-200 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Aktif Filo</p>
                <h3 className="text-xl font-black text-slate-900 mt-1">{stats.activeVehicles}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <Car className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-slate-500">
              Sahada operasyonda
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-rose-200 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Aracı İş Ortağı</p>
                <h3 className="text-xl font-black text-slate-900 mt-1">{stats.totalAffiliates || 0}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-slate-500">
              Kayıtlı aracılar
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-indigo-200 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Aracı Komisyonu</p>
                <h3 className="text-xl font-black text-slate-900 mt-1">₺{(stats.totalAffiliateCommissions || 0).toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-slate-500">
              Dağıtılan toplam pay
            </div>
          </div>
        </div>

        {/* Vendors Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Acenteler & Gelir Yönetimi</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {vendors.map(vendor => (
              <motion.div 
                layout
                key={vendor.id} 
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col sm:flex-row"
              >
                {/* Vendor Info Section */}
                <div className="p-6 flex-1 border-b sm:border-b-0 sm:border-r border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
                        <Building2 className="w-6 h-6 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 leading-tight">{vendor.name}</h3>
                        <p className="text-sm text-slate-500 font-medium">Katılım: {new Date(vendor.created_at).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleVendorStatus(vendor.id, vendor.is_active)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        vendor.is_active 
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {vendor.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {vendor.is_active ? 'Aktif' : 'Pasif'}
                    </button>
                  </div>
                  
                  <div className="space-y-2 mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">Yetkili:</span>
                      <span className="font-bold text-slate-900">{vendor.contact_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">Telefon:</span>
                      <span className="font-bold text-slate-900 font-mono">{vendor.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Monetization Section */}
                <div className="p-6 sm:w-64 flex flex-col justify-center bg-slate-50/50">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Gelir Modeli</label>
                  <select 
                    value={vendor.monetization_plan}
                    onChange={(e) => updateMonetization(vendor.id, e.target.value as MonetizationPlan)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all font-semibold text-slate-700 bg-white shadow-sm"
                  >
                    <option value="SUBSCRIPTION">Aylık Abonelik</option>
                    <option value="PER_TRANSFER">Transfer Başına Komisyon</option>
                    <option value="MIXED">Karma Model (Aylık + %)</option>
                  </select>
                  
                  {vendor.monetization_plan !== 'SUBSCRIPTION' && (
                    <div className="mt-4 flex items-center justify-between px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-sm font-bold text-slate-600">Komisyon</span>
                      <span className="font-black text-slate-900">%{vendor.commission_rate || 10}</span>
                    </div>
                  )}
                  {vendor.monetization_plan === 'SUBSCRIPTION' && (
                    <div className="mt-4 flex items-center justify-between px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-sm font-bold text-slate-600">Aylık Tutar</span>
                      <span className="font-black text-slate-900">₺2.500</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Add Vendor Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Yeni Acente Ekle</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Sisteme yeni bir transfer firması tanımlayın.</p>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm border border-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <form id="addVendorForm" onSubmit={handleAddVendor} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Firma / Acente Adı</label>
                    <input required type="text" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} placeholder="Örn: Bosphorus VIP" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Yetkili Ad Soyad</label>
                    <input required type="text" value={newVendor.contact_name} onChange={e => setNewVendor({...newVendor, contact_name: e.target.value})} placeholder="Örn: Ahmet Yılmaz" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Telefon</label>
                      <input required type="tel" value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} placeholder="+90 555..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all font-mono" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">E-posta</label>
                      <input required type="email" value={newVendor.email} onChange={e => setNewVendor({...newVendor, email: e.target.value})} placeholder="info@..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all" />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Gelir Modeli Yapılandırması</h4>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Model Tipi</label>
                      <select value={newVendor.monetization_plan} onChange={e => setNewVendor({...newVendor, monetization_plan: e.target.value as MonetizationPlan})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all bg-white">
                        <option value="SUBSCRIPTION">Aylık Abonelik</option>
                        <option value="PER_TRANSFER">Transfer Başına Komisyon</option>
                        <option value="MIXED">Karma Model (Aylık + %)</option>
                      </select>
                    </div>
                    
                    {newVendor.monetization_plan !== 'SUBSCRIPTION' && (
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Komisyon Oranı (%)</label>
                        <input type="number" min="0" max="100" value={newVendor.commission_rate} onChange={e => setNewVendor({...newVendor, commission_rate: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all" />
                      </div>
                    )}
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  İptal
                </button>
                <button 
                  form="addVendorForm"
                  type="submit"
                  className="px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  Acenteyi Kaydet
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
