import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface NotificationButtonProps {
  propertyId?: string;
}

export const NotificationButton = ({ propertyId }: NotificationButtonProps) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    checkSubscription();
  }, []);
  
  const checkSubscription = async () => {
    try {
      // Utiliser l'API OneSignal native pour vérifier l'abonnement
      const isPushEnabled = await (window as any).OneSignal?.isPushNotificationsEnabled?.();
      setIsSubscribed(isPushEnabled || false);
    } catch (error) {
      console.error('Erreur vérification abonnement:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      // Utiliser l'API native pour demander la permission
      await (window as any).OneSignal?.registerForPushNotifications?.();
      
      // Récupérer le player_id après l'abonnement
      const playerId = await (window as any).OneSignal?.getUserId?.();
      
      if (playerId && propertyId) {
        // Sauvegarder playerId pour cette propriété
        await supabase
          .from('properties')
          .update({ onesignal_player_id: playerId })
          .eq('id', propertyId);
        setIsSubscribed(true);
      } else if (playerId) {
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Erreur abonnement:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUnsubscribe = async () => {
    try {
      setIsLoading(true);
      await (window as any).OneSignal?.setSubscription?.(false);
      setIsSubscribed(false);
      
      // Retirer playerId de la propriété
      if (propertyId) {
        await supabase
          .from('properties')
          .update({ onesignal_player_id: null })
          .eq('id', propertyId);
      }
    } catch (error) {
      console.error('Erreur désabonnement:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <button disabled className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
        Chargement...
      </button>
    );
  }
  
  return (
    <button
      onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
      className={`px-4 py-2 rounded-lg transition-colors ${
        isSubscribed
          ? 'bg-green-600 hover:bg-green-700 text-white'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      {isSubscribed ? '✅ Notifications activées' : '🔔 Activer les notifications'}
    </button>
  );
};
