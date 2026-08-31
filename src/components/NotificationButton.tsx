import { useEffect, useState } from "react";
import dbClient from '../lib/dbClient.service';

interface NotificationButtonProps {
  propertyId?: string;
}

export const NotificationButton = ({ propertyId }: NotificationButtonProps) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).OneSignal) {
      setIsLoading(false);
      return;
    }

    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    const oneSignal = (window as any).OneSignal;
    if (!oneSignal) {
      setIsLoading(false);
      return;
    }

    try {
      // Utiliser l'API OneSignal native pour vérifier l'abonnement
      const isPushEnabled = await oneSignal.isPushNotificationsEnabled?.();
      setIsSubscribed(isPushEnabled || false);
    } catch (error) {
      console.error("Erreur vérification abonnement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    const oneSignal = (window as any).OneSignal;
    if (!oneSignal) {
      return;
    }

    try {
      setIsLoading(true);
      // Utiliser l'API native pour demander la permission
      await oneSignal.registerForPushNotifications?.();

      // Récupérer le player_id après l'abonnement
      const playerId = await oneSignal.getUserId?.();

      if (playerId && propertyId) {
        // Sauvegarder playerId pour cette propriété
        await dbClient
          .from("properties")
          .update({ onesignal_player_id: playerId })
          .eq("id", propertyId);
        setIsSubscribed(true);
      } else if (playerId) {
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error("Erreur abonnement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    const oneSignal = (window as any).OneSignal;
    if (!oneSignal) {
      return;
    }

    try {
      setIsLoading(true);
      await oneSignal.setSubscription?.(false);
      setIsSubscribed(false);

      // Retirer playerId de la propriété
      if (propertyId) {
        await dbClient
          .from("properties")
          .update({ onesignal_player_id: null })
          .eq("id", propertyId);
      }
    } catch (error) {
      console.error("Erreur désabonnement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
      >
        Chargement...
      </button>
    );
  }

  return (
    <button
      onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
      className={`px-4 py-2 rounded-lg transition-colors ${
        isSubscribed
          ? "bg-green-600 hover:bg-green-700 text-white"
          : "bg-blue-600 hover:bg-blue-700 text-white"
      }`}
    >
      {isSubscribed
        ? "✅ Notifications activées"
        : "🔔 Activer les notifications"}
    </button>
  );
};
