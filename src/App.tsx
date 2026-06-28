import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Plane, Building2, Car, User } from 'lucide-react';
import VendorLayout from './pages/vendor/VendorLayout';
import DriverDashboard from './pages/driver/DriverDashboard';
import GuestTracking from './pages/guest/GuestTracking';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/vendor/*" element={<VendorLayout />} />
          <Route path="/driver/*" element={<DriverDashboard />} />
          <Route path="/guest/*" element={<GuestTracking />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function WelcomeScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl w-full space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Havalimanı Transfer <span className="text-blue-600">SaaS</span>
          </h1>
          <p className="text-lg text-slate-600">
            Vibe Coding felsefesiyle inşa edilen, PostgreSQL uyumlu, ölçeklenebilir ve i18n destekli Multi-Tenant mimari.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
          <Link to="/admin" className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group text-left">
            <Building2 className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mb-4 transition-colors" />
            <h3 className="text-lg font-semibold mb-1">Super Admin</h3>
            <p className="text-sm text-slate-500">Global sistem, gelirler ve tenant yönetimi.</p>
          </Link>
          
          <Link to="/vendor" className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all group text-left">
            <Plane className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 mb-4 transition-colors" />
            <h3 className="text-lg font-semibold mb-1">Vendor (Firma)</h3>
            <p className="text-sm text-slate-500">Filo, şoför ve operasyon yönetimi.</p>
          </Link>

          <Link to="/driver" className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group text-left">
            <Car className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 mb-4 transition-colors" />
            <h3 className="text-lg font-semibold mb-1">Şoför</h3>
            <p className="text-sm text-slate-500">Mobil öncelikli operasyon ekranı.</p>
          </Link>

          <Link to="/guest" className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-orange-500 hover:shadow-md transition-all group text-left">
            <User className="w-8 h-8 text-slate-400 group-hover:text-orange-600 mb-4 transition-colors" />
            <h3 className="text-lg font-semibold mb-1">Misafir / Yolcu</h3>
            <p className="text-sm text-slate-500">B2C transfer takibi ve PNR ekranı.</p>
          </Link>
        </div>

        <div className="pt-12 text-sm font-medium text-slate-400">
          Sistem mimarisi başlatıldı. İlk modül talimatını bekliyor...
        </div>
      </div>
    </div>
  );
}

function PlaceholderPanel({ title }: { title: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <Link to="/" className="text-blue-600 hover:underline mb-8 text-sm font-medium">
        &larr; Ana Ekrana Dön
      </Link>
      <h1 className="text-3xl font-bold text-slate-900 mb-4">{title}</h1>
      <p className="text-slate-500 max-w-md">
        Bu modül henüz oluşturulmadı. Vibe Coding akışıyla gereksinimleri belirleyerek adım adım inşa edeceğiz.
      </p>
    </div>
  );
}
