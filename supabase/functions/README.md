# Supabase Edge Functions

## Gemini Proxy - Protección de API Key

Esta función protege la API Key de Gemini AI evitando que se exponga en el código del cliente.

### Deployment

1. **Instalar Supabase CLI**:
```bash
npm install -g supabase
```

2. **Login a Supabase**:
```bash
supabase login
```

3. **Link al proyecto**:
```bash
supabase link --project-ref fdinliimdxkkgyqvadvq
```

4. **Configurar secrets (API Key)**:
```bash
supabase secrets set GEMINI_API_KEY=AIzaSyBkb1rbgmWL6mv8i352ZzhwOKq-XfrOyP8
```

5. **Deploy la función**:
```bash
supabase functions deploy gemini-proxy
```

6. **Verificar que funciona**:
```bash
curl -i --location --request POST \
  'https://fdinliimdxkkgyqvadvq.supabase.co/functions/v1/gemini-proxy' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"prompt":"Di hola","model":"gemini-2.0-flash-exp"}'
```

### Configuración en la App

Una vez deployada, la app automáticamente usará el proxy en producción.

Para forzar el uso del proxy en desarrollo, agrega a `.env.local`:
```bash
VITE_USE_GEMINI_PROXY=true
```

### Seguridad

✅ **API Key segura**: Nunca se expone en el cliente
✅ **Autenticación**: Solo usuarios autenticados pueden usar la función
✅ **CORS configurado**: Acepta requests desde cualquier origen (ajustar si es necesario)

### Costos

- Supabase Edge Functions: Primeras 500K requests/mes gratis
- Gemini API: Según tu plan de Google

### Troubleshooting

Si obtienes error 401:
- Verifica que el usuario esté autenticado
- Verifica que el token de autorización sea correcto

Si obtienes error 500:
- Revisa los logs: `supabase functions logs gemini-proxy`
- Verifica que GEMINI_API_KEY esté configurado correctamente

### Migración Gradual

Por defecto:
- **Desarrollo**: Usa API directa (geminiService.ts)
- **Producción**: Usa proxy seguro (geminiServiceSecure.ts)

Para migrar completamente, reemplaza los imports en los componentes:
```typescript
// ANTES
import { getInsights } from '../services/geminiService';

// DESPUÉS
import { getInsightsSecure as getInsights } from '../services/geminiServiceSecure';
```
