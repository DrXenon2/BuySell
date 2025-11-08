'use client';

import { createContext, useContext, useReducer, useCallback } from 'react';

const NotificationContext = createContext();

// Types de notifications
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Actions
const NOTIFICATION_ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS'
};

// Reducer
function notificationReducer(state, action) {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };

    case NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      };

    case NOTIFICATION_ACTIONS.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: []
      };

    default:
      return state;
  }
}

// Hook personnalisé
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// Provider
export function NotificationProvider({ children }) {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: []
  });

  // Ajouter une notification
  const addNotification = useCallback(({
    type = NOTIFICATION_TYPES.INFO,
    title,
    message,
    duration = 5000,
    action
  }) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const notification = {
      id,
      type,
      title,
      message,
      duration,
      action,
      timestamp: new Date()
    };

    dispatch({ type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION, payload: notification });

    // Auto-remove après la durée spécifiée
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  // Supprimer une notification
  const removeNotification = useCallback((id) => {
    dispatch({ type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION, payload: id });
  }, []);

  // Méthodes helpers pour chaque type
  const notify = {
    success: (title, message, options = {}) => 
      addNotification({ type: NOTIFICATION_TYPES.SUCCESS, title, message, ...options }),
    
    error: (title, message, options = {}) => 
      addNotification({ type: NOTIFICATION_TYPES.ERROR, title, message, ...options }),
    
    warning: (title, message, options = {}) => 
      addNotification({ type: NOTIFICATION_TYPES.WARNING, title, message, ...options }),
    
    info: (title, message, options = {}) => 
      addNotification({ type: NOTIFICATION_TYPES.INFO, title, message, ...options })
  };

  // Vider toutes les notifications
  const clearNotifications = useCallback(() => {
    dispatch({ type: NOTIFICATION_ACTIONS.CLEAR_NOTIFICATIONS });
  }, []);

  const value = {
    notifications: state.notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    notify
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

// Composant container pour afficher les notifications
function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  const getNotificationStyles = (type) => {
    const baseStyles = "max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden";
    
    const typeStyles = {
      [NOTIFICATION_TYPES.SUCCESS]: "border-l-4 border-green-500",
      [NOTIFICATION_TYPES.ERROR]: "border-l-4 border-red-500",
      [NOTIFICATION_TYPES.WARNING]: "border-l-4 border-yellow-500",
      [NOTIFICATION_TYPES.INFO]: "border-l-4 border-blue-500"
    };

    return `${baseStyles} ${typeStyles[type]}`;
  };

  const getIcon = (type) => {
    const iconStyles = "h-6 w-6";
    
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return (
          <svg className={`${iconStyles} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case NOTIFICATION_TYPES.ERROR:
        return (
          <svg className={`${iconStyles} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case NOTIFICATION_TYPES.WARNING:
        return (
          <svg className={`${iconStyles} text-yellow-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className={`${iconStyles} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-end justify-start px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={getNotificationStyles(notification.type)}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getIcon(notification.type)}
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                {notification.title && (
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                )}
                {notification.message && (
                  <p className="mt-1 text-sm text-gray-500">
                    {notification.message}
                  </p>
                )}
                {notification.action && (
                  <div className="mt-3 flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        notification.action.onClick();
                        removeNotification(notification.id);
                      }}
                      className="bg-white rounded-md text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {notification.action.label}
                    </button>
                  </div>
                )}
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="sr-only">Fermer</span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

