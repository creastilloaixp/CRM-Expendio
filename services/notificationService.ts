/**
 * 🔔 Servicio centralizado de notificaciones del navegador
 * Maneja permisos y envío de notificaciones de forma unificada
 */

// Sonidos de notificación (base64 o URLs)
const NOTIFICATION_SOUNDS = {
    alert: '/sounds/alert.mp3',
    success: '/sounds/success.mp3',
    call: '/sounds/call.mp3'
};

export class NotificationService {
    private static hasPermission = false;
    private static audioContext: AudioContext | null = null;

    /**
     * Verificar estado de permisos sin solicitar
     */
    static checkPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
        if (!('Notification' in window)) {
            return 'unsupported';
        }
        return Notification.permission;
    }

    /**
     * Inicializar el servicio y solicitar permisos
     */
    static async init(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('🔕 Este navegador no soporta notificaciones');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.hasPermission = true;
            return true;
        }

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            this.hasPermission = permission === 'granted';
            return this.hasPermission;
        }

        return false;
    }

    /**
     * Solicitar permisos explícitamente (para botón UI)
     */
    static async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.hasPermission = permission === 'granted';
            return this.hasPermission;
        } catch (error) {
            console.error('Error solicitando permisos:', error);
            return false;
        }
    }

    /**
     * Reproducir sonido de alerta
     */
    static playSound(type: 'alert' | 'success' | 'call' = 'alert'): void {
        try {
            // Intentar reproducir sonido
            const audio = new Audio(NOTIFICATION_SOUNDS[type]);
            audio.volume = 0.5;
            audio.play().catch(() => {
                // Fallback: usar Web Audio API para generar beep
                this.playBeep();
            });
        } catch {
            this.playBeep();
        }
    }

    /**
     * Generar beep con Web Audio API (fallback)
     */
    private static playBeep(): void {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;

            oscillator.start();
            setTimeout(() => oscillator.stop(), 200);
        } catch {
            // Silenciar errores de audio
        }
    }

    /**
     * Enviar una notificación
     */
    static async send(title: string, options?: NotificationOptions & { playSound?: boolean; soundType?: 'alert' | 'success' | 'call' }): Promise<void> {
        if (!this.hasPermission) {
            await this.init();
        }

        // Reproducir sonido si está habilitado
        if (options?.playSound !== false) {
            this.playSound(options?.soundType || 'alert');
        }

        if (!this.hasPermission) {
            console.warn('🔕 No hay permisos para notificaciones');
            return;
        }

        try {
            const notification = new Notification(title, {
                icon: '/logo.png',
                badge: '/logo.png',
                requireInteraction: false,
                ...options
            });

            // Auto-cerrar después de 5 segundos
            setTimeout(() => notification.close(), 5000);

            // Click handler para enfocar la ventana
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch (error) {
            console.error('❌ Error al enviar notificación:', error);
        }
    }

    /**
     * Notificación para nuevo pedido en cocina
     */
    static async notifyNewOrder(mesa: string, producto: string): Promise<void> {
        await this.send('🍽️ Nuevo Pedido en Cocina', {
            body: `Mesa ${mesa}: ${producto}`,
            tag: 'new-order',
            vibrate: [200, 100, 200],
            soundType: 'alert'
        });
    }

    /**
     * Notificación para llamar mesero
     */
    static async notifyCallWaiter(mesa: string): Promise<void> {
        await this.send('🙋 ¡MESERO SOLICITADO!', {
            body: `Mesa ${mesa} necesita atención AHORA`,
            tag: 'call-waiter',
            vibrate: [200, 100, 200, 100, 200],
            requireInteraction: true,
            soundType: 'call'
        });
    }

    /**
     * Notificación para pedir cuenta
     */
    static async notifyRequestBill(mesa: string): Promise<void> {
        await this.send('💰 Cliente solicita la Cuenta', {
            body: `Mesa ${mesa} está lista para pagar`,
            tag: 'request-bill',
            vibrate: [200, 100, 200],
            requireInteraction: true,
            soundType: 'call'
        });
    }

    /**
     * Notificación para nueva reserva
     */
    static async notifyNewReservation(clientName: string, mesa: string, time: string): Promise<void> {
        await this.send('📅 Nueva Reserva', {
            body: `${clientName} - Mesa ${mesa} a las ${time}`,
            tag: 'new-reservation',
            vibrate: [100],
            soundType: 'success'
        });
    }

    /**
     * Notificación para recordatorio de reserva próxima
     */
    static async notifyUpcomingReservation(clientName: string, mesa: string, minutes: number): Promise<void> {
        await this.send('⏰ Reserva Próxima', {
            body: `${clientName} - Mesa ${mesa} en ${minutes} minutos`,
            tag: 'upcoming-reservation',
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 200],
            soundType: 'alert'
        });
    }

    /**
     * Verificar si hay permisos
     */
    static get isEnabled(): boolean {
        return this.hasPermission;
    }
}

// Inicializar automáticamente cuando se importe
if (typeof window !== 'undefined') {
    NotificationService.init();
}
