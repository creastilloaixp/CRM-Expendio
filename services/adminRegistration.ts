import { supabase } from './supabaseClient';
import { api } from './useApi';

export const adminRegistration = {
  // Register a new admin user using Supabase Auth
  async registerAdmin(email: string, password: string) {
    try {
      // First, check if the user already exists
      const { data: existingUser, error: checkError } = await supabase.auth.admin.getUserById(email);
      
      if (existingUser && !checkError) {
        return { data: null, error: 'El usuario ya existe', ms: 0 };
      }

      // Create new admin user
      const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto-confirm the email for admin users
        user_metadata: {
          role: 'admin',
          created_at: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Admin registration failed:', error.message);
        return { data: null, error: error.message, ms: 0 };
      }

      return { data: { success: true, user: data.user }, error: null, ms: 0 };
    } catch (error) {
      console.error('Admin registration exception:', error);
      return { data: null, error: 'Error al crear el administrador', ms: 0 };
    }
  },

  // Alternative method: Use a simple password-based system for initial setup
  async setupInitialAdmin(email: string, password: string) {
    try {
      // Store admin credentials in a secure way (you might want to use environment variables)
      // For now, we'll use a simple approach that stores in localStorage for development
      if (process.env.NODE_ENV === 'development') {
        const adminCredentials = {
          email: email,
          password: password, // In production, this should be hashed
          createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('expendio_admin_credentials', JSON.stringify(adminCredentials));
        return { data: { success: true }, error: null, ms: 0 };
      }
      
      // For production, try to create the user in Supabase
      return await this.registerAdmin(email, password);
    } catch (error) {
      console.error('Initial admin setup exception:', error);
      return { data: null, error: 'Error en la configuración inicial', ms: 0 };
    }
  }
};