export type Role = 'SUPER_ADMIN' | 'VENDOR_ADMIN' | 'DRIVER';
export type VehicleClass = 'SEDAN' | 'MINIVAN' | 'VIP_VAN' | 'MINIBUS';
export type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'PASSIVE';
export type TransferStatus = 'PENDING' | 'DRIVER_ASSIGNED' | 'PASSENGER_PICKED_UP' | 'COMPLETED' | 'CANCELLED';
export type FlightStatus = 'ON_TIME' | 'DELAYED' | 'CANCELLED' | 'UNKNOWN';
export type MonetizationPlan = 'SUBSCRIPTION' | 'PER_TRANSFER' | 'MIXED';
export type VehicleFeature = 'WIFI' | 'BABY_SEAT' | 'WATER' | 'WHEELCHAIR_ACCESSIBLE' | 'TV' | 'LEATHER_SEATS';

export interface Vendor {
  id: string; // UUID
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  is_active: boolean;
  monetization_plan: MonetizationPlan;
  commission_rate?: number; // Yüzdelik (örn: 10)
  created_at: string;
}

export interface User {
  id: string; // UUID
  vendor_id?: string | null; // Super Admin için null, Vendor/Driver için dolu
  role: Role;
  name: string;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Vehicle {
  id: string; // UUID
  vendor_id: string;
  plate_number: string;
  make: string; // Örn: Mercedes-Benz
  model: string; // Örn: Vito
  year: number;
  class: VehicleClass;
  capacity: number; // Yolcu kapasitesi
  features: VehicleFeature[]; // Araç özellikleri
  status: VehicleStatus;
  created_at: string;
}

export interface Transfer {
  id: string; // UUID
  pnr: string; // Müşteri sorgu numarası (Örn: TRF-8X91P)
  vendor_id: string;
  vehicle_id?: string | null; // Atama bekleyebilir
  driver_id?: string | null; // Atama bekleyebilir
  
  // Yolcu Bilgileri
  passenger_name: string;
  passenger_phone: string;
  passenger_count: number;
  language_preference: string; // 'en', 'tr', 'ru' vb.
  requested_vehicle_class: VehicleClass;
  
  // Lokasyon ve Uçuş
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string; // ISO 8601 Datetime
  flight_number?: string | null;
  flight_status: FlightStatus;
  meeting_board_text?: string | null; // Karşılama tabelasında yazacak isim
  
  // Operasyonel Durum
  status: TransferStatus;
  is_guest_notified: boolean; // SMS/WhatsApp ile bilgi verildi mi?
  
  // Finansal (Gelecekteki raporlamalar için snapshot)
  price: number;
  commission_amount: number;
  currency: string;
  
  created_at: string;
}
