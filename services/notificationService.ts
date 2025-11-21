/**
 * 🔔 Servicio centralizado de notificaciones del navegador
 * Maneja permisos y envío de notificaciones de forma unificada
 */

export class NotificationService {
    private static hasPermission = false;

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
     * Enviar una notificación
     */
    static async send(title: string, options?: NotificationOptions): Promise<void> {
        if (!this.hasPermission) {
            await this.init();
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
            vibrate: [200, 100, 200]
        });
    }

    /**
     * Notificación para llamar mesero
     */
    static async notifyCallWaiter(mesa: string): Promise<void> {
        await this.send('🙋 Cliente solicita Mesero', {
            body: `Mesa ${mesa} necesita atención`,
            tag: 'call-waiter',
            vibrate: [200]
        });
    }

    /**
     * Notificación para pedir cuenta
     */
    static async notifyRequestBill(mesa: string): Promise<void> {
        await this.send('💰 Cliente solicita la Cuenta', {
            body: `Mesa ${mesa} está lista para pagar`,
            tag: 'request-bill',
            vibrate: [200, 100, 200]
        });
    }

    /**
     * Notificación para nueva reserva
     */
    static async notifyNewReservation(clientName: string, mesa: string, time: string): Promise<void> {
        await this.send('📅 Nueva Reserva', {
            body: `${clientName} - Mesa ${mesa} a las ${time}`,
            tag: 'new-reservation',
            vibrate: [100]
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
            vibrate: [200, 100, 200, 100, 200]
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
