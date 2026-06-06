import { useCallback, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useNotifications } from "../context/NotificationContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface PaymentChange {
  id: string;
  locataire_id: string | null;
  property_id: string | null;
  montant: number;
  statut: string;
  mois_concerne?: string | null;
  locataires?: {
    nom: string;
    prenom: string;
    telephone?: string | null;
  } | null;
  properties?: {
    adresse: string;
  } | null;
}

export function useRealtimePayments() {
  const { showPaymentNotification } = useNotifications();
  const lastNotificationKey = useRef<string | null>(null);

  const notifyPaidPayment = useCallback(
    async (
      tenantName: string,
      amount: number,
      propertyAddress: string,
      paymentId: string,
      propertyId: string | null,
      mois: string,
    ) => {
      showPaymentNotification(tenantName, amount, propertyAddress);

      if (propertyId) {
        void supabase.functions
          .invoke("send-payment-notification", {
            body: {
              property_id: propertyId,
              payment_id: paymentId,
              montant: amount,
              locataire_nom: tenantName,
              propriete_nom: propertyAddress,
              mois,
            },
          })
          .then(({ data, error }) => {
            if (error) {
              console.error("Erreur lors de l'envoi OneSignal:", error);
              return;
            }

            if (data?.sent) {
              console.log("✅ Notification OneSignal envoyée avec succès");
            } else {
              console.log("⚠️ Échec de l'envoi OneSignal");
            }
          })
          .catch((error) => {
            console.error("Erreur lors de l'envoi OneSignal:", error);
          });
      }
    },
    [showPaymentNotification],
  );

  const handlePaymentChange = useCallback(
    (payload: RealtimePostgresChangesPayload<PaymentChange>) => {
      const { eventType } = payload;
      const newRecord = payload.new as Partial<PaymentChange> | null;
      const oldRecord = payload.old as Partial<PaymentChange> | null;

      const hasPaymentData = (
        record: Partial<PaymentChange> | null,
      ): record is PaymentChange =>
        Boolean(
          record &&
            typeof record.id === "string" &&
            typeof record.montant === "number" &&
            typeof record.statut === "string",
        );

      if (!hasPaymentData(newRecord)) {
        return;
      }

      const shouldNotify =
        newRecord.statut === "paye" &&
        (eventType === "INSERT" ||
          (eventType === "UPDATE" && oldRecord?.statut !== "paye"));

      if (!shouldNotify) {
        return;
      }

      const notificationKey =
        eventType === "INSERT"
          ? `insert:${newRecord.id}:${newRecord.statut}`
          : `update:${newRecord.id}:${oldRecord?.statut ?? "unknown"}:${newRecord.statut}`;

      if (lastNotificationKey.current === notificationKey) {
        return;
      }

      lastNotificationKey.current = notificationKey;

      const tenantName = newRecord.locataires
        ? `${newRecord.locataires.prenom} ${newRecord.locataires.nom}`
        : "Un locataire";
      const propertyAddress = newRecord.properties?.adresse || "";

      void notifyPaidPayment(
        tenantName,
        newRecord.montant,
        propertyAddress,
        newRecord.id,
        newRecord.property_id ?? null,
        newRecord.mois_concerne || "ce mois",
      );
    },
    [notifyPaidPayment],
  );

  useEffect(() => {
    // S'abonner aux changements sur la table rent_payments
    const channel = supabase
      .channel("rent_payments_changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Écouter INSERT, UPDATE, DELETE
          schema: "public",
          table: "rent_payments",
        },
        (payload: RealtimePostgresChangesPayload<PaymentChange>) => {
          handlePaymentChange(payload);
        },
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handlePaymentChange]);
}
