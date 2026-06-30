import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Filter, Wifi, Baby, Accessibility, Tv, Car as CarIcon, Loader2, X, Upload, Edit, Trash2 } from 'lucide-react';
import type { Vehicle, VehicleClass, VehicleStatus, VehicleFeature } from '../../types';
import { api } from '../../services/api';

const VENDOR_ID = 'vendor_1'; // Mock vendor ID

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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filterClass, setFilterClass] = useState<VehicleClass | 'ALL'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    plate_number: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    class: 'MINIVAN',
    capacity: 6,
    features: [],
    status: 'ACTIVE',
    vendor_id: VENDOR_ID
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await api.getVehicles(VENDOR_ID);
      setVehicles(data);
    } catch (error) {
      console.error('Failed to load vehicles', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => filterClass === 'ALL' || v.class === filterClass);

  const updateStatus = async (id: string, newStatus: VehicleStatus) => {
    try {
      const updated = await api.updateVehicleStatus(id, newStatus);
      setVehicles(vehicles.map(v => v.id === id ? updated : v));
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const handleSubmitVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.plate_number || !newVehicle.make || !newVehicle.model) return;
    
    try {
      setIsSubmitting(true);
      if (editingVehicleId) {
        // Edit mode
        let currentImageUrl = newVehicle.imageUrl;
        if (selectedFile) {
          setUploadingImage(true);
          currentImageUrl = await api.uploadVehicleImage(editingVehicleId, selectedFile);
        }
        
        const updatePayload = {
          plate_number: newVehicle.plate_number,
          make: newVehicle.make,
          model: newVehicle.model,
          year: newVehicle.year,
          class: newVehicle.class,
          capacity: newVehicle.capacity,
          features: newVehicle.features,
          status: newVehicle.status,
          imageUrl: currentImageUrl,
        };
        
        await api.updateVehicle(editingVehicleId, updatePayload);
        
        setVehicles(vehicles.map(v => v.id === editingVehicleId ? { ...v, ...updatePayload } : v));
      } else {
        // Add mode
        const added = await api.addVehicle(newVehicle as Omit<Vehicle, 'id' | 'created_at'>);
        
        let finalAdded = added;
        if (selectedFile) {
          setUploadingImage(true);
          const imageUrl = await api.uploadVehicleImage(added.id, selectedFile);
          finalAdded = { ...added, imageUrl };
        }

        setVehicles([...vehicles, finalAdded]);
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save vehicle', error);
    } finally {
      setIsSubmitting(false);
      setUploadingImage(false);
    }
  };

  const handleEditClick = (vehicle: Vehicle) => {
    setEditingVehicleId(vehicle.id);
    setNewVehicle({
      plate_number: vehicle.plate_number,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      class: vehicle.class,
      capacity: vehicle.capacity,
      features: vehicle.features,
      status: vehicle.status,
      vendor_id: vehicle.vendor_id,
      imageUrl: vehicle.imageUrl,
    });
    setSelectedFile(null);
    setIsAddModalOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingVehicleId(null);
    setNewVehicle({
      plate_number: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      class: 'MINIVAN',
      capacity: 6,
      features: [],
      status: 'ACTIVE',
      vendor_id: VENDOR_ID
    });
    setSelectedFile(null);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingVehicleId(null);
    setSelectedFile(null);
    setNewVehicle({
      plate_number: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      class: 'MINIVAN',
      capacity: 6,
      features: [],
      status: 'ACTIVE',
      vendor_id: VENDOR_ID
    });
  };

  const handleDeleteClick = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!vehicleToDelete) return;
    try {
      setIsSubmitting(true);
      await api.deleteVehicle(vehicleToDelete.id, vehicleToDelete.imageUrl);
      setVehicles(vehicles.filter(v => v.id !== vehicleToDelete.id));
      setIsDeleteConfirmOpen(false);
      setVehicleToDelete(null);
    } catch (error) {
      console.error('Failed to delete vehicle', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFeature = (feat: VehicleFeature) => {
    setNewVehicle(prev => ({
      ...prev,
      features: prev.features?.includes(feat) 
        ? prev.features.filter(f => f !== feat)
        : [...(prev.features || []), feat]
    }));
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
          onClick={handleAddNewClick}
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
            {vehicle.imageUrl && (
              <div className="h-44 w-full bg-slate-50 border-b border-slate-100 overflow-hidden relative">
                <img 
                  src={vehicle.imageUrl} 
                  alt={`${vehicle.make} ${vehicle.model}`} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {vehicle.imageUrl ? (
                      <img 
                        src={vehicle.imageUrl} 
                        alt={`${vehicle.make} ${vehicle.model}`} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <CarIcon className="w-6 h-6 text-slate-600" />
                    )}
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
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleEditClick(vehicle)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
                  title="Düzenle"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteClick(vehicle)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
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
              onClick={handleCloseModal}
            />
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingVehicleId ? 'Aracı Düzenle' : 'Yeni Araç Ekle'}
                </h2>
                <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm border border-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <form id="add-vehicle-form" className="space-y-5" onSubmit={handleSubmitVehicle}>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Plaka Numarası</label>
                    <input 
                      type="text" 
                      value={newVehicle.plate_number}
                      onChange={(e) => setNewVehicle({...newVehicle, plate_number: e.target.value})}
                      placeholder="Örn: 34 TRF 001" 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all font-mono uppercase" 
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Marka</label>
                      <input 
                        type="text" 
                        value={newVehicle.make}
                        onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})}
                        placeholder="Örn: Mercedes" 
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Model</label>
                      <input 
                        type="text" 
                        value={newVehicle.model}
                        onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                        placeholder="Örn: Vito" 
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all" 
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sınıf</label>
                      <select 
                        value={newVehicle.class}
                        onChange={(e) => setNewVehicle({...newVehicle, class: e.target.value as VehicleClass})}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all bg-white"
                      >
                        <option value="SEDAN">Sedan</option>
                        <option value="MINIVAN">Minivan</option>
                        <option value="VIP_VAN">VIP Van</option>
                        <option value="MINIBUS">Minibüs</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kapasite</label>
                      <input 
                        type="number" 
                        value={newVehicle.capacity}
                        onChange={(e) => setNewVehicle({...newVehicle, capacity: parseInt(e.target.value) || 0})}
                        placeholder="Yolcu sayısı" 
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Araç Görseli</label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                          <Upload className="w-8 h-8 text-slate-400 mb-2" />
                          <p className="text-sm text-slate-500 font-medium truncate max-w-full">
                            {selectedFile ? selectedFile.name : (newVehicle.imageUrl ? "Mevcut görseli değiştirmek için tıklayın" : "Görsel seçmek için tıklayın")}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">PNG, JPG, JPEG (Maks. 5MB)</p>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setSelectedFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Özellikler</label>
                    <div className="flex flex-wrap gap-2">
                      {(['WIFI', 'BABY_SEAT', 'WATER', 'TV', 'LEATHER_SEATS'] as VehicleFeature[]).map(feat => (
                        <label key={feat} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                          <input 
                            type="checkbox" 
                            checked={newVehicle.features?.includes(feat) || false}
                            onChange={() => toggleFeature(feat)}
                            className="rounded text-slate-900 focus:ring-slate-900" 
                          />
                          <span className="text-sm font-medium text-slate-700">{feat.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50">
                <button 
                  type="submit"
                  form="add-vehicle-form"
                  disabled={isSubmitting || uploadingImage}
                  className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting || uploadingImage ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {uploadingImage ? 'Resim Yükleniyor...' : 'Kaydediliyor...'}
                    </>
                  ) : (editingVehicleId ? 'Değişiklikleri Kaydet' : 'Aracı Kaydet')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-slate-900 mb-2">Aracı Sil</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Bu aracı ({vehicleToDelete?.make} {vehicleToDelete?.model}) silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                </p>
                <div className="flex gap-3 justify-end">
                  <button 
                    onClick={() => setIsDeleteConfirmOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Vazgeç
                  </button>
                  <button 
                    onClick={handleConfirmDelete}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Siliniyor...
                      </>
                    ) : 'Evet, Sil'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
