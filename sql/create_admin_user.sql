-- =====================================================
-- Create Admin User for Expendio CRM
-- =====================================================
-- This script creates an admin user in Supabase Auth
-- Supabase automatically handles password hashing with bcrypt
--
-- IMPORTANT: Replace 'YOUR_SECURE_PASSWORD_HERE' with a strong password
-- =====================================================

-- Note: This is a SQL comment to execute in Supabase Dashboard
-- Go to: Authentication > Users > Add User (manually)
-- Or use the Supabase CLI/API to create the user

-- User Details:
-- Email: admin@expendio.com
-- Password: [Set a secure password - min 8 characters]
-- Email Confirm: Yes (mark as confirmed)
--
-- After creating the user, update your .env.local file with:
-- ADMIN_EMAIL=admin@expendio.com
-- ADMIN_PASSWORD=[your secure password]

-- =====================================================
-- Alternative: Create user via SQL (if using Supabase CLI)
-- =====================================================
-- Note: This approach is NOT recommended as it requires direct database access
-- and Supabase Auth should be used instead.
--
-- For production, create the user through:
-- 1. Supabase Dashboard UI (recommended)
-- 2. Supabase Management API
-- 3. Supabase CLI: supabase users create
-- =====================================================

-- Verification query (run after creating user):
-- SELECT id, email, created_at FROM auth.users WHERE email = 'admin@expendio.com';
