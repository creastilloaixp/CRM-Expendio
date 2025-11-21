# Deploy a Vercel - Guía Paso a Paso

## Paso 1: Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre del repositorio: `expendio-crm` (o el que prefieras)
3. Déjalo como **Privado** (contiene API keys en archivos de prueba)
4. **NO** inicialices con README ni .gitignore
5. Click "Create repository"

## Paso 2: Inicializar Git localmente

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
cd "C:\Users\carlo\OneDrive\Escritorio\CRM Expendio Oficial"

# Inicializar git
git init

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "Initial commit: Expendio CRM"

# Conectar con GitHub (reemplaza TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/expendio-crm.git

# Subir a GitHub
git branch -M main
git push -u origin main
```

## Paso 3: Deploy en Vercel

### Opción A: Desde la Web (Recomendado)

1. Ve a https://vercel.com
2. Login con tu cuenta de GitHub
3. Click "Add New" → "Project"
4. Selecciona el repositorio `expendio-crm`
5. Vercel detectará automáticamente que es Vite
6. **IMPORTANTE**: Configura las variables de entorno antes de deploy:

### Variables de Entorno en Vercel

En la pantalla de configuración del proyecto, ve a "Environment Variables" y agrega:

| Variable | Valor |
|----------|-------|
| `SUPABASE_URL` | `https://fdinliimdxkkgyqvadvq.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkaW5saWltZHhra2d5cXZhZHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5ODU2OTEsImV4cCI6MjA3ODU2MTY5MX0.DTGFOkW-yApktMevqgMwvp9TbVjxf2chEGg4rkMeXfQ` |
| `GEMINI_API_KEY` | Tu API key de Gemini (la nueva) |
| `ADMIN_EMAIL` | `creastilloaixperience@gmail.com` |
| `VITE_SUPABASE_URL` | `https://fdinliimdxkkgyqvadvq.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | (mismo que SUPABASE_ANON_KEY) |
| `VITE_USE_GEMINI_PROXY` | `true` |

7. Click "Deploy"

### Opción B: Desde CLI

```powershell
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Seguir las instrucciones interactivas
```

## Paso 4: Configurar dominio personalizado (Opcional)

1. En Vercel Dashboard → Tu proyecto → Settings → Domains
2. Agrega tu dominio personalizado
3. Sigue las instrucciones para configurar DNS

## Verificación post-deploy

1. ✅ La app carga correctamente
2. ✅ Puedes hacer login
3. ✅ Las mesas aparecen
4. ✅ El chatbot funciona (usa el proxy de Supabase)
5. ✅ PWA es instalable (aparece opción "Instalar app")

## Troubleshooting

### Error: Variables de entorno no disponibles
- Verifica que las variables estén configuradas en Vercel
- Las variables `VITE_*` son las que usa el cliente

### Error: API de Gemini no funciona
- Verifica que `VITE_USE_GEMINI_PROXY=true`
- Verifica que la Edge Function `gemini-proxy` esté deployada en Supabase

### Error: Supabase no conecta
- Verifica que las URLs y keys sean correctas
- Verifica que el proyecto de Supabase esté activo

## URLs importantes

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **GitHub**: https://github.com

---

Una vez deployado, tu app estará disponible en:
`https://expendio-crm.vercel.app` (o el nombre que Vercel asigne)
