# Configuración de WhatsApp con Meta Cloud API

## Paso 1: Crear App de Meta

1. Ve a https://developers.facebook.com/apps/
2. Clic en **"Create App"**
3. Selecciona **"Business"** como tipo de app
4. Dale un nombre (ej: "Expendio CRM WhatsApp")
5. Agrega tu correo de contacto

## Paso 2: Configurar WhatsApp

1. En el dashboard de tu app, busca **"WhatsApp"** en productos
2. Clic en **"Set Up"**
3. Selecciona tu Business Account (o crea uno nuevo)

## Paso 3: Obtener credenciales

### Access Token (Temporal - para pruebas)
1. En WhatsApp → API Setup
2. Copia el **"Temporary access token"**
3. Guárdalo para agregarlo a Vercel

### Phone Number ID
1. En la sección **"Phone Numbers"**
2. Copia el **"Phone number ID"** (NOT the phone number itself)
3. Ejemplo: `123456789012345`

### Business Account ID
1. En WhatsApp → Getting Started
2. Busca **"WhatsApp Business Account ID"**

## Paso 4: Configurar en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega estas variables:

```
META_WHATSAPP_ACCESS_TOKEN=tu_access_token
META_WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
META_WHATSAPP_BUSINESS_ACCOUNT_ID=tu_business_account_id
```

4. Haz un nuevo deploy o espera a que se despliegue automáticamente

## Paso 5: Configurar Webhook (para recibir mensajes)

1. En WhatsApp → Configuration
2. En **"Webhook"**, clic en **"Edit"**
3. Callback URL: `https://crm-expendio-oficial.vercel.app/api/whatsapp-webhook`
4. Verify Token: `expendio_webhook_2024` (usa el mismo que configuraste en .env)
5. Webhook fields: Marca **"messages"**

## Paso 6: Agregar números de prueba

1. En WhatsApp → API Setup
2. En **"To"**, agrega tu número de WhatsApp personal
3. Te llegará un código por WhatsApp, confírmalo

## Paso 7: Probar

1. Gana un premio en la ruleta
2. Deberías recibir un mensaje de WhatsApp automáticamente
3. Responde al mensaje para probar el agente

## Notas Importantes

- **Access Token Temporal**: Solo dura 24 horas. Para producción, necesitas generar un **Permanent Token**
- **Verificación de negocio**: Para usar en producción con clientes reales, Meta requiere verificar tu negocio
- **Límites gratuitos**: 1,000 conversaciones/mes gratis (Una conversación = 24 horas de chat con un usuario)

## Generar Permanent Access Token

1. Ve a Business Settings → System Users
2. Crea un System User
3. Asigna permisos de WhatsApp
4. Genera Access Token permanente
5. Reemplaza en Vercel environment variables
