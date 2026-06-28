import type { Transfer, TransferStatus, User, Vehicle, VehicleStatus } from '../types';

// In-Memory Mock Database
let mockVehicles: Vehicle[] = [
  { id: 'v1', vendor_id: 'vendor_1', plate_number: '34 TRF 001', make: 'Mercedes-Benz', model: 'Vito VIP', year: 2023, class: 'VIP_VAN', capacity: 6, features: ['WIFI', 'WATER', 'LEATHER_SEATS'], status: 'ACTIVE', created_at: new Date().toISOString() },
  { id: 'v2', vendor_id: 'vendor_1', plate_number: '34 TRF 002', make: 'Volkswagen', model: 'Caravelle', year: 2022, class: 'MINIVAN', capacity: 8, features: ['WIFI', 'BABY_SEAT'], status: 'MAINTENANCE', created_at: new Date().toISOString() },
  { id: 'v3', vendor_id: 'vendor_1', plate_number: '34 TRF 003', make: 'Mercedes-Benz', model: 'E-Class', year: 2024, class: 'SEDAN', capacity: 3, features: ['WATER', 'LEATHER_SEATS'], status: 'ACTIVE', created_at: new Date().toISOString() }
];

let mockDrivers: User[] = [
  { id: 'd1', vendor_id: 'vendor_1', role: 'DRIVER', name: 'Ahmet Yılmaz', phone: '+90 555 111 22 33', email: 'ahmet@test.com', is_active: true, created_at: new Date().toISOString() },
  { id: 'd2', vendor_id: 'vendor_1', role: 'DRIVER', name: 'Mehmet Demir', phone: '+90 555 222 33 44', email: 'mehmet@test.com', is_active: true, created_at: new Date().toISOString() },
];

let mockTransfers: Transfer[] = [
  {
    id: 't1',
    pnr: 'TRF-123',
    vendor_id: 'vendor_1',
    passenger_name: 'John Doe',
    passenger_phone: '555',
    passenger_count: 2,
    language_preference: 'en',
    requested_vehicle_class: 'VIP_VAN',
    pickup_location: 'Istanbul Airport (IST)',
    dropoff_location: 'Swissotel The Bosphorus',
    pickup_time: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
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
    pnr: 'TRF-456',
    vendor_id: 'vendor_1',
    vehicle_id: 'v1',
    driver_id: 'd1',
    passenger_name: 'Ayşe Kaya',
    passenger_phone: '555',
    passenger_count: 4,
    language_preference: 'tr',
    requested_vehicle_class: 'VIP_VAN',
    pickup_location: 'Sabiha Gokcen Airport (SAW)',
    dropoff_location: 'Kadikoy Merkez',
    pickup_time: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
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
    pnr: 'TRF-789',
    vendor_id: 'vendor_1',
    vehicle_id: 'v2',
    driver_id: 'd2',
    passenger_name: 'Elena Petrova',
    passenger_phone: '555',
    passenger_count: 5,
    language_preference: 'ru',
    requested_vehicle_class: 'MINIVAN',
    pickup_location: 'Antalya Airport (AYT)',
    dropoff_location: 'Rixos Premium Belek',
    pickup_time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    flight_number: 'SU2134',
    flight_status: 'DELAYED',
    meeting_board_text: 'Elena Petrova Family',
    status: 'PASSENGER_PICKED_UP',
    is_guest_notified: true,
    price: 120,
    commission_amount: 12,
    currency: 'EUR',
    created_at: new Date().toISOString()
  },
  {
    id: 't4',
    pnr: 'TRF-2A11B',
    vendor_id: 'vendor_1',
    vehicle_id: 'v3',
    driver_id: 'd1',
    passenger_name: 'Ali Yılmaz',
    passenger_phone: '+905554443322',
    passenger_count: 1,
    language_preference: 'tr',
    requested_vehicle_class: 'SEDAN',
    pickup_location: 'Sabiha Gokcen Airport (SAW)',
    dropoff_location: 'Pendik Marina',
    pickup_time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Dün
    flight_number: 'TK2000',
    flight_status: 'ON_TIME',
    meeting_board_text: 'Ali Yılmaz',
    status: 'COMPLETED',
    is_guest_notified: true,
    price: 400,
    commission_amount: 40,
    currency: 'TRY',
    created_at: new Date().toISOString()
  }
];

// Helper to simulate network latency
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // --- VEHICLES ---
  getVehicles: async (vendorId: string): Promise<Vehicle[]> => {
    await delay();
    return [...mockVehicles.filter(v => v.vendor_id === vendorId)];
  },
  
  addVehicle: async (vehicleData: Omit<Vehicle, 'id' | 'created_at'>): Promise<Vehicle> => {
    await delay();
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `v_${Date.now()}`,
      created_at: new Date().toISOString()
    };
    mockVehicles = [...mockVehicles, newVehicle];
    return { ...newVehicle };
  },

  updateVehicleStatus: async (id: string, status: VehicleStatus): Promise<Vehicle> => {
    await delay();
    const idx = mockVehicles.findIndex(v => v.id === id);
    if (idx === -1) throw new Error('Vehicle not found');
    
    mockVehicles[idx] = { ...mockVehicles[idx], status };
    mockVehicles = [...mockVehicles]; // trigger reference update if needed
    return { ...mockVehicles[idx] };
  },

  // --- TRANSFERS ---
  getTransfers: async (vendorId: string): Promise<Transfer[]> => {
    await delay();
    return [...mockTransfers.filter(t => t.vendor_id === vendorId)];
  },

  getDriverTransfers: async (driverId: string): Promise<Transfer[]> => {
    await delay();
    return [...mockTransfers.filter(t => t.driver_id === driverId)];
  },

  getTransferByPnr: async (pnr: string, phone: string): Promise<{ transfer: Transfer, driver: User | null, vehicle: Vehicle | null } | null> => {
    await delay();
    const transfer = mockTransfers.find(
      t => t.pnr.toLowerCase() === pnr.toLowerCase().trim() && t.passenger_phone === phone.trim()
    );
    if (!transfer) return null;

    const driver = transfer.driver_id ? mockDrivers.find(d => d.id === transfer.driver_id) || null : null;
    const vehicle = transfer.vehicle_id ? mockVehicles.find(v => v.id === transfer.vehicle_id) || null : null;

    return { transfer: { ...transfer }, driver: driver ? { ...driver } : null, vehicle: vehicle ? { ...vehicle } : null };
  },

  updateTransferStatus: async (id: string, status: TransferStatus): Promise<Transfer> => {
    await delay();
    const idx = mockTransfers.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Transfer not found');

    mockTransfers[idx] = { ...mockTransfers[idx], status };
    mockTransfers = [...mockTransfers];
    return { ...mockTransfers[idx] };
  },

  assignDriverAndVehicle: async (transferId: string, driverId: string, vehicleId: string): Promise<Transfer> => {
    await delay();
    const idx = mockTransfers.findIndex(t => t.id === transferId);
    if (idx === -1) throw new Error('Transfer not found');

    mockTransfers[idx] = { ...mockTransfers[idx], driver_id: driverId, vehicle_id: vehicleId, status: 'DRIVER_ASSIGNED' };
    mockTransfers = [...mockTransfers];
    return { ...mockTransfers[idx] };
  },

  toggleGuestNotification: async (transferId: string): Promise<Transfer> => {
    await delay();
    const idx = mockTransfers.findIndex(t => t.id === transferId);
    if (idx === -1) throw new Error('Transfer not found');

    mockTransfers[idx] = { ...mockTransfers[idx], is_guest_notified: !mockTransfers[idx].is_guest_notified };
    mockTransfers = [...mockTransfers];
    return { ...mockTransfers[idx] };
  },

  // --- DRIVERS ---
  getDrivers: async (vendorId: string): Promise<User[]> => {
    await delay();
    return [...mockDrivers.filter(d => d.vendor_id === vendorId)];
  }
};
