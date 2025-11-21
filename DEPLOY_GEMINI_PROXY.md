# 🚀 Deploy de Gemini Proxy - Guía Paso a Paso

## Opción 1: Deploy Manual desde Supabase Dashboard (RECOMENDADO - Más fácil)

### Paso 1: Ir a Supabase Dashboard

1. Abre tu navegador y ve a: https://supabase.com/dashboard
2. Login con tu cuenta
3. Selecciona tu proyecto: `fdinliimdxkkgyqvadvq`

### Paso 2: Crear Edge Function

1. En el menú lateral, click en **"Edge Functions"**
2. Click en **"Create a new function"**
3. Nombre de la función: `gemini-proxy`
4. Click **"Create function"**

### Paso 3: Copiar el Código

1. Una vez creada la función, verás un editor de código
2. **BORRA** todo el código que viene por defecto
3. **COPIA Y PEGA** el siguiente código completo:

```typescript
// Supabase Edge Function para proteger API Key de Gemini
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.24.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar que la request viene de un usuario autenticado
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener API key desde variables de entorno (segura en el servidor)
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { prompt, systemInstruction, model = 'gemini-2.0-flash-exp' } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Llamar a Gemini API de forma segura
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const geminiModel = genAI.getGenerativeModel({
      model,
      ...(systemInstruction && { systemInstruction })
    })

    const result = await geminiModel.generateContent(prompt)
    const response = result.response
    const text = response.text()

    return new Response(
      JSON.stringify({ text }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error calling Gemini API:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

4. Click **"Save"** o **"Deploy"**

### Paso 4: Configurar Secret (API Key)

1. En el menú lateral de Supabase, ve a **"Settings"** (ícono de engranaje)
2. Click en **"Edge Functions"** en el menú de configuración
3. Busca la sección **"Secrets"** o **"Environment Variables"**
4. Click en **"Add new secret"**
5. Nombre: `GEMINI_API_KEY`
6. Valor: `[TU_NUEVA_API_KEY_DE_GEMINI]` (la que configuraste)
7. Click **"Save"** o **"Add"**

### Paso 5: Verificar que Funciona

1. En Edge Functions, busca tu función `gemini-proxy`
2. Debería mostrar estado: **"Deployed"** o **"Active"**
3. Copia la URL de la función (algo como):
   ```
   https://fdinliimdxkkgyqvadvq.supabase.co/functions/v1/gemini-proxy
   ```

### Paso 6: Test Manual (Opcional)

Abre Postman o usa curl para probar:

```bash
curl -i --location --request POST \
  'https://fdinliimdxkkgyqvadvq.supabase.co/functions/v1/gemini-proxy' \
  --header 'Authorization: Bearer TU_ANON_KEY_AQUI' \
  --header 'Content-Type: application/json' \
  --data '{
    "prompt": "Di hola",
    "model": "gemini-2.0-flash-exp"
  }'
```

Reemplaza `TU_ANON_KEY_AQUI` con tu Supabase Anon Key:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkaW5saWltZHhra2d5cXZhZHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5ODU2OTEsImV4cCI6MjA3ODU2MTY5MX0.DTGFOkW-yApktMevqgMwvp9TbVjxf2chEGg4rkMeXfQ
```

**Respuesta esperada:**
```json
{
  "text": "¡Hola! ¿En qué puedo ayudarte hoy?"
}
```

---

## Opción 2: Deploy con Supabase CLI (Requiere instalación)

### Instalar Supabase CLI

**Windows (PowerShell como Administrador):**
```powershell
# Instalar Scoop primero
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Luego instalar Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Mac/Linux:**
```bash
brew install supabase/tap/supabase
```

### Comandos para Deploy

```bash
# Login
supabase login

# Link al proyecto
supabase link --project-ref fdinliimdxkkgyqvadvq

# Configurar secret
supabase secrets set GEMINI_API_KEY=[TU_NUEVA_API_KEY_DE_GEMINI]

# Deploy
supabase functions deploy gemini-proxy
```

---

## 🎯 Después del Deploy

### Activar en la App

Una vez deployada la función, la app automáticamente usará el proxy en producción.

Para forzar el uso del proxy en desarrollo local, agrega a `.env.local`:
```bash
VITE_USE_GEMINI_PROXY=true
```

### Variables de Entorno para Producción (Vercel/Netlify)

Cuando despliegues la app, asegúrate de agregar:
```bash
VITE_SUPABASE_URL=https://fdinliimdxkkgyqvadvq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkaW5saWltZHhra2d5cXZhZHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5ODU2OTEsImV4cCI6MjA3ODU2MTY5MX0.DTGFOkW-yApktMevqgMwvp9TbVjxf2chEGg4rkMeXfQ
```

---

## 🔒 Seguridad

✅ **API Key protegida**: Nunca se expone en el cliente
✅ **Autenticación requerida**: Solo usuarios autenticados pueden usar la función
✅ **CORS configurado**: Acepta requests desde cualquier origen
✅ **Rate limiting**: Supabase maneja límites automáticamente

---

## 💰 Costos

- **Supabase Edge Functions**: Primeras 500,000 requests/mes GRATIS
- **Gemini API**: Según tu plan de Google (gemini-2.0-flash-exp es muy económico)

---

## ❓ Troubleshooting

### Error 401: Unauthorized
- Verifica que el usuario esté autenticado en la app
- Verifica que el Authorization header sea correcto

### Error 500: Server configuration error
- Verifica que GEMINI_API_KEY esté configurado en Secrets de Supabase
- Verifica que el nombre del secret sea exactamente: `GEMINI_API_KEY`

### La función no aparece en el dashboard
- Espera 1-2 minutos después de crear la función
- Recarga la página del dashboard
- Verifica que el código no tenga errores de sintaxis

### Ver logs de la función
1. En Supabase Dashboard → Edge Functions
2. Click en `gemini-proxy`
3. Ve a la pestaña "Logs"
4. Verás todos los requests y errores en tiempo real

---

## ✅ Checklist Final

- [ ] Edge Function `gemini-proxy` creada en Supabase
- [ ] Código copiado correctamente
- [ ] Secret `GEMINI_API_KEY` configurado
- [ ] Función con estado "Deployed"
- [ ] Test manual con curl exitoso
- [ ] App en producción usando el proxy
- [ ] REGENERAR la API Key original de Gemini en Google Cloud Console (la anterior quedó expuesta)

---

**¡Listo!** Tu API Key ahora está protegida y solo se usa desde el servidor de Supabase.
