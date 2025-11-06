import { http } from './api';
import supabaseClient from './supabaseClient';

class NotificationService {
  constructor() {
    this.notificationSound = null;
    this.initializeSound();
  }

  // Initialiser le son de notification
  initializeSound() {
    if (typeof window !== 'undefined' && window.Audio) {
      this.notificationSound = new Audio('/sounds/notification.mp3');
      this.notificationSound.volume = 0.3;
    }
  }

  // Récupérer les notifications
  async getNotifications(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        type
      } = filters;

      const params = {
        page,
        limit,
        unread_only: unreadOnly,
        ...(type && { type })
      };

      const queryString = new URLSearchParams(params).toString();
      const response = await http.get(`/notifications?${queryString}`);
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Marquer comme lu
  async markAsRead(notificationId) {
    try {
      const response = await http.put(`/notifications/${notificationId}/read`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Marquer tout comme lu
  async markAllAsRead() {
    try {
      const response = await http.put('/notifications/read-all');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Supprimer une notification
  async deleteNotification(notificationId) {
    try {
      const response = await http.delete(`/notifications/${notificationId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Supprimer toutes les notifications
  async clearAllNotifications() {
    try {
      const response = await http.delete('/notifications');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer les préférences de notification
  async getNotificationPreferences() {
    try {
      const response = await http.get('/notifications/preferences');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mettre à jour les préférences de notification
  async updateNotificationPreferences(preferences) {
    try {
      const response = await http.put('/notifications/preferences', preferences);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Afficher une notification toast
  showToastNotification(notification) {
    if (typeof window === 'undefined') return;

    // Créer l'élément toast
    const toast = document.createElement('div');
    toast.className = `notification-toast ${notification.type || 'info'}`;
    toast.innerHTML = `
      <div class="notification-icon">
        ${this.getNotificationIcon(notification.type)}
      </div>
      <div class="notification-content">
        <div class="notification-title">${notification.title}</div>
        <div class="notification-message">${notification.message}</div>
      </div>
      <button class="notification-close" onclick="this.parentElement.remove()">
        &times;
      </button>
    `;

    // Ajouter au DOM
    const container = document.getElementById('notification-container') || 
                     this.createNotificationContainer();
    container.appendChild(toast);

    // Jouer le son
    this.playNotificationSound();

    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);

    // Animation d'entrée
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
  }

  // Créer le conteneur de notifications
  createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
  }

  // Obtenir l'icône de notification
  getNotificationIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      order: '📦',
      payment: '💳',
      promotion: '🎁',
      system: '⚙️'
    };

    return icons[type] || icons.info;
  }

  // Jouer le son de notification
  playNotificationSound() {
    if (this.notificationSound) {
      this.notificationSound.currentTime = 0;
      this.notificationSound.play().catch(() => {
        // Ignorer les erreurs de lecture audio
      });
    }
  }

  // Demander la permission des notifications push
  async requestPushPermission() {
    if (!('Notification' in window)) {
      return { success: false, message: 'Notifications non supportées' };
    }

    if (Notification.permission === 'granted') {
      return { success: true, message: 'Permission déjà accordée' };
    }

    if (Notification.permission === 'denied') {
      return { success: false, message: 'Permission refusée' };
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Enregistrer le service worker pour les notifications push
        await this.registerPushNotifications();
        return { success: true, message: 'Permission accordée' };
      } else {
        return { success: false, message: 'Permission refusée' };
      }
    } catch (error) {
      return { 
        success: false, 
        message: 'Erreur lors de la demande de permission' 
      };
    }
  }

  // Enregistrer les notifications push
  async registerPushNotifications() {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        )
      });

      // Envoyer l'abonnement au serveur
      await http.post('/notifications/push/subscribe', {
        subscription: JSON.stringify(subscription)
      });

    } catch (error) {
      console.error('Push notification registration failed:', error);
    }
  }

  // Convertir la clé VAPID
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Souscrire aux notifications en temps réel
  subscribeToRealtimeNotifications(callback) {
    return supabaseClient
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          // Afficher la notification toast
          this.showToastNotification(payload.new);
          
          // Appeler le callback personnalisé
          if (callback) {
            callback(payload.new);
          }
        }
      )
      .subscribe();
  }

  // Statistiques des notifications
  async getNotificationStats() {
    try {
      const response = await http.get('/notifications/stats');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Gestion centralisée des erreurs
  handleError(error) {
    console.error('Notification Service Error:', error);
    
    return {
      success: false,
      error: error.error || 'Notification Service Error',
      message: error.message || 'Erreur lors du traitement des notifications',
      status: error.status,
      originalError: error,
    };
  }
}

export default new NotificationService();
