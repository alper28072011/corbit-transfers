import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Filter, Wifi, Baby, Accessibility, Tv, Car as CarIcon, MoreVertical } from 'lucide-react';
import type { Vehicle, VehicleClass, VehicleStatus, VehicleFeature } from '../../types';

// Mock Data
const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    vendor_id: 'vendor_1',
    plate_number: '34 TRF 001',
    make: 'Mercedes-Benz',
    model: 'Vito VIP',
    year: 2023,
    class: 'VIP_VAN',
    capacity: 6,
    features: ['WIFI', 'WATER', 'LEATHER_SEATS'],
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
  },
  {
    id: 'v2',
    vendor_id: 'vendor_1',
    plate_number: '34 TRF 002',
    make: 'Volkswagen',
    model: 'Caravelle',
    year: 2022,
    class: 'MINIVAN',
    capacity: 8,
    features: ['WIFI', 'BABY_SEAT'],
    status: 'MAINTENANCE',
    created_at: new Date().toISOString(),
  },
  {
    id: 'v3',
    vendor_id: 'vendor_1',
    plate_number: '34 TRF 003',
    make: 'Mercedes-Benz',
    model: 'E-Class',
    year: 2024,
    class: 'SEDAN',
    capacity: 3,
    features: ['WATER', 'LEATHER_SEATS'],
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
  }
];

const classColors: Record<VehicleClass, string> = {
  SEDAN: 'bg-blue-100 text-blue-700',
  MINIVAN: 'bg-purple-100 text-purple-700',
  VIP_VAN: 'bg-amber-100 text-amber-700',
  MINIBUS: 'bg-emerald-100 text-emerald-700'
};

const statusColors: Record<VehicleStatus, string> = {
  ACTIVE: 'bg-emerald-500',
  MAINTENANCE: 'bg-amber-500',
  PASSIVE: 'bg-slate-400'
};

export default function FleetManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [filterClass, setFilterClass] = useState<VehicleClass | 'ALL'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredVehicles = vehicles.filter(v => filterClass === 'ALL' || v.class === filterClass);

  const updateStatus = (id: string, newStatus: VehicleStatus) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, status: newStatus } : v));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Filo Yönetimi</h1>
          <p className="text-slate-500 mt-1">Araçlarınızı görüntüleyin, düzenleyin ve durumlarını güncelleyin.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-sm font-medium w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          Yeni Araç Ekle
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <Filter className="w-5 h-5 text-slate-400 flex-shrink-0" />
        {(['ALL', 'SEDAN', 'MINIVAN', 'VIP_VAN', 'MINIBUS'] as const).map((cls) => (
          <button
            key={cls}
            onClick={() => setFilterClass(cls)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
              filterClass === cls 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {cls === 'ALL' ? 'Tüm Araçlar' : cls.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => (
          <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={vehicle.id} 
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
          >
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <CarIcon className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 leading-tight">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <span className="text-slate-500 text-sm font-medium">{vehicle.year} • {vehicle.capacity} Yolcu</span>
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide ${classColors[vehicle.class]}`}>
                  {vehicle.class.replace('_', ' ')}
                </div>
              </div>

              <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                <div className="text-lg font-mono font-bold text-slate-800 tracking-wider">
                  {vehicle.plate_number}
                </div>
                <div className="flex gap-1.5 text-slate-400">
                  {vehicle.features.includes('WIFI') && <Wifi className="w-4 h-4" />}
                  {vehicle.features.includes('BABY_SEAT') && <Baby className="w-4 h-4" />}
                  {vehicle.features.includes('WHEELCHAIR_ACCESSIBLE') && <Accessibility className="w-4 h-4" />}
                  {vehicle.features.includes('TV') && <Tv className="w-4 h-4" />}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${statusColors[vehicle.status]}`} />
                <select 
                  value={vehicle.status}
                  onChange={(e) => updateStatus(vehicle.id, e.target.value as VehicleStatus)}
                  className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="ACTIVE">Aktif (Sahada)</option>
                  <option value="MAINTENANCE">Bakımda</option>
                  <option value="PASSIVE">Pasif</option>
                </select>
              </div>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
        {filteredVehicles.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            Bu sınıfta araç bulunamadı.
          </div>
        )}
      </div>

      {/* Add Modal Placeholder */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-900">Yeni Araç Ekle</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm border border-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {/* Form fields skeleton */}
                <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setIsAddModalOpen(false); }}>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Plaka Numarası</label>
                    <input type="text" placeholder="Örn: 34 TRF 001" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all font-mono uppercase" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Marka</label>
                      <input type="text" placeholder="Örn: Mercedes" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Model</label>
                      <input type="text" placeholder="Örn: Vito" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sınıf</label>
                      <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all bg-white">
                        <option value="SEDAN">Sedan</option>
                        <option value="MINIVAN">Minivan</option>
                        <option value="VIP_VAN">VIP Van</option>
                        <option value="MINIBUS">Minibüs</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kapasite</label>
                      <input type="number" placeholder="Yolcu sayısı" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Özellikler</label>
                    <div className="flex flex-wrap gap-2">
                      {['WIFI', 'BABY_SEAT', 'WATER', 'TV', 'LEATHER_SEATS'].map(feat => (
                        <label key={feat} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                          <input type="checkbox" className="rounded text-slate-900 focus:ring-slate-900" />
                          <span className="text-sm font-medium text-slate-700">{feat.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Aracı Kaydet
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
