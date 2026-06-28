-- ENUMS
CREATE TYPE monetization_plan AS ENUM ('SUBSCRIPTION', 'COMMISSION', 'MIXED');
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'VENDOR_ADMIN', 'DRIVER');
CREATE TYPE vehicle_status AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE');
CREATE TYPE vehicle_class AS ENUM ('SEDAN', 'MINIVAN', 'VIP_VAN', 'MINIBUS');
CREATE TYPE transfer_status AS ENUM ('PENDING', 'DRIVER_ASSIGNED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');

-- VENDORS TABLE
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  monetization_plan monetization_plan NOT NULL,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  commission_rate DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VEHICLES TABLE
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  plate_number VARCHAR(50) NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  class vehicle_class NOT NULL,
  capacity INTEGER NOT NULL,
  features TEXT[] DEFAULT '{}',
  status vehicle_status DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TRANSFERS TABLE
CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  pnr VARCHAR(50) NOT NULL,
  passenger_name VARCHAR(255) NOT NULL,
  passenger_phone VARCHAR(50) NOT NULL,
  passenger_count INTEGER NOT NULL,
  pickup_location VARCHAR(255) NOT NULL,
  dropoff_location VARCHAR(255) NOT NULL,
  pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
  flight_number VARCHAR(50),
  status transfer_status DEFAULT 'PENDING',
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_guest_notified BOOLEAN DEFAULT false,
  price DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - Optional but recommended
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Creating some basic open policies for the preview (In production, replace these with auth.uid() checks)
CREATE POLICY "Enable read access for all users" ON vendors FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON vendors FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON vendors FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON vendors FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON users FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON users FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON vehicles FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON vehicles FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON transfers FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON transfers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON transfers FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON transfers FOR DELETE USING (true);
