import { Car, LayoutDashboard, Settings, Users, CalendarDays, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import FleetManagement from './FleetManagement';
import TransferManagement from './TransferManagement';
import Header from '../../components/Header';

export default function VendorLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/vendor/dashboard', icon: LayoutDashboard },
    { name: 'Filo Yönetimi', href: '/vendor/fleet', icon: Car },
    { name: 'Şoförler', href: '/vendor/drivers', icon: Users },
    { name: 'Transferler', href: '/vendor/transfers', icon: CalendarDays },
    { name: 'Ayarlar', href: '/vendor/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 transition-all duration-300 fixed inset-y-0 z-10">
        <div className="h-16 flex items-center px-6 font-bold text-white text-xl border-b border-slate-800">
          Vendor Panel
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Header & Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white z-20 flex items-center justify-between px-4">
        <div className="font-bold text-lg">Vendor Panel</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-slate-900/95 backdrop-blur-sm z-20 flex flex-col p-4">
          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 mt-16 md:mt-0 min-h-screen">
        <Header title="Firma Yönetim Paneli" subtitle="Filo, şoför ve transfer operasyonları" />
        <Routes>
          <Route path="/" element={<Navigate to="fleet" replace />} />
          <Route path="fleet" element={<FleetManagement />} />
          <Route path="dashboard" element={<Placeholder title="Dashboard" />} />
          <Route path="drivers" element={<Placeholder title="Şoför Yönetimi" />} />
          <Route path="transfers" element={<TransferManagement />} />
          <Route path="settings" element={<Placeholder title="Firma Ayarları" />} />
        </Routes>
      </main>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-6 md:p-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
      <p className="text-slate-500">Bu modül yapım aşamasındadır.</p>
    </div>
  );
}
