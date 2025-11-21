# Setup Guide for CRM Expendio Oficial

## Problem Identified
The application cannot register data in Supabase because:
1. **RPC Functions are missing**: `liberar_mesa` and `crear_reserva` functions don't exist
2. **RLS Policies are missing**: No Row Level Security policies configured
3. **No test data**: Tables are empty

## Solution Steps

### Step 1: Access Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project: `fdinliimdxkkgyqvadvq`
3. Navigate to **SQL Editor** from the left sidebar

### Step 2: Execute Setup Script
1. Copy the contents of `sql/complete_setup.sql`
2. Paste it in the SQL Editor
3. Click **Run** to execute all commands

### Step 3: Verify Setup
After running the script, you can verify by:
1. Going to **Table Editor** in Supabase
2. Check that you have data in the `mesas` table (8 mesas should appear)
3. Check that RPC functions were created in **Database > Functions**

## What the Script Does

### 1. Creates RPC Functions
- **`liberar_mesa`**: Ends a visit and updates table status
- **`crear_reserva`**: Creates a reservation with client and updates table status

### 2. Sets up RLS Policies
- Allows authenticated users to read/write all tables
- Enables proper permissions for the application

### 3. Inserts Seed Data
- 8 sample mesas with different capacities
- 3 sample clients
- 1 active visit for testing

## Files Created
- `sql/complete_setup.sql` - Complete setup script
- `sql/create_liberar_mesa_function.sql` - Individual function
- `sql/create_crear_reserva_function.sql` - Individual function
- `sql/create_rls_policies.sql` - RLS policies only
- `sql/seed_data.sql` - Test data only

## Next Steps
After running the setup script:
1. Restart your development server
2. Test the application locally
3. Deploy to Vercel if working correctly
4. The data registration should now work properly