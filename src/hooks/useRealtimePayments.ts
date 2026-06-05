import { useCallback, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useNotifications } from "../context/NotificationContext";
import { sendPaymentNotification } from "../lib/whatsappService";
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
  const lastProcessedId = useRef<string | null>(null);

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

      // Ignorer les doublons en vérifiant l'ID
      if (newRecord.id === lastProcessedId.current) {
        return;
      }

      lastProcessedId.current = newRecord.id;

      // Notification lors d'un INSERT ou UPDATE avec statut "paye"
      if (eventType === "INSERT" || eventType === "UPDATE") {
        if (newRecord.statut === "paye") {
          const tenantName = newRecord.locataires
            ? `${newRecord.locataires.prenom} ${newRecord.locataires.nom}`
            : "Un locataire";

          const propertyAddress = newRecord.properties?.adresse || "";
          const tenantPhone = newRecord.locataires?.telephone || undefined;

          // Envoyer la notification WhatsApp
          sendPaymentNotification(
            tenantName,
            newRecord.montant,
            propertyAddress,
            tenantPhone,
          )
            .then((success) => {
              if (success) {
                console.log("✅ Notification WhatsApp envoyée avec succès");
              } else {
                console.log("⚠️ Échec de l'envoi WhatsApp, fallback vers notification toast");
                showPaymentNotification(tenantName, newRecord.montant, propertyAddress);
              }
            })
            .catch((error) => {
              console.error("Erreur lors de l'envoi WhatsApp:", error);
              showPaymentNotification(tenantName, newRecord.montant, propertyAddress);
            });

          if (newRecord.property_id) {
            void supabase.functions
              .invoke("send-payment-notification", {
                body: {
                  property_id: newRecord.property_id,
                  payment_id: newRecord.id,
                  montant: newRecord.montant,
                  locataire_nom: tenantName,
                  propriete_nom: propertyAddress,
                  mois: newRecord.mois_concerne || "ce mois",
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
        }
      }

      // Notification lors d'un changement de statut vers "paye"
      if (eventType === "UPDATE" && oldRecord) {
        if (oldRecord.statut !== "paye" && newRecord.statut === "paye") {
          const tenantName = newRecord.locataires
            ? `${newRecord.locataires.prenom} ${newRecord.locataires.nom}`
            : "Un locataire";

          const propertyAddress = newRecord.properties?.adresse || "";
          const tenantPhone = newRecord.locataires?.telephone || undefined;

          // Envoyer la notification WhatsApp
          sendPaymentNotification(
            tenantName,
            newRecord.montant,
            propertyAddress,
            tenantPhone,
          )
            .then((success) => {
              if (success) {
                console.log("✅ Notification WhatsApp envoyée avec succès");
              } else {
                console.log("⚠️ Échec de l'envoi WhatsApp, fallback vers notification toast");
                showPaymentNotification(tenantName, newRecord.montant, propertyAddress);
              }
            })
            .catch((error) => {
              console.error("Erreur lors de l'envoi WhatsApp:", error);
              showPaymentNotification(tenantName, newRecord.montant, propertyAddress);
            });

          if (newRecord.property_id) {
            void supabase.functions
              .invoke("send-payment-notification", {
                body: {
                  property_id: newRecord.property_id,
                  payment_id: newRecord.id,
                  montant: newRecord.montant,
                  locataire_nom: tenantName,
                  propriete_nom: propertyAddress,
                  mois: newRecord.mois_concerne || "ce mois",
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
        }
      }
    },
    [showPaymentNotification],
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
