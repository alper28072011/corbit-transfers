import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  Clock, 
  Plane, 
  Users, 
  Phone, 
  Car, 
  CheckCircle2, 
  FileCheck,
  Navigation,
  Globe,
  Loader2,
  User as UserIcon
} from 'lucide-react';
import type { TransferStatus, Transfer, User, Vehicle } from '../../types';
import { api } from '../../services/api';

// Simple Dictionary for i18n
type Language = 'tr' | 'en' | 'ru';

const TRANSLATIONS = {
  tr: {
    findTransfer: 'Transferimi Bul',
    pnrCode: 'PNR Kodu',
    phoneNumber: 'Telefon Numarası',
    welcomeTitle: 'Yolculuğunuza Hoş Geldiniz',
    welcomeSubtitle: 'Transfer durumunuzu ve şoför bilgilerinizi görüntüleyin.',
    statusPending: 'Rezervasyon Alındı',
    statusAssigned: 'Şoför Atandı',
    statusInTransit: 'Seyahat Başladı',
    statusCompleted: 'Tamamlandı',
    planningMessage: 'Aracınız ve şoförünüz operasyon ekibimiz tarafından planlanıyor. Uçuşunuzdan kısa süre önce burada görünecektir.',
    driverTitle: 'Şoförünüz',
    vehicleTitle: 'Aracınız',
    callDriver: 'Şoförü Ara',
    pickup: 'Nereden',
    dropoff: 'Nereye',
    pickupTime: 'Alınış Zamanı',
    flightInfo: 'Uçuş Bilgisi',
    pax: 'Kişi',
    notFound: 'Bu bilgilere ait bir rezervasyon bulunamadı. Lütfen bilgileri kontrol edin.',
    tryExample: 'Örnek denemek için: PNR: TRF-123, Tel: 555',
    back: 'Geri Dön',
  },
  en: {
    findTransfer: 'Find My Transfer',
    pnrCode: 'PNR Code',
    phoneNumber: 'Phone Number',
    welcomeTitle: 'Welcome to Your Journey',
    welcomeSubtitle: 'View your transfer status and driver details in real-time.',
    statusPending: 'Booking Confirmed',
    statusAssigned: 'Driver Assigned',
    statusInTransit: 'In Transit',
    statusCompleted: 'Completed',
    planningMessage: 'Your vehicle and driver are currently being scheduled by our operations team. Details will appear here shortly.',
    driverTitle: 'Your Driver',
    vehicleTitle: 'Your Vehicle',
    callDriver: 'Call Driver',
    pickup: 'Pickup',
    dropoff: 'Dropoff',
    pickupTime: 'Pickup Time',
    flightInfo: 'Flight Info',
    pax: 'Pax',
    notFound: 'No booking found with these details. Please check your information.',
    tryExample: 'Try example: PNR: TRF-123, Phone: 555',
    back: 'Go Back',
  },
  ru: {
    findTransfer: 'Найти мой трансфер',
    pnrCode: 'Код PNR',
    phoneNumber: 'Номер телефона',
    welcomeTitle: 'Добро пожаловать',
    welcomeSubtitle: 'Просматривайте статус вашего трансфера и данные водителя.',
    statusPending: 'Подтверждено',
    statusAssigned: 'Водитель назначен',
    statusInTransit: 'В пути',
    statusCompleted: 'Завершено',
    planningMessage: 'Ваш автомобиль и водитель в настоящее время планируются. Детали появятся здесь незадолго до поездки.',
    driverTitle: 'Ваш водитель',
    vehicleTitle: 'Ваш автомобиль',
    callDriver: 'Позвонить',
    pickup: 'Откуда',
    dropoff: 'Куда',
    pickupTime: 'Время посадки',
    flightInfo: 'Рейс',
    pax: 'чел.',
    notFound: 'Бронирование не найдено. Пожалуйста, проверьте данные.',
    tryExample: 'Пример: PNR: TRF-123, Тел: 555',
    back: 'Назад',
  }
};

export default function GuestTracking() {
  const [lang, setLang] = useState<Language>('tr');
  const [pnrInput, setPnrInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [activeData, setActiveData] = useState<{ transfer: Transfer, driver: User | null, vehicle: Vehicle | null } | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const t = TRANSLATIONS[lang];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setLoading(true);
    
    try {
      const data = await api.getTransferByPnr(pnrInput, phoneInput);
      if (data) {
        setActiveData(data);
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: TransferStatus) => {
    switch(status) {
      case 'PENDING': return 0;
      case 'DRIVER_ASSIGNED': return 1;
      case 'PASSENGER_PICKED_UP': return 2;
      case 'COMPLETED': return 3;
      default: return 0;
    }
  };

  const steps = [
    { key: 'PENDING', icon: FileCheck, label: t.statusPending },
    { key: 'DRIVER_ASSIGNED', icon: Car, label: t.statusAssigned },
    { key: 'PASSENGER_PICKED_UP', icon: Navigation, label: t.statusInTransit },
    { key: 'COMPLETED', icon: CheckCircle2, label: t.statusCompleted }
  ];

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : 'tr-TR', {
      day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-96 bg-slate-900 rounded-b-[3rem] shadow-xl z-0 pointer-events-none"></div>

      {/* Header & Language Switcher */}
      <header className="relative z-10 p-6 flex justify-between items-center max-w-lg mx-auto w-full">
        <div className="text-white font-bold text-xl tracking-tight">TRF<span className="text-blue-400">SYNC</span></div>
        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-full backdrop-blur-md border border-white/20">
          {(['tr', 'en', 'ru'] as Language[]).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`w-8 h-8 rounded-full text-xs font-bold uppercase transition-colors flex items-center justify-center ${
                lang === l ? 'bg-white text-slate-900' : 'text-white hover:bg-white/20'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-12 w-full max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {!activeData ? (
            /* SEARCH FORM */
            <motion.div
              key="search-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">{t.welcomeTitle}</h1>
                <p className="text-slate-500 mt-2 text-sm">{t.welcomeSubtitle}</p>
              </div>

              <form onSubmit={handleSearch} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t.pnrCode}</label>
                  <input 
                    type="text" 
                    required
                    value={pnrInput}
                    onChange={(e) => setPnrInput(e.target.value)}
                    placeholder="TRF-..." 
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all font-mono uppercase bg-slate-50 focus:bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t.phoneNumber}</label>
                  <input 
                    type="text" 
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="555..." 
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all bg-slate-50 focus:bg-white" 
                  />
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 text-center">
                    {t.notFound}
                  </motion.div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  {t.findTransfer}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-slate-400 font-medium">{t.tryExample}</p>
              </div>
            </motion.div>
          ) : (
            /* TRACKING DETAILS */
            <motion.div
              key="tracking-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-6"
            >
              <button 
                onClick={() => setActiveData(null)}
                className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors"
              >
                &larr; {t.back}
              </button>

              {/* Status Stepper */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
                <div className="flex justify-between items-center relative">
                  <div className="absolute left-6 right-6 top-6 h-1 bg-slate-100 rounded-full -z-0"></div>
                  
                  {/* Progress Fill */}
                  <div 
                    className="absolute left-6 top-6 h-1 bg-blue-600 rounded-full -z-0 transition-all duration-700 ease-out"
                    style={{ width: `calc(${getStepIndex(activeData.transfer.status) / (steps.length - 1)} * (100% - 3rem))` }}
                  ></div>

                  {steps.map((step, idx) => {
                    const isActive = idx <= getStepIndex(activeData.transfer.status);
                    const isCurrent = idx === getStepIndex(activeData.transfer.status);
                    return (
                      <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm border-4 border-white ${
                          isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                        } ${isCurrent ? 'ring-4 ring-blue-100 scale-110' : ''}`}>
                          <step.icon className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                        </div>
                        <span className={`text-[10px] sm:text-xs font-bold text-center max-w-[70px] ${
                          isActive ? 'text-slate-900' : 'text-slate-400'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Driver & Vehicle Details */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                {activeData.transfer.status === 'PENDING' ? (
                  <div className="p-8 text-center bg-blue-50/50">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8" />
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed">
                      {t.planningMessage}
                    </p>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide">{t.driverTitle}</h3>
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                            <UserIcon className="w-7 h-7 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-bold text-lg text-slate-900">{activeData.driver?.name}</p>
                            <p className="text-sm text-slate-500 font-mono">{activeData.driver?.phone}</p>
                          </div>
                        </div>
                        <a 
                          href={`tel:${activeData.driver?.phone}`}
                          className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                        >
                          <Phone className="w-5 h-5" />
                          {t.callDriver}
                        </a>
                      </div>

                      <div className="hidden sm:block w-px bg-slate-100"></div>
                      <div className="sm:hidden h-px w-full bg-slate-100"></div>

                      <div className="flex-1 space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide">{t.vehicleTitle}</h3>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <p className="text-xl font-black text-slate-900 font-mono mb-1">{activeData.vehicle?.plate_number}</p>
                          <p className="text-sm font-bold text-slate-600">{activeData.vehicle?.make} {activeData.vehicle?.model}</p>
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-500">
                            <Car className="w-3.5 h-3.5" />
                            {activeData.vehicle?.class.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Transfer Details Card */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="bg-slate-100 p-2 rounded-lg">
                    <FileCheck className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">PNR</p>
                    <p className="font-bold text-slate-900 font-mono">{activeData.transfer.pnr}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {t.pickupTime}
                    </p>
                    <p className="font-bold text-slate-900 text-sm">{formatDate(activeData.transfer.pickup_time)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Plane className="w-3.5 h-3.5" /> {t.flightInfo}
                    </p>
                    <p className="font-bold text-slate-900 text-sm">{activeData.transfer.flight_number || '-'}</p>
                  </div>
                </div>

                <div className="relative pl-8 space-y-6 pt-2">
                  <div className="absolute left-2.5 top-4 bottom-4 w-0.5 bg-slate-200 rounded-full"></div>
                  
                  <div className="relative">
                    <div className="absolute -left-[35px] top-0 w-6 h-6 bg-blue-100 border-2 border-white rounded-full flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t.pickup}</p>
                    <p className="font-bold text-slate-900 mt-0.5">{activeData.transfer.pickup_location}</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[35px] top-0 w-6 h-6 bg-emerald-100 border-2 border-white rounded-full flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t.dropoff}</p>
                    <p className="font-bold text-slate-900 mt-0.5">{activeData.transfer.dropoff_location}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">{activeData.transfer.passenger_count} {t.pax}</span>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
