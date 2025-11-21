# ✅ Checklist de Verificación - Gemini Proxy

## 🎯 Estado Actual

### ✅ Completado
- [x] API Key regenerada: `AIzaSyC-1mSJ9WBXiRRNOwWjRYVIBq4M5BK-KIw`
- [x] `.env.local` actualizado con nueva key
- [x] Secret `GEMINI_API_KEY` actualizado en Supabase
- [x] `VITE_USE_GEMINI_PROXY=true` activado
- [x] Edge Function `gemini-proxy` deployada en Supabase

---

## 🧪 Tests a Realizar

### Test 1: Verificar Edge Function desde Navegador

1. **Abre en tu navegador**: `test-gemini-proxy.html`
2. **Click en**: "🚀 Probar Proxy"
3. **Resultado esperado**:
   ```
   ✅ ¡Éxito! La Edge Function funciona correctamente.

   Respuesta de Gemini:
   PROXY FUNCIONANDO CORRECTAMENTE con la nueva API Key
   ```

**Si falla**, verifica:
- Que el secret en Supabase sea exactamente: `GEMINI_API_KEY`
- Que el valor sea la nueva key: `AIzaSyC-1mSJ9WBXiRRNOwWjRYVIBq4M5BK-KIw`
- Que la Edge Function esté deployada y activa

---

### Test 2: Probar IA en la App (Desarrollo)

#### 2.1 Global AI Assistant (Dashboard)
1. Abre: `http://localhost:5178/`
2. Login con tus credenciales
3. Ve al Dashboard
4. Click en "🤖 AI Assistant"
5. Pregunta: "¿Cuál es el estado actual del restaurante?"
6. **Resultado esperado**: Respuesta con análisis de mesas, reservas, etc.

#### 2.2 Chatbot Inteligente
1. En el menú, click en "Chatbot"
2. Pregunta: "¿Qué cervezas artesanales tienen?"
3. **Resultado esperado**: Lista de cervezas (IPA, Stout, Lager, etc.)

#### 2.3 AI Insights en Analytics
1. Ve a "Análisis"
2. Scroll hasta "Asistente de IA"
3. Pregunta: "¿Cuáles son las tendencias de ventas?"
4. **Resultado esperado**: Análisis basado en las visitas

#### 2.4 Cliente Insights (CRM)
1. Ve a "Clientes"
2. Click en cualquier cliente con visitas
3. En el detalle, busca "AI Insights"
4. Click en "Generar Análisis"
5. **Resultado esperado**: Perfil del cliente, patrones, recomendaciones

---

### Test 3: Verificar Logs en Supabase

1. Ve a: https://supabase.com/dashboard
2. Edge Functions → `gemini-proxy`
3. Pestaña "Logs"
4. **Deberías ver**:
   - Requests exitosos (status 200)
   - Sin errores de API Key
   - Sin errores de "Server configuration error"

---

## 🔒 Seguridad Verificada

### ✅ Antes (INSEGURO)
```javascript
// La API Key estaba expuesta en el código del cliente
const ai = new GoogleGenerativeAI('AIzaSyBkb1rbgmWL6mv8i352ZzhwOKq-XfrOyP8')
```
❌ Cualquiera podía ver la key en DevTools
❌ Uso no autorizado
❌ Costos inesperados

### ✅ Ahora (SEGURO)
```javascript
// La app llama al proxy de Supabase
const response = await fetch('https://fdinliimdxkkgyqvadvq.supabase.co/functions/v1/gemini-proxy', {
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ prompt })
})
```
✅ API Key solo en servidor
✅ Requiere autenticación
✅ Protegido contra abuso

---

## 📊 Comportamiento Esperado

### En Desarrollo (Local)
- `VITE_USE_GEMINI_PROXY=true` está activado
- **Usa el proxy de Supabase** (seguro, pero más lento por network)
- Útil para testear el proxy antes de producción

### En Producción
- Detecta automáticamente `import.meta.env.PROD === true`
- **Siempre usa el proxy** (no hay opción)
- Máxima seguridad

---

## 🎯 Próximos Pasos

### Si todo funciona ✅
1. **Elimina la API Key antigua** de todos los archivos de documentación
2. **No commits** la nueva key al repositorio público
3. Considera agregar `.env.local` al `.gitignore` (si no está ya)

### Si algo falla ❌
1. Revisa los logs en Supabase Dashboard
2. Verifica que el secret esté configurado correctamente
3. Prueba con `test-gemini-proxy.html` primero
4. Si persiste, usa la API directa temporalmente:
   ```bash
   # En .env.local
   VITE_USE_GEMINI_PROXY=false
   ```

---

## 📝 Notas Importantes

### Costos
- **Supabase Edge Functions**: 500K requests/mes gratis
- **Gemini API**: `gemini-2.0-flash-exp` es muy económico
- Cada request de IA cuenta como 1 invocación a la Edge Function

### Rate Limiting
- Supabase maneja automáticamente los límites
- Si llegas al límite, upgrade al plan Pro

### Monitoreo
- Revisa periódicamente los logs en Supabase
- Monitorea el uso en Google AI Studio: https://makersuite.google.com/app/usage

---

## ✅ Checklist Final

- [ ] Test 1: `test-gemini-proxy.html` funciona ✅
- [ ] Test 2.1: Global AI Assistant responde correctamente
- [ ] Test 2.2: Chatbot responde correctamente
- [ ] Test 2.3: Analytics AI funciona
- [ ] Test 2.4: Cliente Insights funciona
- [ ] Test 3: Logs en Supabase sin errores
- [ ] API Key antigua eliminada de archivos públicos
- [ ] `.env.local` en `.gitignore`

---

**Una vez completado este checklist, tu API Key estará completamente protegida y funcionando en producción.** 🎉
