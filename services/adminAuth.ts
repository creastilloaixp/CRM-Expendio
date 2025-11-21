import { supabase } from './supabaseClient';
import { api } from './useApi';

export const adminAuth = {
  // Admin authentication with Supabase Auth (uses bcrypt internally)
  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error('Admin auth failed:', error.message);
        return { data: null, error: 'Credenciales incorrectas', ms: 0 };
      }

      return { data: { success: true, user: data.user }, error: null, ms: 0 };
    } catch (error) {
      console.error('Admin auth exception:', error);
      return { data: null, error: 'Error de autenticación', ms: 0 };
    }
  },

  async logout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log('Logout error:', error);
    }
  },

  isAuthenticated() {
    return supabase.auth.getUser() !== null;
  }
};