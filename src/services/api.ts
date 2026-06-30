import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, deleteDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { signInWithPhoneNumber } from 'firebase/auth';
import type { Transfer, TransferStatus, User, Vehicle, VehicleStatus, Vendor, MonetizationPlan } from '../types';
import { db, storage, auth } from './dbClient';

export const api = {
  // --- VEHICLES ---
  getVehicles: async (vendorId: string): Promise<Vehicle[]> => {
    try {
      const q = query(collection(db, 'vehicles'), where('vendor_id', '==', vendorId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
    } catch (error: any) {
      console.warn('DB Error (getVehicles):', error.message);
      return [];
    }
  },
  
  addVehicle: async (vehicleData: Omit<Vehicle, 'id' | 'created_at'>): Promise<Vehicle> => {
    const newDoc = {
      ...vehicleData,
      created_at: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'vehicles'), newDoc);
    return { id: docRef.id, ...newDoc } as Vehicle;
  },

  updateVehicle: async (vehicleId: string, updatedData: Partial<Vehicle>): Promise<void> => {
    const docRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(docRef, updatedData);
  },

  deleteVehicle: async (vehicleId: string, imageUrl?: string): Promise<void> => {
    if (imageUrl) {
      try {
        const storageRef = ref(storage, imageUrl);
        await deleteObject(storageRef);
      } catch (storageError) {
        console.warn('Failed to delete vehicle image from Storage:', storageError);
      }
    }
    const docRef = doc(db, 'vehicles', vehicleId);
    await deleteDoc(docRef);
  },

  updateVehicleStatus: async (id: string, status: VehicleStatus): Promise<Vehicle> => {
    const docRef = doc(db, 'vehicles', id);
    await updateDoc(docRef, { status });
    const updated = await getDoc(docRef);
    return { id: updated.id, ...updated.data() } as Vehicle;
  },

  uploadVehicleImage: async (vehicleId: string, file: File): Promise<string> => {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `vehicles/${vehicleId}/${fileName}`);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);
    
    // Firestore'daki dökümanı güncelle
    const docRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(docRef, { imageUrl: downloadUrl });
    
    return downloadUrl;
  },

  // Helper for fetching transfer relations
  _populateTransfer: async (transferData: any): Promise<any> => {
    let vehicle = null;
    let driver = null;
    
    if (transferData.vehicle_id) {
      const vDoc = await getDoc(doc(db, 'vehicles', transferData.vehicle_id));
      if (vDoc.exists()) vehicle = { id: vDoc.id, ...vDoc.data() };
    }
    
    if (transferData.driver_id) {
      const dDoc = await getDoc(doc(db, 'users', transferData.driver_id));
      if (dDoc.exists()) driver = { id: dDoc.id, ...dDoc.data() };
    }
    
    return {
      ...transferData,
      vehicle,
      driver
    };
  },

  // --- TRANSFERS ---
  getTransfers: async (vendorId: string): Promise<Transfer[]> => {
    try {
      const q = query(collection(db, 'transfers'), where('vendor_id', '==', vendorId));
      const snapshot = await getDocs(q);
      const transfers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transfer));
      
      return Promise.all(transfers.map(t => api._populateTransfer(t)));
    } catch (error: any) {
      console.warn('DB Error (getTransfers):', error.message);
      return [];
    }
  },

  getDriverTransfers: async (driverId: string): Promise<Transfer[]> => {
    try {
      const q = query(collection(db, 'transfers'), where('driver_id', '==', driverId));
      const snapshot = await getDocs(q);
      const transfers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transfer));
      
      return Promise.all(transfers.map(t => api._populateTransfer(t)));
    } catch (error: any) {
      console.warn('DB Error (getDriverTransfers):', error.message);
      return [];
    }
  },

  getTransferByPnr: async (pnr: string, phone: string): Promise<{ transfer: Transfer, driver: User | null, vehicle: Vehicle | null } | null> => {
    try {
      const q = query(collection(db, 'transfers'), where('passenger_phone', '==', phone.trim()));
      const snapshot = await getDocs(q);
      
      const found = snapshot.docs.find(d => {
        const data = d.data();
        return data.pnr?.toLowerCase() === pnr.toLowerCase().trim();
      });

      if (!found) return null;

      const transferData = { id: found.id, ...found.data() } as Transfer;
      
      let vehicle = null;
      let driver = null;
      
      if (transferData.vehicle_id) {
        const vDoc = await getDoc(doc(db, 'vehicles', transferData.vehicle_id));
        if (vDoc.exists()) vehicle = { id: vDoc.id, ...vDoc.data() } as Vehicle;
      }
      
      if (transferData.driver_id) {
        const dDoc = await getDoc(doc(db, 'users', transferData.driver_id));
        if (dDoc.exists()) driver = { id: dDoc.id, ...dDoc.data() } as User;
      }
      
      return { 
        transfer: transferData,
        driver, 
        vehicle 
      };
    } catch (error) {
      console.warn('DB Error (getTransferByPnr):', error);
      return null;
    }
  },

  updateTransferStatus: async (id: string, status: TransferStatus): Promise<Transfer> => {
    const docRef = doc(db, 'transfers', id);
    await updateDoc(docRef, { status });
    const updated = await getDoc(docRef);
    return api._populateTransfer({ id: updated.id, ...updated.data() });
  },

  assignDriverAndVehicle: async (transferId: string, driverId: string, vehicleId: string): Promise<Transfer> => {
    const docRef = doc(db, 'transfers', transferId);
    await updateDoc(docRef, { driver_id: driverId, vehicle_id: vehicleId, status: 'DRIVER_ASSIGNED' });
    const updated = await getDoc(docRef);
    return api._populateTransfer({ id: updated.id, ...updated.data() });
  },

  toggleGuestNotification: async (transferId: string): Promise<Transfer> => {
    const docRef = doc(db, 'transfers', transferId);
    const current = await getDoc(docRef);
    if (!current.exists()) throw new Error("Transfer not found");

    const is_guest_notified = !current.data().is_guest_notified;
    await updateDoc(docRef, { is_guest_notified });
    
    const updated = await getDoc(docRef);
    return api._populateTransfer({ id: updated.id, ...updated.data() });
  },

  // --- DRIVERS ---
  getDrivers: async (vendorId: string): Promise<User[]> => {
    try {
      const q = query(collection(db, 'users'), where('vendor_id', '==', vendorId), where('role', '==', 'DRIVER'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error: any) {
      console.warn('DB Error (getDrivers):', error.message);
      return [];
    }
  },

  // --- ADMIN & SYSTEM STATS ---
  getVendors: async (): Promise<Vendor[]> => {
    try {
      const snapshot = await getDocs(collection(db, 'vendors'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor));
    } catch (error: any) {
      console.warn('DB Error (getVendors):', error.message);
      return [];
    }
  },

  addVendor: async (vendorData: Omit<Vendor, 'id' | 'created_at'>): Promise<Vendor> => {
    const newDoc = {
      ...vendorData,
      created_at: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'vendors'), newDoc);
    return { id: docRef.id, ...newDoc } as Vendor;
  },

  updateVendorStatus: async (id: string, is_active: boolean): Promise<Vendor> => {
    const docRef = doc(db, 'vendors', id);
    await updateDoc(docRef, { is_active });
    const updated = await getDoc(docRef);
    return { id: updated.id, ...updated.data() } as Vendor;
  },

  updateVendorMonetization: async (id: string, plan: MonetizationPlan): Promise<Vendor> => {
    const docRef = doc(db, 'vendors', id);
    await updateDoc(docRef, { monetization_plan: plan });
    const updated = await getDoc(docRef);
    return { id: updated.id, ...updated.data() } as Vendor;
  },

  getSystemStats: async () => {
    try {
      const vendorsSnap = await getDocs(query(collection(db, 'vendors'), where('is_active', '==', true)));
      const vehiclesSnap = await getDocs(query(collection(db, 'vehicles'), where('status', '==', 'ACTIVE')));
      const transfersSnap = await getDocs(collection(db, 'transfers'));

      const activeVendors = vendorsSnap.size;
      const activeVehicles = vehiclesSnap.size;
      const totalTransfers = transfersSnap.size;
      
      const totalRevenue = transfersSnap.docs.reduce((acc, doc) => {
        const data = doc.data();
        return acc + (data.commission_amount || 0);
      }, 0);

      return {
        totalRevenue,
        totalTransfers,
        activeVendors,
        activeVehicles
      };
    } catch (error) {
      console.warn('DB Error (getSystemStats):', error);
      return { totalRevenue: 0, totalTransfers: 0, activeVendors: 0, activeVehicles: 0 };
    }
  },

  // --- AUTHENTICATION ---
  signInWithPhone: async (phoneNumber: string, recaptchaVerifier: any): Promise<any> => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return confirmationResult;
    } catch (error: any) {
      console.error('signInWithPhone error:', error);
      throw error;
    }
  },

  verifyOtpCode: async (confirmationResult: any, code: string): Promise<User | null> => {
    try {
      if (confirmationResult && confirmationResult.isSimulated) {
        const phone = confirmationResult.phoneNumber;
        const q = query(collection(db, 'users'), where('phone', '==', phone));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0];
          return { id: docData.id, ...docData.data() } as User;
        }
        return null;
      }

      const userCredential = await confirmationResult.confirm(code);
      const authUser = userCredential.user;
      
      if (!authUser) return null;

      // 1. Query by Auth UID (Primary key match)
      const userDocRef = doc(db, 'users', authUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }

      // 2. Query by Phone Number (Fallback check)
      const phone = authUser.phoneNumber;
      if (phone) {
        const q = query(collection(db, 'users'), where('phone', '==', phone));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0];
          return { id: docData.id, ...docData.data() } as User;
        }
      }

      return null;
    } catch (error: any) {
      console.error('verifyOtpCode error:', error);
      throw error;
    }
  },

  createUserProfile: async (id: string, userData: Omit<User, 'id' | 'created_at'>): Promise<User> => {
    try {
      const newDoc = {
        id,
        ...userData,
        is_active: true,
        created_at: new Date().toISOString()
      };
      const docRef = doc(db, 'users', id);
      await setDoc(docRef, newDoc);
      return newDoc as User;
    } catch (error: any) {
      console.error('createUserProfile error:', error);
      throw error;
    }
  }
};
