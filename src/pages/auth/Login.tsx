import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Phone, AlertCircle, ArrowRight, Loader2, CheckCircle2, User, Building2, ShieldCheck, Check } from 'lucide-react';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../../services/dbClient';
import { api } from '../../services/api';
import type { User as AppUser, Role, Vendor } from '../../types';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
  }
}

export default function Login() {
  const navigate = useNavigate();
  
  // App States
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Phone, 2: OTP, 3: Register Profile
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  // Auth Reference for Confirmation
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [verifiedUid, setVerifiedUid] = useState<string | null>(null);
  
  // Registration Form States
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    role: 'DRIVER' as Role,
    vendor_id: ''
  });

  // OTP Ref elements for focus tracking
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Clean up recaptcha if already present
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.warn('Verifier clear failed', e);
      }
      window.recaptchaVerifier = null;
    }

    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // Solved successfully
        },
        'expired-callback': () => {
          setError('reCAPTCHA süresi doldu, lütfen tekrar deneyin.');
        }
      });
    } catch (err: any) {
      console.error('Recaptcha init failed:', err);
    }

    // Pre-load vendors in case registration is needed
    api.getVendors().then(setVendors).catch(err => console.warn('Vendors fetch failed:', err));

    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn('Verifier clear failed on unmount', e);
        }
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  // Format phone input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow digits and leading plus
    if (/^[0-9+]*$/.test(val) || val === '') {
      setPhoneNumber(val);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    // Basic format validation (+[country][number] - must start with + and have 10-15 chars)
    if (!phoneNumber.startsWith('+') || phoneNumber.length < 10) {
      setError('Lütfen ülke koduyla birlikte geçerli bir telefon numarası girin (Örn: +905551234567).');
      return;
    }

    setLoading(true);
    try {
      if (!window.recaptchaVerifier) {
        throw new Error('reCAPTCHA doğrulayıcı yüklenemedi.');
      }
      
      const confirmResult = await api.signInWithPhone(phoneNumber, window.recaptchaVerifier);
      setConfirmationResult(confirmResult);
      setInfo('Doğrulama kodu SMS ile gönderildi.');
      setStep(2);
      
      // Auto focus first OTP digit
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 300);
    } catch (err: any) {
      console.warn('Firebase Phone Auth failed, fallback to simulation mode:', err);
      
      // Automatic fallback to Simulation Mode
      setConfirmationResult({ isSimulated: true, phoneNumber });
      setInfo('Firebase SMS bölgesi etkinleştirilmediği için Test/Simülasyon modu açıldı. Lütfen OTP Onay Kodu olarak "123456" girin.');
      setStep(2);
      
      // Auto focus first OTP digit
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 300);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val: string, index: number) => {
    if (isNaN(Number(val))) return;
    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1); // keep last char only
    setOtp(newOtp);

    // Focus next on input
    if (val !== '' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (otp[index] === '' && index > 0) {
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
      } else {
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    
    const code = otp.join('');
    if (code.length < 6) {
      setError('Lütfen 6 haneli doğrulama kodunun tamamını girin.');
      return;
    }

    if (confirmationResult && confirmationResult.isSimulated && code !== '123456') {
      setError('Girdiğiniz simülasyon onay kodu hatalı. Lütfen "123456" girin.');
      return;
    }

    setLoading(true);
    try {
      const user = await api.verifyOtpCode(confirmationResult, code);
      if (user) {
        // Registered User found, trigger role-based redirect
        setInfo('Giriş başarılı! Yönlendiriliyorsunuz...');
        handleRoleRedirect(user);
      } else {
        // Authenticated but no Firestore profile. Fetch current UID or generate deterministic simulation UID
        const currentUid = auth.currentUser?.uid || `sim_${phoneNumber.replace(/\+/g, '')}`;
        if (currentUid) {
          setVerifiedUid(currentUid);
          setStep(3);
          setInfo('Telefon numaranız başarıyla doğrulandı. Lütfen profilinizi tamamlayın.');
        } else {
          throw new Error('Kullanıcı oturumu bulunamadı.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Girdiğiniz kod hatalı veya süresi geçmiş. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!regForm.name.trim() || !regForm.email.trim()) {
      setError('Lütfen ad soyad ve e-posta alanlarını doldurun.');
      return;
    }

    if (regForm.role !== 'SUPER_ADMIN' && !regForm.vendor_id) {
      setError('Lütfen bağlı olduğunuz transfer firmasını (Vendor) seçin.');
      return;
    }

    if (!verifiedUid) {
      setError('Doğrulama kimliği kayboldu. Lütfen sayfayı yenileyip tekrar deneyin.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: regForm.name.trim(),
        email: regForm.email.trim(),
        phone: phoneNumber,
        role: regForm.role,
        vendor_id: regForm.role === 'SUPER_ADMIN' ? null : regForm.vendor_id,
        is_active: true
      };

      const newUser = await api.createUserProfile(verifiedUid, payload);
      setInfo('Profiliniz oluşturuldu! Yönlendiriliyorsunuz...');
      handleRoleRedirect(newUser);
    } catch (err: any) {
      console.error(err);
      setError('Profil kaydedilirken bir hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleRedirect = (user: AppUser) => {
    localStorage.setItem('corbit_user', JSON.stringify(user));
    setTimeout(() => {
      if (user.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else if (user.role === 'VENDOR_ADMIN') {
        navigate('/vendor');
      } else if (user.role === 'DRIVER') {
        navigate('/driver');
      } else {
        navigate('/');
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans relative overflow-hidden selection:bg-slate-900 selection:text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-60"></div>
      
      {/* Hidden Recaptcha mount point */}
      <div id="recaptcha-container"></div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white border border-slate-200/80 shadow-xl rounded-2xl p-8 relative z-10"
      >
        {/* Logo/Brand Area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-xl mb-4 shadow-md shadow-slate-900/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Corbit Transfers</h1>
          <p className="text-sm text-slate-500 mt-1.5">Şoför, Firma ve Yönetici Giriş Paneli</p>
        </div>

        {/* Global Notifications */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 bg-rose-50 text-rose-600 px-4 py-3 rounded-xl flex items-start gap-2.5 text-sm border border-rose-100 overflow-hidden"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {info && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl flex items-start gap-2.5 text-sm border border-emerald-100 overflow-hidden"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{info}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Multi-Step Layout */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-phone"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleSendCode} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Telefon Numarası</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input 
                      type="tel"
                      required
                      placeholder="+905551234567"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      disabled={loading}
                      className="block w-full pl-11 pr-4 py-3 text-base text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all disabled:opacity-60"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Telefon numaranızı uluslararası formatta girin (Örn: +905xx...).</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all disabled:bg-slate-400"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Kod Gönderiliyor...
                    </>
                  ) : (
                    <>
                      Doğrulama Kodu Gönder
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <label className="block text-sm font-semibold text-slate-700">SMS Onay Kodu</label>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      className="text-xs text-slate-500 hover:text-slate-900 hover:underline"
                    >
                      Numarayı Değiştir
                    </button>
                  </div>
                  
                  {/* Segmented 6-digit PIN input */}
                  <div className="flex justify-between gap-2.5 my-4">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        onPaste={handleOtpPaste}
                        disabled={loading}
                        className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-slate-900 transition-all disabled:opacity-60"
                      />
                    ))}
                  </div>
                  
                  <p className="text-xs text-slate-500 text-center">
                    Gelen 6 haneli kodu kutucuklara girin.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all disabled:bg-slate-400"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Doğrulanıyor...
                    </>
                  ) : (
                    <>
                      Giriş Yap
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-register"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Verified: <strong>{phoneNumber}</strong></span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Ad Soyad</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ahmet Yılmaz"
                    value={regForm.name}
                    onChange={(e) => setRegForm({...regForm, name: e.target.value})}
                    disabled={loading}
                    className="block w-full px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">E-Posta Adresi</label>
                  <input 
                    type="email"
                    required
                    placeholder="ahmet@corbit.com"
                    value={regForm.email}
                    onChange={(e) => setRegForm({...regForm, email: e.target.value})}
                    disabled={loading}
                    className="block w-full px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Hesap Türü / Rolü</label>
                  <select
                    value={regForm.role}
                    onChange={(e) => setRegForm({...regForm, role: e.target.value as Role})}
                    disabled={loading}
                    className="block w-full px-4 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  >
                    <option value="DRIVER">Şoför (Driver)</option>
                    <option value="VENDOR_ADMIN">Firma Sahibi (Vendor Admin)</option>
                    <option value="SUPER_ADMIN">Sistem Yöneticisi (Super Admin)</option>
                  </select>
                </div>

                {regForm.role !== 'SUPER_ADMIN' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Bağlı Olduğunuz Firma (Vendor)</label>
                    <select
                      required
                      value={regForm.vendor_id}
                      onChange={(e) => setRegForm({...regForm, vendor_id: e.target.value})}
                      disabled={loading}
                      className="block w-full px-4 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    >
                      <option value="">-- Firma Seçin --</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all disabled:bg-slate-400"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Profil Kaydediliyor...
                    </>
                  ) : (
                    <>
                      Kayıt Ol ve Giriş Yap
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
