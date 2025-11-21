import React, { useState, useEffect } from 'react';
import { getCurrentUser, getClienteByEmail, getClienteByTelefono, registerClienteDirect, startVisit, getMesaByNombre, getMesas, createClientSession, getClientePuntos } from '../services/api';
import { Card } from './common/Card';
import { Input } from './common/Input';
import { Button } from './common/Button';
import Onboarding from './Onboarding';
import PrizeModal from './PrizeModal';

interface CheckInProps {
  mesaName: string | null;
}

type CheckInStatus =
  | 'checking_mesa'
  | 'checking_user'
  | 'onboarding'
  | 'show_form'
  | 'welcome_back'
  | 'auto_checkin'
  | 'registering'
  | 'creating_visit'
  | 'error'
  | 'success';

const CheckIn: React.FC<CheckInProps> = ({ mesaName }) => {
  const [status, setStatus] = useState<CheckInStatus>('checking_mesa');
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    fechaNacimiento: '',
    termsAccepted: false,
    marketingOptIn: false,
  });
  const [returningUser, setReturningUser] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [mesaInfo, setMesaInfo] = useState<any>(null);
  const [availableMesas, setAvailableMesas] = useState<string[]>([]);
  const [numeroPersonas, setNumeroPersonas] = useState(1);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [puntosActuales, setPuntosActuales] = useState(0);
  const [loadingPuntos, setLoadingPuntos] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [clienteId, setClienteId] = useState<string>('');

  useEffect(() => {
    initializeCheckIn();
  }, [mesaName]);

  const initializeCheckIn = async () => {
    console.log('🚀 Iniciando check-in inteligente para mesa:', mesaName);

    // 1. Verificar mesa
    if (!mesaName) {
      setMessage('Código QR inválido');
      setStatus('error');
      return;
    }

    const { data: mesaData, error: mesaError } = await getMesaByNombre(mesaName);

    if (mesaError || !mesaData) {
      setMessage(`Mesa "${mesaName}" no encontrada`);
      setStatus('error');
      return;
    }

    setMesaInfo(mesaData);

    if (mesaData.estado !== 'Libre' && mesaData.estado !== 'Reservada') {
      await findAvailableMesas();
      setMessage(`Mesa "${mesaName}" no disponible`);
      setStatus('error');
      return;
    }

    // 2. Verificar si hay usuario en sesión activa
    const { data: userData } = await getCurrentUser();

    if (userData?.user) {
      // Usuario con sesión activa -> Check-in automático directo
      setReturningUser({
        nombre: userData.user.user_metadata?.nombre || 'Usuario',
        email: userData.user.email,
        id: userData.user.id
      });
      setStatus('auto_checkin');
      // Auto check-in después de 2 segundos
      setTimeout(() => {
        handleAutoCheckIn(userData.user.id, userData.user.user_metadata?.nombre || 'Usuario');
      }, 2000);
      return;
    }

    // 3. Verificar si es usuario recurrente por teléfono (método principal)
    const savedPhone = localStorage.getItem('expendio_user_phone');
    const savedEmail = localStorage.getItem('expendio_user_email');

    if (savedPhone) {
      try {
        // Primero intentar por teléfono (más confiable)
        const { data: clienteByPhone } = await getClienteByTelefono(savedPhone);
        if (clienteByPhone) {
          setReturningUser({
            nombre: clienteByPhone.nombre || 'Usuario',
            email: clienteByPhone.email,
            telefono: clienteByPhone.telefono,
            id: clienteByPhone.id
          });
          // Cargar puntos del cliente
          loadClientePuntos(clienteByPhone.id);
          // Mostrar pantalla de bienvenida con selector de personas
          setStatus('welcome_back');
          return;
        }
      } catch (error) {
        console.log('Cliente no encontrado por teléfono, intentando por email...');
      }
    }

    // 4. Si no se encontró por teléfono, intentar por email
    if (savedEmail) {
      try {
        const { data: clienteData } = await getClienteByEmail(savedEmail);
        if (clienteData) {
          setReturningUser({
            nombre: clienteData.nombre || 'Usuario',
            email: clienteData.email,
            telefono: clienteData.telefono,
            id: clienteData.id
          });
          // Cargar puntos del cliente
          loadClientePuntos(clienteData.id);
          // Mostrar pantalla de bienvenida con selector de personas
          setStatus('welcome_back');
          return;
        }
      } catch (error) {
        console.log('Usuario no encontrado por email');
      }
    }

    // 5. Usuario completamente nuevo -> Onboarding + Registro
    const hasSeenOnboarding = localStorage.getItem('expendio_onboarding_seen');
    if (!hasSeenOnboarding) {
      setIsFirstTime(true);
      setStatus('onboarding');
    } else {
      setStatus('show_form');
    }
  };

  const findAvailableMesas = async () => {
    const { data: mesas } = await getMesas();
    if (mesas) {
      const available = mesas
        .filter((m: any) => m.estado === 'Libre')
        .map((m: any) => m.nombre)
        .slice(0, 3);
      setAvailableMesas(available);
    }
  };

  const loadClientePuntos = async (clienteId: string) => {
    setLoadingPuntos(true);
    try {
      const { data } = await getClientePuntos(clienteId);
      if (data?.puntos_actuales) {
        setPuntosActuales(data.puntos_actuales);
      }
    } catch (error) {
      console.log('No se pudieron cargar los puntos');
    }
    setLoadingPuntos(false);
  };

  // Calcular descuento disponible (10 personas/puntos = $50 de descuento, o sea $5 por punto)
  const descuentoDisponible = Math.floor(puntosActuales / 10) * 50;
  const puntosParaSiguienteDescuento = puntosActuales < 10 ? (10 - puntosActuales) : (10 - (puntosActuales % 10));

  const handleOnboardingComplete = () => {
    localStorage.setItem('expendio_onboarding_seen', 'true');
    setStatus('show_form');
  };

  const handleAutoCheckIn = async (clienteId: string, nombre: string) => {
    setStatus('creating_visit');
    setMessage(`¡Hola de nuevo, ${nombre}! 👋\n\nPreparando tu experiencia en Expendio...`);

    try {
      // Get user data for session creation
      const savedEmail = localStorage.getItem('expendio_user_email');
      const savedPhone = localStorage.getItem('expendio_user_phone');
      
      // Create session for returning user
      if (savedEmail && savedPhone) {
        const { data: sessionData, error: sessionError } = await createClientSession(
          savedEmail,
          savedPhone
        );
        
        if (sessionError) {
          console.error('Error al crear sesión para usuario recurrente:', sessionError);
        } else {
          console.log('✅ Sesión creada para usuario recurrente:', sessionData);
        }
      }

      const { data, error } = await startVisit(
        mesaName!,
        numeroPersonas,
        clienteId
      );

      if (error) {
        setMessage('Error al hacer check-in automático');
        setStatus('error');
        return;
      }

      // Mensaje personalizado con el nuevo chisme del expendio
      const mensajesBienvenida = [
        `¡Bienvenido de vuelta, ${nombre}! 🎉\n\nHoy tenemos un mezcal especial de Oaxaca que debes probar.`,
        `¡Qué gusto verte, ${nombre}! 🌟\n\nNuestro chef preparó un nuevo platillo con ingredientes de temporada.`,
        `¡Hola ${nombre}! 🍸\n\nTenemos nuevas cocteles artesanales inspirados en la tradición mexicana.`,
        `¡Bienvenido, ${nombre}! 🎵\n\nEsta noche tenemos música en vivo a partir de las 8 PM.`
      ];
      
      const mensajeAleatorio = mensajesBienvenida[Math.floor(Math.random() * mensajesBienvenida.length)];
      
      setMessage(`✅ ¡Check-in exitoso!\n\n${mensajeAleatorio}\n\nRedirigiendo al menú...`);
      setStatus('success');

      setTimeout(() => {
        window.location.hash = `/menu?mesa=${mesaName}`;
      }, 3000);
    } catch (error) {
      setMessage('Error en el check-in automático');
      setStatus('error');
    }
  };

  const handleWelcomeBackCheckIn = async () => {
    if (!returningUser) return;

    setStatus('creating_visit');
    setMessage(`¡Bienvenido de nuevo, ${returningUser.nombre}! Preparando tu mesa...`);

    try {
      const { data, error } = await startVisit(
        mesaName!,
        numeroPersonas,
        returningUser.id
      );

      if (error) {
        setMessage('Error al hacer check-in');
        setStatus('error');
        return;
      }

      // Guardar visita_id en localStorage
      if (data?.visita_id) {
        localStorage.setItem('expendio_visita_id', data.visita_id);
      }

      // Guardar cliente_id para la ruleta
      setClienteId(returningUser.id);

      const puntosMesa = numeroPersonas;
      const nuevoTotal = puntosActuales + puntosMesa;

      setMessage(`¡Bienvenido de nuevo, ${returningUser.nombre}! 🎊\n\n⭐ +${puntosMesa} punto${puntosMesa > 1 ? 's' : ''}\n💰 Total: ${nuevoTotal} puntos`);
      setStatus('success');

      // Mostrar ruleta de premios
      setTimeout(() => {
        setShowPrizeModal(true);
      }, 1500);
    } catch (error) {
      setMessage('Error en el check-in');
      setStatus('error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombre || !formData.telefono || !formData.email) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!formData.fechaNacimiento) {
      alert('Por favor ingresa tu fecha de nacimiento');
      return;
    }

    const birthDate = new Date(formData.fechaNacimiento);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      alert('Debes ser mayor de 18 años');
      return;
    }

    if (!formData.termsAccepted) {
      alert('Debes aceptar los términos y condiciones');
      return;
    }

    setStatus('registering');
    setMessage('Registrando tus datos...');

    try {
      // Registrar cliente
      const { data: registerData, error: registerError } = await registerClienteDirect({
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        fechaNacimiento: formData.fechaNacimiento,
        marketingOptIn: formData.marketingOptIn,
      });

      if (registerError || !registerData) {
        setMessage('Error al registrar');
        setStatus('error');
        return;
      }

      // Guardar en localStorage para próximas visitas
      localStorage.setItem('expendio_user_email', formData.email);
      localStorage.setItem('expendio_user_phone', formData.telefono);
      localStorage.setItem('expendio_user_nombre', formData.nombre);
      localStorage.setItem('expendio_cliente_id', registerData.cliente_id);

      // Iniciar visita
      setStatus('creating_visit');
      setMessage('Creando tu visita...');

      const { data: visitData, error: visitError } = await startVisit(
        mesaName!,
        numeroPersonas,
        registerData.cliente_id
      );

      if (visitError) {
        setMessage('Error al crear visita');
        setStatus('error');
        return;
      }

      // Guardar visita_id en localStorage
      if (visitData?.visita_id) {
        localStorage.setItem('expendio_visita_id', visitData.visita_id);
      }

      // Guardar cliente_id para la ruleta
      setClienteId(registerData.cliente_id);

      // Mensaje de bienvenida con puntos (1 punto por persona, 10 personas = $50)
      const puntosIniciales = isFirstTime ? 5 : 0;
      const puntosMesa = numeroPersonas;
      const totalPuntos = puntosIniciales + puntosMesa;

      setMessage(
        `¡Bienvenido a Expendio, ${formData.nombre}! 🎊\n\n${isFirstTime ? `🎁 Regalo: ${puntosIniciales} puntos\n` : ''}⭐ +${puntosMesa} punto${puntosMesa > 1 ? 's' : ''}\n💰 Total: ${totalPuntos} puntos`
      );
      setStatus('success');

      // Mostrar ruleta de premios
      setTimeout(() => {
        setShowPrizeModal(true);
      }, 1500);

    } catch (error) {
      console.error('Error en registro:', error);
      setMessage('Error en el proceso');
      setStatus('error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Renderizado condicional

  if (status === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (status === 'checking_mesa' || status === 'checking_user') {
    return (
      <Card className="max-w-md mx-auto mt-8 p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-expendio-teal mx-auto mb-4"></div>
        <p>Verificando disponibilidad...</p>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="max-w-md mx-auto mt-8 p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 whitespace-pre-line">{message}</p>
        </div>
        {availableMesas.length > 0 && (
          <div className="mt-4">
            <p className="font-bold mb-2">Mesas disponibles:</p>
            <ul className="list-disc list-inside text-gray-600">
              {availableMesas.map(mesa => (
                <li key={mesa}>{mesa}</li>
              ))}
            </ul>
          </div>
        )}
        <Button
          onClick={() => window.location.reload()}
          className="w-full mt-4"
        >
          Intentar de nuevo
        </Button>
      </Card>
    );
  }

  if (status === 'success') {
    const handlePrizeModalClose = () => {
      setShowPrizeModal(false);
      // Redirigir al menú después de cerrar la ruleta
      setTimeout(() => {
        window.location.hash = `/menu?mesa=${mesaName}`;
      }, 500);
    };

    return (
      <>
        <Card className="max-w-md mx-auto mt-8 p-8 text-center">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-expendio-teal mb-4">¡Éxito!</h2>
          <p className="text-gray-700 whitespace-pre-line">{message}</p>
          {!showPrizeModal && (
            <p className="text-sm text-gray-500 mt-4">Preparando tu sorpresa...</p>
          )}
        </Card>

        <PrizeModal
          isOpen={showPrizeModal}
          onClose={handlePrizeModalClose}
          clienteId={clienteId}
          clienteNombre={formData.nombre || returningUser?.nombre}
          clienteTelefono={formData.telefono}
        />
      </>
    );
  }

  if (status === 'creating_visit' || status === 'registering' || status === 'auto_checkin') {
    return (
      <Card className="max-w-md mx-auto mt-8 p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-expendio-teal mx-auto mb-4"></div>
        <p>{message}</p>
        {status === 'auto_checkin' && (
          <p className="text-sm text-gray-500 mt-2">Preparando tu experiencia...</p>
        )}
      </Card>
    );
  }

  if (status === 'welcome_back') {
    const puntosGanar = numeroPersonas; // 1 punto por persona
    const nuevoTotal = puntosActuales + puntosGanar;
    const nuevoDescuento = Math.floor(nuevoTotal / 10) * 50;

    return (
      <Card className="max-w-md mx-auto mt-8 p-6">
        <div className="text-center mb-4">
          <div className="text-5xl mb-3">👋</div>
          <h2 className="text-2xl font-bold text-expendio-dark mb-1">
            ¡Hola, {returningUser?.nombre}!
          </h2>
          <p className="text-gray-600">
            Mesa <span className="font-bold text-expendio-primary">{mesaName}</span>
          </p>
        </div>

        {/* Programa de Lealtad */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-4 border border-yellow-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">🏆 Tus Puntos</span>
            <span className="text-2xl font-bold text-expendio-primary">
              {loadingPuntos ? '...' : puntosActuales}
            </span>
          </div>

          {descuentoDisponible > 0 && (
            <div className="bg-green-100 rounded-lg p-3 mb-3 border border-green-300">
              <p className="text-green-800 font-bold text-center">
                💰 ¡Tienes ${descuentoDisponible} de descuento disponible!
              </p>
              <p className="text-xs text-green-600 text-center mt-1">
                Aplica en tu consumo de hoy
              </p>
            </div>
          )}

          <div className="text-xs text-gray-600 space-y-1">
            <p>• <strong>10 personas = $50</strong> de descuento</p>
            <p>• Ganas <strong>1 punto</strong> por cada persona en tu mesa</p>
            {puntosParaSiguienteDescuento > 0 && puntosParaSiguienteDescuento <= 10 && (
              <p className="text-expendio-primary font-medium">
                ⭐ Te faltan {puntosParaSiguienteDescuento} personas para {descuentoDisponible > 0 ? 'otro' : 'tu primer'} descuento de $50
              </p>
            )}
          </div>
        </div>

        {/* Selector de personas */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-2 text-center">¿Cuántas personas hoy?</p>
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => setNumeroPersonas(Math.max(1, numeroPersonas - 1))}
              variant="secondary"
              className="w-12 h-12 text-xl"
            >
              −
            </Button>
            <span className="text-3xl font-bold text-expendio-dark w-12 text-center">
              {numeroPersonas}
            </span>
            <Button
              onClick={() => setNumeroPersonas(Math.min(10, numeroPersonas + 1))}
              variant="secondary"
              className="w-12 h-12 text-xl"
            >
              +
            </Button>
          </div>
          <p className="text-center text-sm text-expendio-primary mt-2 font-medium">
            +{puntosGanar} puntos → Total: {nuevoTotal} puntos
            {nuevoDescuento > descuentoDisponible && (
              <span className="block text-green-600">
                🎉 ¡Desbloqueas ${nuevoDescuento - descuentoDisponible} más de descuento!
              </span>
            )}
          </p>
        </div>

        <Button
          onClick={handleWelcomeBackCheckIn}
          variant="primary"
          className="w-full text-lg py-3"
        >
          ¡Comenzar mi visita! 🎉
        </Button>

        <button
          onClick={() => {
            localStorage.removeItem('expendio_user_email');
            localStorage.removeItem('expendio_user_phone');
            localStorage.removeItem('expendio_cliente_id');
            window.location.reload();
          }}
          className="text-sm text-gray-500 hover:text-gray-700 mt-4 w-full"
        >
          ¿No eres {returningUser?.nombre}? Cambiar cuenta
        </button>
      </Card>
    );
  }

  // Formulario de registro (usuarios nuevos)
  return (
    <Card className="max-w-md mx-auto mt-8 p-8">
      <div className="text-center mb-6">
        <div className="text-5xl mb-4">📝</div>
        <h2 className="text-2xl font-bold text-expendio-dark mb-2">
          Regístrate
        </h2>
        <p className="text-gray-600">
          Mesa: <span className="font-bold">{mesaName}</span>
        </p>
        {isFirstTime && (
          <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
            <p className="text-sm text-yellow-800 font-bold">
              🎁 Regalo de bienvenida: ¡5 puntos gratis!
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              (10 puntos = $50 de descuento)
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre completo *"
          name="nombre"
          value={formData.nombre}
          onChange={handleInputChange}
          required
          placeholder="Juan Pérez"
        />

        <Input
          label="Teléfono *"
          name="telefono"
          type="tel"
          value={formData.telefono}
          onChange={handleInputChange}
          required
          placeholder="5512345678"
        />

        <Input
          label="Email *"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          placeholder="juan@ejemplo.com"
        />

        <Input
          label="Fecha de nacimiento *"
          name="fechaNacimiento"
          type="date"
          value={formData.fechaNacimiento}
          onChange={handleInputChange}
          required
        />

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">¿Cuántas personas?</p>
          <div className="flex items-center justify-center gap-4">
            <Button
              type="button"
              onClick={() => setNumeroPersonas(Math.max(1, numeroPersonas - 1))}
              variant="secondary"
              className="w-10 h-10"
            >
              −
            </Button>
            <span className="text-2xl font-bold w-10 text-center">{numeroPersonas}</span>
            <Button
              type="button"
              onClick={() => setNumeroPersonas(Math.min(10, numeroPersonas + 1))}
              variant="secondary"
              className="w-10 h-10"
            >
              +
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Ganarás {numeroPersonas} punto{numeroPersonas > 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-2">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleInputChange}
              className="mt-1"
            />
            <span className="text-sm text-gray-700">
              Acepto los <a href="#" className="text-expendio-teal hover:underline">términos y condiciones</a> *
            </span>
          </label>

          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              name="marketingOptIn"
              checked={formData.marketingOptIn}
              onChange={handleInputChange}
              className="mt-1"
            />
            <span className="text-sm text-gray-700">
              Quiero recibir promociones y ofertas especiales
            </span>
          </label>
        </div>

        <Button type="submit" variant="primary" className="w-full text-lg py-3">
          Registrarme y hacer Check-In
        </Button>
      </form>
    </Card>
  );
};

export default CheckIn;
