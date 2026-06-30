import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  PlusCircle, 
  ClipboardList, 
  Send, 
  Loader2, 
  AlertCircle, 
  Sparkles,
  Plane,
  MapPin,
  Calendar,
  User,
  Phone,
  Hash,
  Car
} from 'lucide-react';
import Header from '../../components/Header';
import { api } from '../../services/api';
import { db } from '../../services/dbClient';
import { doc, getDoc } from 'firebase/firestore';
import type { Transfer, User as AppUser, Vendor, VehicleClass, TransferStatus } from '../../types';

export default function AffiliateDashboard() {
  const navigate = useNavigate();

  // App & Data states
  const [currentAffiliate, setCurrentAffiliate] = useState<AppUser | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Notification states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [requestedClass, setRequestedClass] = useState<VehicleClass>('SEDAN');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [totalPriceInput, setTotalPriceInput] = useState('100'); // Default price estimate in $

  // Fetch initial dashboard state
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Resolve current affiliate from localStorage
        const stored = localStorage.getItem('corbit_user');
        let affiliateUser: AppUser | null = null;
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as AppUser;
            if (parsed.role === 'AFFILIATE') {
              affiliateUser = parsed;
            }
          } catch (e) {
            console.warn('Failed to parse cached affiliate user:', e);
          }
        }

        // Fallback or verify with db
        if (affiliateUser) {
          const userSnap = await getDoc(doc(db, 'users', affiliateUser.id));
          if (userSnap.exists()) {
            affiliateUser = { id: userSnap.id, ...userSnap.data() } as AppUser;
            setCurrentAffiliate(affiliateUser);
            localStorage.setItem('corbit_user', JSON.stringify(affiliateUser));
          } else {
            setCurrentAffiliate(affiliateUser);
          }
        } else {
          // No logged in affiliate -> redirect to login
          setError('Aracı oturumu bulunamadı. Lütfen giriş yapın.');
          navigate('/login');
          return;
        }

        // 2. Fetch list of available vendors so the affiliate can choose where to pas the reservation
        const activeVendors = await api.getVendors();
        setVendors(activeVendors.filter(v => v.is_active));
        if (activeVendors.length > 0) {
          setSelectedVendorId(activeVendors[0].id);
        }

        // 3. Fetch transfer list passed by this affiliate
        if (affiliateUser) {
          const affTransfers = await api.getAffiliateTransfers(affiliateUser.id);
          setTransfers(affTransfers);
        }

      } catch (err: any) {
        console.error('Affiliate fetch error:', err);
        setError('Veriler yüklenirken bir sorun oluştu: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAffiliate) return;
    
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    if (!passengerName.trim() || !passengerPhone.trim() || !pickupLocation.trim() || !dropoffLocation.trim() || !pickupTime) {
      setError('Lütfen tüm zorunlu alanları eksiksiz doldurun.');
      setSubmitting(false);
      return;
    }

    if (!selectedVendorId) {
      setError('Lütfen transferi gerçekleştirecek yetkili acenteyi seçin.');
      setSubmitting(false);
      return;
    }

    try {
      const priceVal = parseFloat(totalPriceInput) || 100;
      // Calculate commission amount based on current affiliate's commission rate (default to 15% if none exists)
      const commissionRate = currentAffiliate.affiliateCommissionRate || 15;
      const commissionVal = Number(((priceVal * commissionRate) / 100).toFixed(2));

      // Generate realistic PNR
      const generatedPnr = `PNR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // Package transfer payload
      const payload = {
        pnr: generatedPnr,
        vendor_id: selectedVendorId,
        passenger_name: passengerName.trim(),
        passenger_phone: passengerPhone.trim(),
        passenger_count: passengerCount,
        language_preference: 'tr',
        requested_vehicle_class: requestedClass,
        pickup_location: pickupLocation.trim(),
        dropoff_location: dropoffLocation.trim(),
        pickup_time: pickupTime,
        flight_number: flightNumber.trim() || null,
        flight_status: 'UNKNOWN' as const,
        meeting_board_text: passengerName.trim(),
        is_guest_notified: false,
        price: priceVal,
        commission_amount: 0, // platform fee placeholder
        currency: '$',
        affiliateId: currentAffiliate.id,
        affiliateCommissionAmount: commissionVal
      };

      await api.createAffiliateTransfer(payload);

      setSuccess(`Tebrikler! ${passengerName} adına transfer rezervasyonu başarıyla oluşturuldu. Komisyonunuz hesabınıza tanımlandı.`);
      
      // Reset form
      setPassengerName('');
      setPassengerPhone('');
      setPassengerCount(1);
      setPickupLocation('');
      setDropoffLocation('');
      setPickupTime('');
      setFlightNumber('');
      setTotalPriceInput('100');

      // Reload list
      const affTransfers = await api.getAffiliateTransfers(currentAffiliate.id);
      setTransfers(affTransfers);

    } catch (err: any) {
      console.error('Booking creation failed:', err);
      setError('Rezervasyon oluşturulamadı: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // KPI Calculations
  const totalEarnings = transfers
    .filter(t => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + (t.affiliateCommissionAmount || 0), 0);

  const pendingEarnings = transfers
    .filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
    .reduce((sum, t) => sum + (t.affiliateCommissionAmount || 0), 0);

  const completedCount = transfers.filter(t => t.status === 'COMPLETED').length;
  const activeCount = transfers.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length;

  const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Bekliyor', bg: 'bg-amber-50 text-amber-700 border-amber-100' };
      case 'DRIVER_ASSIGNED':
        return { label: 'Atandı', bg: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
      case 'PASSENGER_PICKED_UP':
        return { label: 'Seyir Halinde', bg: 'bg-blue-50 text-blue-700 border-blue-100' };
      case 'COMPLETED':
        return { label: 'Tamamlandı', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      case 'CANCELLED':
        return { label: 'İptal Edildi', bg: 'bg-rose-50 text-rose-700 border-rose-100' };
      default:
        return { label: 'Bilinmeyen', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Aracı paneli yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-slate-900 selection:text-white">
      {/* Header */}
      <Header title="İş Ortağı / Aracı Paneli" subtitle="Müşteri paslayarak pasif gelir kazanın" />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        
        {/* Profile Welcome Info */}
        {currentAffiliate && (
          <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-slate-800/40 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-black bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-500/30">
                  <Sparkles className="w-3.5 h-3.5" /> Resmi İş Ortağı (Affiliate)
                </span>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-3">Hoş Geldin, {currentAffiliate.name}</h1>
                <p className="text-slate-300 text-sm mt-1">
                  Aracı komisyon oranınız: <strong className="text-white font-bold">%{(currentAffiliate.affiliateCommissionRate || 15)}</strong>. 
                  Girdiğiniz her başarılı transfer işleminden anında bu oranda pay alırsınız.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-left">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tanımlı Havuz</p>
                <p className="text-lg font-mono font-bold mt-1 text-blue-300">{currentAffiliate.phone}</p>
              </div>
            </div>
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          {/* Earnings Cashcard */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kesinleşen Kazancım</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-emerald-600 mt-3">${totalEarnings.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Tamamlanan transfer komisyonları</p>
          </div>

          {/* Pending Cashcard */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bekleyen Kazancım</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-amber-600 mt-3">${pendingEarnings.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Süreçteki transferlerden gelecek pay</p>
          </div>

          {/* Completed Jobs */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tamamlanan İşlerim</span>
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mt-3">{completedCount} transfer</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Hizmeti eksiksiz verilmiş</p>
          </div>

          {/* Active Jobs */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aktif Rezervasyonlarım</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-blue-600 mt-3">{activeCount} transfer</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Şu an operasyonu yürütülenler</p>
          </div>
        </div>

        {/* Global Notifications */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-rose-50 text-rose-600 border border-rose-100 p-4 rounded-xl flex items-start gap-3 text-sm shadow-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-emerald-50 text-emerald-700 border border-emerald-100 p-4 rounded-xl flex items-start gap-3 text-sm shadow-sm"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Core Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Reservation Entrance Form */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <PlusCircle className="w-5.5 h-5.5 text-blue-600" />
              Hızlı Rezervasyon Girişi
            </h2>

            <form onSubmit={handleSubmitBooking} className="space-y-4">
              
              {/* Partner Agency Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Transferi Yapacak Acente (Firma)</label>
                <select
                  required
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="block w-full px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all"
                >
                  {vendors.length === 0 ? (
                    <option value="">Acente bulunamadı</option>
                  ) : (
                    vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.monetization_plan})</option>
                    ))
                  )}
                </select>
              </div>

              {/* Passenger Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Müşteri (Yolcu) Ad Soyad</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    placeholder="Michael Brown"
                    className="block w-full pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Passenger Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Yolcu Telefon No (Uluslararası)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    placeholder="+44 7911 123456"
                    className="block w-full pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all font-mono"
                  />
                </div>
              </div>

              {/* Passenger Count & Flight Number */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kişi Sayısı</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Hash className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      required
                      min={1}
                      max={50}
                      value={passengerCount}
                      onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
                      className="block w-full pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Uçuş Kodu (İsteğe Bağlı)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Plane className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={flightNumber}
                      onChange={(e) => setFlightNumber(e.target.value)}
                      placeholder="TK1907"
                      className="block w-full pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Pickup Location */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alınış (Pickup) Noktası</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="İstanbul Havalimanı (IST) Terminal 1"
                    className="block w-full pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Dropoff Location */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bırakılış (Dropoff) Noktası</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4 text-rose-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={dropoffLocation}
                    onChange={(e) => setDropoffLocation(e.target.value)}
                    placeholder="Grand Hyatt Hotel, Şişli"
                    className="block w-full pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Pickup Time */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alınış Tarih & Saat</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="datetime-local"
                    required
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="block w-full pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all font-mono"
                  />
                </div>
              </div>

              {/* Vehicle Class Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Talep Edilen Araç Sınıfı</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Car className="w-4 h-4" />
                  </div>
                  <select
                    value={requestedClass}
                    onChange={(e) => setRequestedClass(e.target.value as VehicleClass)}
                    className="block w-full pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all"
                  >
                    <option value="SEDAN">Sedan Konfor (E-Class vb.)</option>
                    <option value="MINIVAN">Minivan Geniş (Vito, Caravelle)</option>
                    <option value="VIP_VAN">Ultra VIP Minivan (Özel Dizayn)</option>
                    <option value="MINIBUS">Minibüs Büyük Grup (Sprinter, Crafter)</option>
                  </select>
                </div>
              </div>

              {/* Price Estimate & Commission Preview */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Rezervasyon Bedeli ($)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={totalPriceInput}
                    onChange={(e) => setTotalPriceInput(e.target.value)}
                    className="block w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kazancınız (%{currentAffiliate?.affiliateCommissionRate || 15})</label>
                  <div className="text-sm font-black text-emerald-600 pt-2 font-mono">
                    ${((parseFloat(totalPriceInput) || 0) * (currentAffiliate?.affiliateCommissionRate || 15) / 100).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-slate-950 text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-md shadow-slate-950/10 focus:outline-none disabled:bg-slate-300"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Paslanıyor...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Rezervasyonu Sisteme Pasla
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Passed Transfers List */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 flex flex-col">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <ClipboardList className="w-5.5 h-5.5 text-slate-700" />
              Sisteme Gönderdiğim Rezervasyonlar
            </h2>

            {transfers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-100 rounded-2xl">
                <Users className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-slate-500 font-semibold text-sm">Henüz sisteme paslanmış bir rezervasyonunuz bulunmuyor.</p>
                <p className="text-slate-400 text-xs mt-1">Soldaki form üzerinden ilk transferinizi kaydedip komisyon kazanmaya başlayabilirsiniz.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[600px] pr-2">
                {transfers.map((item) => {
                  const badge = getStatusBadge(item.status);
                  return (
                    <div 
                      key={item.id} 
                      className="border border-slate-200/80 rounded-2xl p-4 hover:border-slate-350 hover:shadow-sm transition-all bg-white"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <span className="font-mono text-xs font-black text-slate-400">PNR: {item.pnr}</span>
                          <h4 className="text-sm font-bold text-slate-800 mt-1">{item.passenger_name}</h4>
                          <span className="text-[10px] text-slate-500 font-medium font-mono">{item.passenger_phone}</span>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <div className="text-xs font-black text-emerald-600 mt-1.5">
                            +${item.affiliateCommissionAmount || 0} Pay
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Gidiş</span>
                          <span className="font-medium text-slate-700 truncate block">{item.pickup_location}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Dönüş</span>
                          <span className="font-medium text-slate-700 truncate block">{item.dropoff_location}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans">Rezervasyon Tarihi</span>
                          <span className="font-mono font-medium text-slate-700 block">{new Date(item.pickup_time).toLocaleString('tr-TR')}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Araç Sınıfı</span>
                          <span className="font-bold text-blue-600 block">{item.requested_vehicle_class}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
}
