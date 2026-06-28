import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Clock, 
  Phone, 
  User as UserIcon, 
  Plane, 
  Maximize, 
  X, 
  Navigation,
  CheckCircle2,
  Calendar,
  Loader2
} from 'lucide-react';
import type { Transfer, TransferStatus } from '../../types';
import { api } from '../../services/api';

// O anki giriş yapmış şoförün ID'si
const CURRENT_DRIVER_ID = 'd1';

type TabType = 'ACTIVE' | 'PAST';

export default function DriverDashboard() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('ACTIVE');
  const [meetingBoardText, setMeetingBoardText] = useState<string | null>(null);

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    setLoading(true);
    try {
      const data = await api.getDriverTransfers(CURRENT_DRIVER_ID);
      setTransfers(data);
    } catch (error) {
      console.error('Failed to load transfers', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransfers = transfers.filter(t => {
    if (activeTab === 'ACTIVE') {
      return t.status === 'DRIVER_ASSIGNED' || t.status === 'PASSENGER_PICKED_UP';
    } else {
      return t.status === 'COMPLETED' || t.status === 'CANCELLED';
    }
  });

  const updateTransferStatus = async (id: string, newStatus: TransferStatus) => {
    try {
      const updated = await api.updateTransferStatus(id, newStatus);
      setTransfers(prev => prev.map(t => t.id === id ? updated : t));
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit', month: 'short'
    }).format(d);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Mobile Header */}
      <header className="bg-slate-900 text-white pt-12 pb-6 px-6 sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Şoför Paneli</h1>
            <p className="text-slate-400 text-sm font-medium mt-1">Hoş geldin, Ahmet Kaptan</p>
          </div>
          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700">
            <UserIcon className="w-6 h-6 text-slate-300" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-800 p-1 rounded-2xl w-full">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'ACTIVE' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Aktif İşlerim
          </button>
          <button
            onClick={() => setActiveTab('PAST')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'PAST' 
                ? 'bg-slate-700 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Geçmiş
          </button>
        </div>
      </header>

      {/* Main Content (List) */}
      <main className="flex-1 p-4 space-y-4 pb-24">
        <AnimatePresence mode="popLayout">
          {filteredTransfers.map(transfer => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              key={transfer.id}
              className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 overflow-hidden flex flex-col gap-5"
            >
              {/* Header: Date/Time & PNR */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 text-blue-600 w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-inner">
                    <span className="text-xl font-black leading-none">{formatTime(transfer.pickup_time)}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(transfer.pickup_time)}
                    </span>
                    <span className="text-base font-bold text-slate-900 font-mono block mt-0.5">{transfer.pnr}</span>
                  </div>
                </div>
                {transfer.flight_number && (
                  <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Plane className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-bold text-slate-700">{transfer.flight_number}</span>
                  </div>
                )}
              </div>

              {/* Locations */}
              <div className="relative pl-6 space-y-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200 rounded-full"></div>
                
                <div className="relative">
                  <div className="absolute -left-[27px] top-0.5 w-4 h-4 bg-white border-4 border-blue-500 rounded-full"></div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nereden</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5 leading-snug">{transfer.pickup_location}</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[27px] top-0.5 w-4 h-4 bg-white border-4 border-emerald-500 rounded-full"></div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nereye</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5 leading-snug">{transfer.dropoff_location}</p>
                </div>
              </div>

              {/* Passenger Info & Quick Actions */}
              <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Yolcu</p>
                  <p className="text-lg font-bold text-slate-900 truncate max-w-[160px]">{transfer.passenger_name}</p>
                </div>
                <div className="flex gap-2">
                  {transfer.meeting_board_text && (
                    <button 
                      onClick={() => setMeetingBoardText(transfer.meeting_board_text || '')}
                      className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      <Maximize className="w-6 h-6" />
                    </button>
                  )}
                  <a 
                    href={`tel:${transfer.passenger_phone}`}
                    className="w-12 h-12 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-200 flex items-center justify-center hover:bg-emerald-600 transition-colors"
                  >
                    <Phone className="w-6 h-6" fill="currentColor" />
                  </a>
                </div>
              </div>

              {/* Primary Action Button */}
              {transfer.status === 'DRIVER_ASSIGNED' && (
                <button
                  onClick={() => updateTransferStatus(transfer.id, 'PASSENGER_PICKED_UP')}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Navigation className="w-6 h-6" fill="currentColor" />
                  Yolcuyu Aldım / Çıktık
                </button>
              )}

              {transfer.status === 'PASSENGER_PICKED_UP' && (
                <button
                  onClick={() => updateTransferStatus(transfer.id, 'COMPLETED')}
                  className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  Transferi Tamamla
                </button>
              )}

              {transfer.status === 'COMPLETED' && (
                <div className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 border border-slate-200">
                  <CheckCircle2 className="w-5 h-5" />
                  Bu transfer tamamlandı
                </div>
              )}
            </motion.div>
          ))}
          {filteredTransfers.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-20 text-center px-4"
            >
              <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Görev Bulunamadı</h2>
              <p className="text-slate-500 font-medium">Bu sekmede gösterilecek bir transferiniz bulunmuyor.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Meeting Board Fullscreen Modal */}
      <AnimatePresence>
        {meetingBoardText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 landscape:flex-row"
          >
            <button 
              onClick={() => setMeetingBoardText(null)}
              className="absolute top-6 right-6 w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-colors backdrop-blur-md"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="text-center w-full max-w-full">
              <motion.h1 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-white font-black uppercase text-center break-words leading-none"
                style={{ 
                  fontSize: 'clamp(3rem, 15vw, 12rem)', // Ekran boyutuna göre devasa dinamik font
                  textShadow: '0 10px 30px rgba(255,255,255,0.2)'
                }}
              >
                {meetingBoardText}
              </motion.h1>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
