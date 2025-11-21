# Security Setup Guide - Expendio CRM

## Admin User Setup

The application now uses **secure authentication** with Supabase Auth, which automatically handles password hashing using **bcrypt**.

### Changes Made

✅ **Removed hardcoded passwords** - No more '1234' password in code
✅ **Eliminated password hints** - Login screen no longer shows password hints
✅ **Removed anonymous fallback** - Failed logins now properly reject access
✅ **Proper error handling** - Authentication errors are logged and returned correctly
✅ **Environment-based config** - Admin email can be configured via `.env.local`

### Setup Instructions

#### 1. Create Admin User in Supabase

Go to your Supabase Dashboard:

1. Navigate to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Fill in:
   - **Email**: `admin@expendio.com` (or your custom email)
   - **Password**: Choose a **strong password** (minimum 8 characters)
   - **Auto Confirm User**: ✅ Enable this (skip email confirmation)
4. Click **Create user**

#### 2. Verify User Creation

Run this query in Supabase SQL Editor to verify:

```sql
SELECT id, email, created_at, confirmed_at
FROM auth.users
WHERE email = 'admin@expendio.com';
```

You should see your admin user with a `confirmed_at` timestamp.

#### 3. Update Environment Variables (Optional)

If you used a different email, update `.env.local`:

```env
ADMIN_EMAIL=your-custom-email@expendio.com
```

The default is `admin@expendio.com` if not specified.

#### 4. Test Login

1. Start the development server: `npm run dev`
2. Navigate to the dashboard
3. Enter your admin credentials
4. You should be logged in successfully

### Password Requirements

- **Minimum length**: 8 characters
- **Recommended**: Use a mix of uppercase, lowercase, numbers, and symbols
- **Never reuse** passwords from other services
- **Store securely**: Use a password manager

### Security Features

| Feature | Implementation |
|---------|----------------|
| Password Hashing | Bcrypt (handled by Supabase Auth) |
| Password Storage | Never stored in code or config files |
| Session Management | Secure JWT tokens via Supabase |
| Login Attempts | Rate-limited by Supabase (max 5/hour by default) |
| Password Reset | Available through Supabase Auth UI |

### Troubleshooting

#### "Credenciales incorrectas" Error

- Verify the user exists in Supabase Dashboard
- Check that the password is correct
- Ensure the user is confirmed (`confirmed_at` is not null)
- Check browser console for detailed error messages

#### User Not Found

If you get authentication errors, create the user following Step 1 above.

#### Mock Mode

In development mode with `USE_MOCK=true`, the system accepts **any non-empty password** for testing. This is only for development and is **disabled in production**.

### For Production Deployment

1. **Create a strong admin password** (16+ characters recommended)
2. **Enable 2FA** in Supabase for the admin user (if available)
3. **Set USE_MOCK=false** in production environment
4. **Never commit** `.env.local` or passwords to version control
5. **Rotate passwords** regularly (every 90 days recommended)
6. **Monitor login attempts** via Supabase logs

### Additional Security Recommendations

- [ ] Enable rate limiting on login endpoint
- [ ] Add IP whitelist for admin access (if static IP available)
- [ ] Set up email alerts for failed login attempts
- [ ] Implement session timeout (auto-logout after inactivity)
- [ ] Add audit logging for admin actions
- [ ] Consider adding role-based access control (RBAC) for multiple staff members

---

**Last Updated**: November 2025
**Security Review**: Recommended every 6 months
