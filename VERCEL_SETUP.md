# Configuración de Vercel - Expendio CRM

## 🚀 URL de Producción
**https://crm-expendio-oficial.vercel.app/**

---

## ⚙️ Variables de Entorno Requeridas

Para que la aplicación funcione correctamente en Vercel, debes configurar las siguientes variables de entorno:

### 1. Ir a Configuración de Vercel

1. Ve a: https://vercel.com/
2. Busca tu proyecto: **crm-expendio-oficial**
3. Click en **Settings**
4. Click en **Environment Variables** (en el menú lateral)

### 2. Agregar Variables

Agrega las siguientes variables **una por una**:

#### GEMINI_API_KEY
```
Nombre: GEMINI_API_KEY
Valor: AIzaSyBkb1rbgmWL6mv8i352ZzhwOKq-XfrOyP8
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### API_KEY (alias para Gemini)
```
Nombre: API_KEY
Valor: AIzaSyBkb1rbgmWL6mv8i352ZzhwOKq-XfrOyP8
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### SUPABASE_URL
```
Nombre: SUPABASE_URL
Valor: https://fdinliimdxkkgyqvadvq.supabase.co
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### SUPABASE_ANON_KEY
```
Nombre: SUPABASE_ANON_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkaW5saWltZHhra2d5cXZhZHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5ODU2OTEsImV4cCI6MjA3ODU2MTY5MX0.DTGFOkW-yApktMevqgMwvp9TbVjxf2chEGg4rkMeXfQ
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### ADMIN_EMAIL
```
Nombre: ADMIN_EMAIL
Valor: creastilloaixperience@gmail.com
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### USE_MOCK
```
Nombre: USE_MOCK
Valor: false
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### 3. Guardar y Redeploy

Después de agregar todas las variables:

1. Click en **Save**
2. Ve a la pestaña **Deployments**
3. Click en los **3 puntos (•••)** del último deployment
4. Click en **Redeploy**
5. Confirma el redeploy

---

## 🐛 Problemas Resueltos

### Error 503: "The model is overloaded"
**Causa**: Modelo de Gemini incorrecto (`gemini-2.5-flash` no existe)
**Solución**: ✅ Cambiado a `gemini-1.5-flash` en el código

### Error 404: index.css not found
**Causa**: Build de producción no incluye CSS correctamente
**Solución**: Vercel maneja automáticamente el build de Vite, debería resolverse con redeploy

### Error: "Failed to load resource"
**Causa**: Variables de entorno no configuradas
**Solución**: Configurar las 6 variables listadas arriba

---

## ✅ Verificación Post-Deploy

Después del redeploy, verifica:

### 1. Dashboard (Staff)
- URL: https://crm-expendio-oficial.vercel.app/#/dashboard
- ✅ Login debe funcionar
- ✅ Ver mesas
- ✅ Sin errores en consola

### 2. Check-In (Cliente)
- URL: https://crm-expendio-oficial.vercel.app/#/checkin?mesa=A1
- ✅ Onboarding debe mostrarse
- ✅ Formulario debe funcionar
- ✅ Registro exitoso

### 3. Analytics (con IA)
- URL: https://crm-expendio-oficial.vercel.app/#/analytics
- ✅ AI Assistant debe cargar
- ✅ Sin error 503
- ✅ Respuestas en español

---

## 🔧 Comandos Útiles de Vercel CLI (Opcional)

Si tienes Vercel CLI instalado:

```bash
# Ver variables de entorno
vercel env ls

# Agregar variable
vercel env add GEMINI_API_KEY

# Pull latest deployment
vercel pull

# Deploy manual
vercel --prod
```

---

## 📝 Notas Importantes

1. **API Key de Gemini**: Es una API key real y funcional. Protégela.
2. **Supabase Keys**: Son las keys de producción. No las compartas públicamente.
3. **Redeploy**: Siempre que cambies variables de entorno, haz redeploy.
4. **Cache**: Vercel cachea agresivamente. Si no ves cambios, hard refresh (Ctrl+Shift+R).

---

## 🆘 Troubleshooting

### Variables no se aplican después de agregarlas
**Solución**: Asegúrate de hacer **Redeploy** después de agregar variables.

### Error: "process.env.API_KEY is undefined"
**Solución**:
1. Verifica que agregaste `API_KEY` (no solo `GEMINI_API_KEY`)
2. Haz redeploy

### CSS no carga (404)
**Solución**:
1. Verifica que `vite.config.ts` tiene la configuración correcta
2. Haz rebuild local: `npm run build`
3. Redeploy a Vercel

### AI sigue sin funcionar después de arreglos
**Solución**:
1. Hard refresh en el navegador (Ctrl+Shift+R)
2. Espera 2-3 minutos (API de Gemini puede estar temporalmente saturada)
3. Intenta de nuevo

---

## ✅ Checklist Final

- [ ] 6 variables de entorno configuradas en Vercel
- [ ] Redeploy ejecutado
- [ ] Login funciona en producción
- [ ] Check-in funciona en producción
- [ ] Analytics sin errores 503
- [ ] CSS carga correctamente
- [ ] Usuario admin creado en Supabase

---

**Última actualización**: 20/11/2025
**Mantenedor**: Equipo Expendio
