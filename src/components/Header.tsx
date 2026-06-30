import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, LogOut, Settings, Shield, UserCheck, ChevronDown, Building2, Car } from 'lucide-react';
import { auth, db } from '../services/dbClient';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '../types';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load user data from localStorage or Firestore
  useEffect(() => {
    const loadUser = async () => {
      // 1. Try local storage first
      const stored = localStorage.getItem('corbit_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as User;
          setUser(parsed);
          
          // Let's verify and update with Firestore in background
          const docRef = doc(db, 'users', parsed.id);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const freshData = { id: snap.id, ...snap.data() } as User;
            setUser(freshData);
            localStorage.setItem('corbit_user', JSON.stringify(freshData));
          }
          return;
        } catch (e) {
          console.warn('Failed parsing stored user', e);
        }
      }

      // 2. Fallback to auth current user
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const userData = { id: snap.id, ...snap.data() } as User;
            setUser(userData);
            localStorage.setItem('corbit_user', JSON.stringify(userData));
          }
        } catch (err) {
          console.error('Error fetching auth user info:', err);
        }
      }
    };

    loadUser();

    // Listen to Auth changes to keep synced
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        loadUser();
      } else {
        // Only clear if not in simulation mode (simulation doesn't use firebase auth currentUser)
        const cached = localStorage.getItem('corbit_user');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (!parsed.id.startsWith('sim_')) {
              setUser(null);
              localStorage.removeItem('corbit_user');
            }
          } catch {
            setUser(null);
            localStorage.removeItem('corbit_user');
          }
        } else {
          setUser(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      console.warn('SignOut failed:', e);
    }
    localStorage.removeItem('corbit_user');
    setUser(null);
    setDropdownOpen(false);
    navigate('/login');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .trim()
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          label: 'Super Admin',
          bg: 'bg-rose-50 text-rose-700 border-rose-100',
          icon: Shield,
        };
      case 'VENDOR_ADMIN':
        return {
          label: 'Firma Sahibi',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
          icon: Building2,
        };
      case 'DRIVER':
        return {
          label: 'Şoför',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          icon: Car,
        };
      default:
        return {
          label: 'Kullanıcı',
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: UserIcon,
        };
    }
  };

  const badge = getRoleBadge(user?.role);
  const BadgeIcon = badge.icon;

  return (
    <header className="bg-white border-b border-slate-200/80 h-16 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm shadow-slate-100/40">
      {/* Title & Path */}
      <div>
        {title ? (
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>}
          </div>
        ) : (
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-extrabold text-lg text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
              Corbit <span className="text-blue-600">Transfers</span>
            </span>
          </Link>
        )}
      </div>

      {/* User Controls */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-150 transition-all text-left focus:outline-none"
              id="user-profile-button"
            >
              {/* Avatar Circle */}
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {getInitials(user.name)}
              </div>

              {/* Name & Role Badge (Desktop) */}
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
                <div className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${badge.bg}`}>
                  <BadgeIcon className="w-2.5 h-2.5" />
                  <span>{badge.label}</span>
                </div>
              </div>

              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Layer */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 shadow-xl rounded-2xl p-2 z-50 origin-top-right"
                  id="user-dropdown"
                >
                  {/* Small Profile Summary in dropdown */}
                  <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Giriş Yapıldı</p>
                    <p className="text-sm font-bold text-slate-900 truncate mt-0.5">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all font-medium"
                    id="dropdown-profile-link"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Hesap Ayarları
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 rounded-xl transition-all font-medium text-left"
                    id="dropdown-logout-button"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Çıkış Yap
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link
            to="/login"
            className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors px-4 py-2 rounded-xl shadow-sm"
          >
            Giriş Yap
          </Link>
        )}
      </div>
    </header>
  );
}
