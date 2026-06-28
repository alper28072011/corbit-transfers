import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CalendarDays, MapPin, Users, Plane, Clock, 
  MessageCircle, Car, User as UserIcon, X, ChevronRight, Edit2, AlertCircle, CheckCircle2
} from 'lucide-react';
import type { Transfer, TransferStatus, User, Vehicle, FlightStatus } from '../../types';

// Mock Data
const MOCK_VEHICLES: Vehicle[] = [
  { id: 'v1', vendor_id: 'vendor_1', plate_number: '34 TRF 001', make: 'Mercedes', model: 'Vito VIP', year: 2023, class: 'VIP_VAN', capacity: 6, features: ['WIFI'], status: 'ACTIVE', created_at: '' },
  { id: 'v2', vendor_id: 'vendor_1', plate_number: '34 TRF 002', make: 'VW', model: 'Caravelle', year: 2022, class: 'MINIVAN', capacity: 8, features: [], status: 'ACTIVE', created_at: '' },
  { id: 'v3', vendor_id: 'vendor_1', plate_number: '34 TRF 003', make: 'Mercedes', model: 'E-Class', year: 2024, class: 'SEDAN', capacity: 3, features: [], status: 'ACTIVE', created_at: '' },
];

const MOCK_DRIVERS: User[] = [
  { id: 'd1', vendor_id: 'vendor_1', role: 'DRIVER', name: 'Ahmet Yılmaz', phone: '+90 555 111 2233', email: 'ahmet@test.com', is_active: true, created_at: '' },
  { id: 'd2', vendor_id: 'vendor_1', role: 'DRIVER', name: 'Mehmet Demir', phone: '+90 555 222 3344', email: 'mehmet@test.com', is_active: true, created_at: '' },
];

const MOCK_TRANSFERS: Transfer[] = [
  {
    id: 't1',
    pnr: 'TRF-8X91P',
    vendor_id: 'vendor_1',
    passenger_name: 'John Doe',
    passenger_phone: '+44 7700 900077',
    passenger_count: 4,
    language_preference: 'en',
    requested_vehicle_class: 'VIP_VAN',
    pickup_location: 'Istanbul Airport (IST)',
    dropoff_location: 'Swissotel The Bosphorus',
    pickup_time: '2026-06-28T14:30:00Z',
    flight_number: 'TK1984',
    flight_status: 'ON_TIME',
    meeting_board_text: 'Mr. John Doe',
    status: 'PENDING',
    is_guest_notified: false,
    price: 150,
    commission_amount: 15,
    currency: 'EUR',
    created_at: new Date().toISOString()
  },
  {
    id: 't2',
    pnr: 'TRF-4B29M',
    vendor_id: 'vendor_1',
    vehicle_id: 'v3',
    driver_id: 'd1',
    passenger_name: 'Ayşe Kaya',
    passenger_phone: '+90 532 111 2233',
    passenger_count: 2,
    language_preference: 'tr',
    requested_vehicle_class: 'SEDAN',
    pickup_location: 'Kadikoy Merkez',
    dropoff_location: 'Sabiha Gokcen Airport (SAW)',
    pickup_time: '2026-06-28T09:15:00Z',
    flight_number: 'PC284',
    flight_status: 'ON_TIME',
    meeting_board_text: 'Ayşe Kaya',
    status: 'DRIVER_ASSIGNED',
    is_guest_notified: true,
    price: 800,
    commission_amount: 80,
    currency: 'TRY',
    created_at: new Date().toISOString()
  },
  {
    id: 't3',
    pnr: 'TRF-9L11Z',
    vendor_id: 'vendor_1',
    vehicle_id: 'v2',
    driver_id: 'd2',
    passenger_name: 'Elena Petrova',
    passenger_phone: '+7 900 123 4567',
    passenger_count: 5,
    language_preference: 'ru',
    requested_vehicle_class: 'MINIVAN',
    pickup_location: 'Antalya Airport (AYT)',
    dropoff_location: 'Rixos Premium Belek',
    pickup_time: '2026-06-27T18:00:00Z',
    flight_number: 'SU2134',
    flight_status: 'DELAYED',
    meeting_board_text: 'Elena Petrova Family',
    status: 'COMPLETED',
    is_guest_notified: true,
    price: 120,
    commission_amount: 12,
    currency: 'EUR',
    created_at: new Date().toISOString()
  }
];

type FilterTab = 'ALL' | 'PENDING' | 'ASSIGNED' | 'COMPLETED_CANCELLED';

const statusBadgeColors: Record<TransferStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  DRIVER_ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
  PASSENGER_PICKED_UP: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels: Record<TransferStatus, string> = {
  PENDING: 'Atama Bekliyor',
  DRIVER_ASSIGNED: 'Şoför Atandı',
  PASSENGER_PICKED_UP: 'Yolcu Alındı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal',
};

export default function TransferManagement() {
  const [transfers, setTransfers] = useState<Transfer[]>(MOCK_TRANSFERS);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  
  // Assignment Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  const filteredTransfers = transfers.filter(t => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING') return t.status === 'PENDING';
    if (activeTab === 'ASSIGNED') return t.status === 'DRIVER_ASSIGNED' || t.status === 'PASSENGER_PICKED_UP';
    if (activeTab === 'COMPLETED_CANCELLED') return t.status === 'COMPLETED' || t.status === 'CANCELLED';
    return true;
  });

  const toggleGuestNotified = (id: string) => {
    setTransfers(transfers.map(t => 
      t.id === id ? { ...t, is_guest_notified: !t.is_guest_notified } : t
    ));
  };

  const openAssignModal = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setSelectedDriverId(transfer.driver_id || '');
    setSelectedVehicleId(transfer.vehicle_id || '');
    setAssignModalOpen(true);
  };

  const handleAssign = () => {
    if (selectedTransfer && selectedDriverId && selectedVehicleId) {
      setTransfers(transfers.map(t => 
        t.id === selectedTransfer.id 
          ? { ...t, driver_id: selectedDriverId, vehicle_id: selectedVehicleId, status: 'DRIVER_ASSIGNED' }
          : t
      ));
      setAssignModalOpen(false);
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Transfer & Rezervasyon</h1>
          <p className="text-slate-500 mt-1">Operasyonel akışı yönetin, şoför ve araç atamalarını gerçekleştirin.</p>
        </div>
        <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-sm font-medium">
          Yeni Rezervasyon
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl w-full sm:w-max">
        {(['ALL', 'PENDING', 'ASSIGNED', 'COMPLETED_CANCELLED'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            {tab === 'ALL' && 'Tümü'}
            {tab === 'PENDING' && 'Bekleyenler'}
            {tab === 'ASSIGNED' && 'Atananlar'}
            {tab === 'COMPLETED_CANCELLED' && 'Geçmiş'}
          </button>
        ))}
      </div>

      {/* Transfers List */}
      <div className="space-y-4">
        {filteredTransfers.map(transfer => (
          <motion.div 
            layout
            key={transfer.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* Top Bar */}
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-slate-800 bg-slate-200/50 px-2.5 py-1 rounded-md text-sm">
                  {transfer.pnr}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${statusBadgeColors[transfer.status]}`}>
                  {statusLabels[transfer.status]}
                </span>
                {transfer.flight_number && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                    <Plane className="w-3.5 h-3.5" />
                    {transfer.flight_number}
                    {transfer.flight_status === 'DELAYED' && <span className="text-red-500 ml-1">(Rötar)</span>}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm font-medium">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <span className="text-slate-500 group-hover:text-slate-700 transition-colors">Misafir Bildirimi</span>
                  <button 
                    onClick={() => toggleGuestNotified(transfer.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      transfer.is_guest_notified ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      transfer.is_guest_notified ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </label>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-5 flex flex-col lg:flex-row gap-6">
              
              {/* Left Column: Route & Time */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-slate-100 p-2 rounded-full text-slate-500">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Alınış Zamanı</p>
                    <p className="font-bold text-slate-900">{formatDate(transfer.pickup_time)}</p>
                  </div>
                </div>

                <div className="relative pl-11">
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200"></div>
                  
                  <div className="relative mb-6">
                    <div className="absolute -left-11 top-1 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white ring-2 ring-slate-50">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Nereden</p>
                    <p className="font-semibold text-slate-900">{transfer.pickup_location}</p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-11 top-1 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center border-2 border-white ring-2 ring-slate-50">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Nereye</p>
                    <p className="font-semibold text-slate-900">{transfer.dropoff_location}</p>
                  </div>
                </div>
              </div>

              {/* Middle Column: Passenger Info */}
              <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                      {transfer.passenger_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{transfer.passenger_name}</p>
                      <p className="text-sm font-medium text-slate-500 font-mono">{transfer.passenger_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm text-sm font-semibold text-slate-700">
                    <Users className="w-4 h-4 text-slate-400" />
                    {transfer.passenger_count} Pax
                  </div>
                </div>

                {transfer.meeting_board_text && (
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 font-medium mb-1">Karşılama Panosu Yazısı</p>
                    <p className="font-semibold text-slate-800 text-sm">{transfer.meeting_board_text}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Driver/Vehicle Status */}
              <div className="flex-1 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-6">
                {transfer.status === 'PENDING' ? (
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Bu transfer için henüz araç ve şoför atanmadı.</p>
                      <p className="text-xs font-semibold text-slate-400 mt-1">İstenen Sınıf: {transfer.requested_vehicle_class.replace('_', ' ')}</p>
                    </div>
                    <button 
                      onClick={() => openAssignModal(transfer)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
                    >
                      Şoför & Araç Ata
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900">Operasyon Ekibi</p>
                      <button 
                        onClick={() => openAssignModal(transfer)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Değiştir
                      </button>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <UserIcon className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Şoför</p>
                          <p className="text-sm font-bold text-slate-900">
                            {MOCK_DRIVERS.find(d => d.id === transfer.driver_id)?.name || 'Bilinmiyor'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <Car className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Araç</p>
                          <p className="text-sm font-bold text-slate-900">
                            {MOCK_VEHICLES.find(v => v.id === transfer.vehicle_id)?.plate_number || 'Bilinmiyor'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {filteredTransfers.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Transfer Bulunamadı</h3>
            <p className="text-slate-500 mt-1">Seçili filtrelere uygun transfer kaydı bulunmuyor.</p>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      <AnimatePresence>
        {assignModalOpen && selectedTransfer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              onClick={() => setAssignModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Atama Yap</h2>
                  <p className="text-sm font-medium text-slate-500 font-mono mt-1">PNR: {selectedTransfer.pnr}</p>
                </div>
                <button onClick={() => setAssignModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm border border-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800 font-medium leading-relaxed">
                    Müşteri <strong>{selectedTransfer.requested_vehicle_class.replace('_', ' ')}</strong> sınıfı araç talep etmiştir. Lütfen uygun araçlardan birini seçin.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Şoför Seçimi</label>
                    <select 
                      value={selectedDriverId}
                      onChange={e => setSelectedDriverId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all bg-white"
                    >
                      <option value="">Şoför Seçin...</option>
                      {MOCK_DRIVERS.map(driver => (
                        <option key={driver.id} value={driver.id}>{driver.name} ({driver.phone})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Araç Seçimi</label>
                    <select 
                      value={selectedVehicleId}
                      onChange={e => setSelectedVehicleId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all bg-white"
                    >
                      <option value="">Araç Seçin...</option>
                      {MOCK_VEHICLES
                        .filter(v => v.class === selectedTransfer.requested_vehicle_class && v.status === 'ACTIVE')
                        .map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.plate_number} - {vehicle.make} {vehicle.model} ({vehicle.capacity} Pax)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                <button 
                  onClick={() => setAssignModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  İptal
                </button>
                <button 
                  onClick={handleAssign}
                  disabled={!selectedDriverId || !selectedVehicleId}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Atamayı Tamamla
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
