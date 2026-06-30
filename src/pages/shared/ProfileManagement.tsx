import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  ShieldAlert, 
  Trash2, 
  Save, 
  Loader2, 
  CheckCircle2, 
  ArrowLeft, 
  AlertCircle,
  Building2,
  Shield
} from 'lucide-react';
import Header from '../../components/Header';
import { api } from '../../services/api';
import { auth, db } from '../../services/dbClient';
import { doc, getDoc } from 'firebase/firestore';
import type { User, Vendor } from '../../types';

export default function ProfileManagement() {
  const navigate = useNavigate();
  
  // App states
  const [user, setUser] = useState<User | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Load vendors list for displaying names if available
        const vendorList = await api.getVendors();
        setVendors(vendorList);

        // Check local storage user
        const stored = localStorage.getItem('corbit_user');
        let currentUserId = '';

        if (stored) {
          try {
            const parsed = JSON.parse(stored) as User;
            currentUserId = parsed.id;
          } catch (e) {
            console.warn('Failed parsing local storage user', e);
          }
        }

        // Fallback to currently logged-in firebase auth UID
        if (!currentUserId && auth.currentUser) {
          currentUserId = auth.currentUser.uid;
        }

        if (!currentUserId) {
          setError('Kullanıcı oturumu bulunamadı. Lütfen giriş yapın.');
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, 'users', currentUserId);
        const snap = await getDoc(userDocRef);
        
        if (snap.exists()) {
          const userData = { id: snap.id, ...snap.data() } as User;
          setUser(userData);
          setName(userData.name);
          setEmail(userData.email);
          localStorage.setItem('corbit_user', JSON.stringify(userData));
        } else {
          // If no doc exists in Firestore but we have simulated info, generate a temporary profile
          if (currentUserId.startsWith('sim_')) {
            const phoneStr = '+' + currentUserId.replace('sim_', '');
            const dummyUser: User = {
              id: currentUserId,
              name: 'Simüle Kullanıcı',
              email: 'simule@corbit.com',
              phone: phoneStr,
              role: 'DRIVER',
              is_active: true,
              created_at: new Date().toISOString()
            };
            setUser(dummyUser);
            setName(dummyUser.name);
            setEmail(dummyUser.email);
            localStorage.setItem('corbit_user', JSON.stringify(dummyUser));
          } else {
            setError('Kullanıcı profili Firestore üzerinde bulunamadı.');
          }
        }
      } catch (err: any) {
        console.error('Failed fetching profile:', err);
        setError('Profil bilgileri yüklenirken bir hata oluştu: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSuccess(null);

    if (!name.trim() || !email.trim()) {
      setError('Ad soyad ve e-posta alanları boş bırakılamaz.');
      return;
    }

    setSaving(true);
    try {
      const updatedPayload: Partial<User> = {
        name: name.trim(),
        email: email.trim()
      };

      await api.updateUserProfile(user.id, updatedPayload);
      
      const freshUser = { ...user, ...updatedPayload };
      setUser(freshUser);
      localStorage.setItem('corbit_user', JSON.stringify(freshUser));
      setSuccess('Profil ayarlarınız başarıyla güncellendi.');
    } catch (err: any) {
      console.error(err);
      setError('Güncelleme başarısız oldu: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (deleteConfirmationText !== 'HESABIMI SİL') {
      setError('Doğrulama ifadesi hatalı girildi.');
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await api.deleteUserAccount(user.id);
      localStorage.removeItem('corbit_user');
      setUser(null);
      setShowDeleteModal(false);
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      setError('Hesap silme işlemi başarısız: ' + err.message);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Sistem Yöneticisi (Super Admin)';
      case 'VENDOR_ADMIN': return 'Firma Sahibi (Vendor Admin)';
      case 'DRIVER': return 'Şoför (Driver)';
      default: return 'Kullanıcı';
    }
  };

  const getVendorName = (vendorId?: string | null) => {
    if (!vendorId) return 'Yok (Sistem Yönetimi)';
    const match = vendors.find(v => v.id === vendorId);
    return match ? match.name : 'Yükleniyor...';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Profil bilgileri yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col relative selection:bg-slate-950 selection:text-white">
      {/* Dynamic Header */}
      <Header title="Profil Yönetimi" subtitle="Kişisel bilgilerinizi ve hesap tercihlerinizi güncelleyin" />

      {/* Main Form container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        
        {/* Back Link */}
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri Dön
        </button>

        {/* Status messages */}
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

        {user && (
          <div className="grid grid-cols-1 gap-6">
            
            {/* Main Form Box */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-slate-500" />
                Hesap Detayları
              </h2>

              <form onSubmit={handleSave} className="space-y-5">
                
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ad Soyad</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={saving}
                      className="block w-full pl-10 pr-4 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all"
                      placeholder="Ahmet Yılmaz"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-posta Adresi</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={saving}
                      className="block w-full pl-10 pr-4 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all"
                      placeholder="ahmet@corbit.com"
                    />
                  </div>
                </div>

                {/* Read-Only Fields (Phone, Role, Company) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 mt-6">
                  
                  {/* Verified Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Telefon Numarası</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        disabled
                        value={user.phone}
                        className="block w-full pl-10 pr-4 py-2.5 text-sm text-slate-500 bg-slate-100/70 border border-slate-200 rounded-xl cursor-not-allowed font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      ✓ Güvenli SMS ile Doğrulandı
                    </p>
                  </div>

                  {/* Role Display */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Kullanıcı Rolü</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Shield className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        disabled
                        value={getRoleLabel(user.role)}
                        className="block w-full pl-10 pr-4 py-2.5 text-sm text-slate-500 bg-slate-100/70 border border-slate-200 rounded-xl cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Vendor Display */}
                  {user.role !== 'SUPER_ADMIN' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bağlı Olduğu Transfer Firması</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          disabled
                          value={getVendorName(user.vendor_id)}
                          className="block w-full pl-10 pr-4 py-2.5 text-sm text-slate-500 bg-slate-100/70 border border-slate-200 rounded-xl cursor-not-allowed"
                        />
                      </div>
                    </div>
                  )}

                </div>

                {/* Save button and Animated Loading Bar */}
                <div className="pt-4 flex flex-col gap-3">
                  {saving && (
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                        className="bg-slate-900 h-full"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto self-end flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-md shadow-slate-950/10 hover:shadow-lg focus:outline-none disabled:bg-slate-400"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Ayarlar Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Değişiklikleri Kaydet
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-rose-50/20 border border-rose-200/60 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-lg">
                <h3 className="text-base font-bold text-rose-800 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  Tehlikeli Bölge (Danger Zone)
                </h3>
                <p className="text-xs text-rose-700/80 leading-relaxed">
                  Hesabınızı kalıcı olarak sildiğinizde, kayıtlı tüm operasyonel geçmişiniz, 
                  profil verileriniz ve sisteme bağlı erişim yetkileriniz geri alınamayacak şekilde yok edilir. 
                  Bu işlem KVKK / GDPR gereği tamamen geri döndürülemezdir.
                </p>
              </div>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-rose-200 hover:border-rose-600 text-rose-600 hover:bg-rose-50/50 transition-all font-semibold text-sm shrink-0 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Hesabımı Sil
              </button>
            </div>

          </div>
        )}
      </main>

      {/* Security Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200/80 z-50"
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Hesabınızı Kalıcı Olarak Silmek İstiyor musunuz?</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Bu işlem kesinlikle geri alınamaz. Devam etmek için aşağıdaki kutucuğa büyük harflerle 
                  <strong className="text-rose-600 block my-1 font-extrabold tracking-wider bg-rose-50 py-1 rounded">HESABIMI SİL</strong> 
                  yazarak onaylayın.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <input
                  type="text"
                  required
                  placeholder="HESABIMI SİL"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="block w-full text-center tracking-widest font-black placeholder:tracking-normal px-4 py-3 text-base text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-rose-500 transition-all"
                />

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmationText('');
                    }}
                    className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold text-sm"
                  >
                    Vazgeç
                  </button>
                  <button
                    disabled={deleteConfirmationText !== 'HESABIMI SİL' || deleting}
                    onClick={handleDeleteAccount}
                    className="flex-1 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors font-bold text-sm shadow-lg shadow-rose-200 disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-1.5"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Siliniyor...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Kalıcı Olarak Sil
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
