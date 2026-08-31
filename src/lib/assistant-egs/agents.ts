import { BaseAgent } from "./base-agent";
import type { AgentMessage, AgentAction, AgentRole } from "./types";

export class InfrastructureAgent extends BaseAgent {
  role: AgentRole = "infrastructure";
  name = "Architecte Infrastructure";
  description = "Surveille Docker, API, PostgreSQL, sauvegardes et performance";

  async getGreeting(): Promise<AgentMessage> {
    return {
      greeting: "Bonjour. Je surveille l'infrastructure d'EGS.",
      summary: "État du serveur analysé. Quelques points à vérifier.",
      alerts: [
        "Docker: opérationnel",
        "PostgreSQL: port 54322 actif",
        "API: réactive",
      ],
    };
  }

  async processQuery(query: string): Promise<AgentMessage> {
    const lowerQuery = query.toLowerCase();

    if (
      lowerQuery.includes("docker") ||
      lowerQuery.includes("conteneur")
    ) {
      return {
        summary:
          "Docker est actif avec 5 conteneurs en cours d'exécution.",
        recommendations: [
          "Vérifier la consommation de RAM des conteneurs",
        ],
      };
    }

    if (
      lowerQuery.includes("base de données") ||
      lowerQuery.includes("postgres")
    ) {
      return {
        summary: "PostgreSQL fonctionne correctement.",
        recommendations: [
          "Dernière sauvegarde: il y a 2 jours. Recommandé: une par jour.",
        ],
      };
    }

    return {
      summary: "Je n'ai pas compris votre question.",
      recommendations: ["Demandez-moi l'état de Docker, PostgreSQL, ou API"],
    };
  }

  async detectAnomalies(): Promise<string[]> {
    return [
      "RAM utilisée: 65% (acceptable)",
      "Dernier backup: 2 jours ago (à refaire bientôt)",
    ];
  }

  async generateRecommendations(): Promise<string[]> {
    return [
      "Planifier une sauvegarde hebdomadaire",
      "Monitorer la croissance du stockage disque",
    ];
  }

  async suggestActions(): Promise<AgentAction[]> {
    return [
      {
        id: "backup-now",
        label: "Faire une sauvegarde maintenant",
        description: "Créer un snapshot du serveur",
        action: () => console.log("Backup initiated"),
        variant: "primary",
      },
      {
        id: "view-logs",
        label: "Voir les logs",
        description: "Afficher les derniers logs système",
        action: () => console.log("Logs viewed"),
      },
    ];
  }
}

export class FoncierAgent extends BaseAgent {
  role: AgentRole = "foncier";
  name = "Consultant Foncier";
  description = "Expert des lots, villages, réservations et ventes";

  async getGreeting(): Promise<AgentMessage> {
    return {
      greeting: "Bonjour. Je suis spécialisé dans la gestion foncière.",
      summary:
        "Vous avez 47 lots actifs, 12 réservations en cours, et 3 ventes en attente de validation.",
      alerts: [
        "2 réservations expirent dans 3 jours",
        "Village A: 2 lots restants seulement",
      ],
    };
  }

  async processQuery(query: string): Promise<AgentMessage> {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("lots") || lowerQuery.includes("disponible")) {
      return {
        summary: "Vous avez 47 lots disponibles.",
        recommendations: [
          "Village A: 2 lots (faible stock)",
          "Village B: 8 lots",
          "Village C: 15 lots",
          "Village D: 22 lots",
        ],
      };
    }

    if (
      lowerQuery.includes("réservation") ||
      lowerQuery.includes("contrats")
    ) {
      return {
        summary: "12 réservations actives.",
        alerts: ["3 réservations expirent dans 5 jours"],
      };
    }

    return {
      summary: "Je n'ai pas compris votre question.",
      recommendations: [
        "Demandez-moi combien de lots sont disponibles",
        "Ou l'état des réservations",
      ],
    };
  }

  async detectAnomalies(): Promise<string[]> {
    return [
      "3 contrats sans signatures",
      "2 ventes sans paiement correspondant",
      "1 lot marqué vendu mais toujours en stock",
    ];
  }

  async generateRecommendations(): Promise<string[]> {
    return [
      "Réduire le prix des 2 derniers lots du Village A",
      "Relancer les clients avec réservations expirées",
      "Valider les signatures manquantes",
    ];
  }

  async suggestActions(): Promise<AgentAction[]> {
    return [
      {
        id: "generate-contract",
        label: "Générer contrats manquants",
        description: "Créer les documents pour 3 ventes",
        action: () => console.log("Contracts generated"),
        variant: "primary",
      },
      {
        id: "alert-expiry",
        label: "Alerter clients (réservations qui expirent)",
        description: "Envoyer des relances",
        action: () => console.log("Alerts sent"),
      },
    ];
  }
}

export class ComptabilityAgent extends BaseAgent {
  role: AgentRole = "comptabilité";
  name = "Comptable Assistant";
  description = "Assiste dans factures, dépenses, trésorerie et rapprochements";

  async getGreeting(): Promise<AgentMessage> {
    return {
      greeting: "Bonjour. Résumé financier du jour.",
      summary: "Vous avez 4 factures impayées, trésorerie OK, TVA à calculer.",
      alerts: [
        "4 factures restent impayées (9 750 € dus)",
        "2 fournisseurs arrivent à échéance demain",
      ],
    };
  }

  async processQuery(query: string): Promise<AgentMessage> {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("facture") || lowerQuery.includes("impayée")) {
      return {
        summary: "4 factures impayées: 2 150€ + 1 800€ + 3 200€ + 2 600€",
        recommendations: [
          "Relancer Client A (2 150€, en retard de 10 jours)",
          "Relancer Client B (3 200€, en retard de 5 jours)",
        ],
      };
    }

    if (lowerQuery.includes("trésorerie") || lowerQuery.includes("solde")) {
      return {
        summary:
          "Solde disponible: 45 320€. Prévisions semaine: -3 200€ (paiements fournisseurs).",
        recommendations: ["Solde confortable pour les dépenses courantes"],
      };
    }

    if (lowerQuery.includes("tva") || lowerQuery.includes("impôt")) {
      return {
        summary: "TVA estimée ce mois: 3 420€.",
        recommendations: [
          "À reverser avant le 30 du mois",
          "Encaissements: 68 900€ HT",
        ],
      };
    }

    return {
      summary: "Je n'ai pas compris votre question.",
      recommendations: [
        "Demandez-moi les factures impayées",
        "Ou l'état de la trésorerie",
      ],
    };
  }

  async detectAnomalies(): Promise<string[]> {
    return [
      "2 factures sans numéro SIRET client",
      "1 paiement sans facture correspondante",
      "3 clients avec 2+ mois d'arriérés",
    ];
  }

  async generateRecommendations(): Promise<string[]> {
    return [
      "Relancer les 3 clients en arriérés",
      "Générer un rapprochement bancaire",
      "Préparer la déclaration TVA",
    ];
  }

  async suggestActions(): Promise<AgentAction[]> {
    return [
      {
        id: "send-reminders",
        label: "Envoyer relances clients",
        description: "Notifier 3 clients",
        action: () => console.log("Reminders sent"),
        variant: "primary",
      },
      {
        id: "generate-tva",
        label: "Générer déclaration TVA",
        description: "Préparer le document pour révision",
        action: () => console.log("TVA declaration generated"),
      },
    ];
  }
}

export class DefaultAgent extends BaseAgent {
  role: AgentRole = "admin";
  name = "Assistant EGS";
  description = "Assistant généraliste d'EGS";

  async getGreeting(): Promise<AgentMessage> {
    return {
      greeting: "Bonjour. Comment puis-je vous aider?",
      summary:
        "Je suis votre assistant EGS. Je m'adapte à chaque module pour vous assister au quotidien.",
    };
  }

  async processQuery(_query: string): Promise<AgentMessage> {
    return {
      summary: "Je peux mieux vous aider dans un module spécifique.",
      recommendations: [
        "Allez dans Foncier, Comptabilité, ou Infra pour une assistance spécialisée",
      ],
    };
  }

  async detectAnomalies(): Promise<string[]> {
    return [];
  }

  async generateRecommendations(): Promise<string[]> {
    return [
      "Consulter le tableau de bord pour une vue d'ensemble",
      "Vérifier les alertes critiques",
    ];
  }

  async suggestActions(): Promise<AgentAction[]> {
    return [];
  }
}

export class ImmobilierAgent extends BaseAgent {
  role: AgentRole = "immobilier";
  name = "Gestionnaire Immobilier";
  description = "Expert en gestion immobilière, locations et contrats";

  async getGreeting(): Promise<AgentMessage> {
    return {
      greeting: "Bonjour. Vue d'ensemble de votre portefeuille immobilier.",
      summary:
        "Vous disposez de 28 propriétés, dont 18 louées et 10 en vente.",
      alerts: [
        "3 contrats expirent dans 30 jours",
        "1 loyer impayé depuis 2 mois",
        "2 visites programmées cette semaine",
      ],
    };
  }

  async processQuery(query: string): Promise<AgentMessage> {
    const lowerQuery = query.toLowerCase();

    if (
      lowerQuery.includes("propriété") ||
      lowerQuery.includes("bien") ||
      lowerQuery.includes("immeuble")
    ) {
      return {
        summary: "28 propriétés en portefeuille.",
        recommendations: [
          "18 louées (taux d'occupation: 82%)",
          "10 en attente de location",
        ],
      };
    }

    if (lowerQuery.includes("loyer") || lowerQuery.includes("revenu")) {
      return {
        summary: "Revenus locatifs ce mois: 156 420€.",
        alerts: ["1 loyer impayé (3 200€)"],
        recommendations: [
          "Relancer le locataire",
          "Vérifier les autres arriérés",
        ],
      };
    }

    if (
      lowerQuery.includes("contrat") ||
      lowerQuery.includes("expiration")
    ) {
      return {
        summary: "3 contrats expireront dans 30 jours.",
        recommendations: [
          "Préparer les renouvellements",
          "Évaluer les révisions",
        ],
      };
    }

    return {
      summary: "Je n'ai pas compris.",
      recommendations: [
        "Demandez les propriétés, revenus locatifs, ou contrats",
      ],
    };
  }

  async detectAnomalies(): Promise<string[]> {
    return [
      "1 loyer impayé depuis 2 mois (3 200€)",
      "3 contrats expirant dans 30 jours",
      "1 bien sans inspecteur assigné",
      "2 visite sans rapport de visite",
    ];
  }

  async generateRecommendations(): Promise<string[]> {
    return [
      "Relancer client pour loyer impayé",
      "Préparer les renouvellements de contrats",
      "Planifier les inspections de propriété",
    ];
  }

  async suggestActions(): Promise<AgentAction[]> {
    return [
      {
        id: "send-invoice",
        label: "Envoyer relance loyer",
        description: "Notifier le locataire",
        action: () => console.log("Invoice reminder sent"),
        variant: "primary",
      },
      {
        id: "renew-contracts",
        label: "Préparer renouvellements",
        description: "Générer les documents",
        action: () => console.log("Renewal documents generated"),
      },
    ];
  }
}

export class CommercialAgent extends BaseAgent {
  role: AgentRole = "commercial";
  name = "Manager Commercial";
  description = "Gère clients, leads, campagnes et relances";

  async getGreeting(): Promise<AgentMessage> {
    return {
      greeting: "Bonjour. Dashboard commercial d'aujourd'hui.",
      summary:
        "45 clients actifs, 12 leads chauds, 3 campagnes en cours.",
      alerts: [
        "8 devis en attente de signature",
        "5 clients inactifs depuis 6 mois",
        "Lead chaud: Appel urgent client A",
      ],
    };
  }

  async processQuery(query: string): Promise<AgentMessage> {
    const lowerQuery = query.toLowerCase();

    if (
      lowerQuery.includes("client") ||
      lowerQuery.includes("compte")
    ) {
      return {
        summary: "45 clients actifs en base.",
        recommendations: [
          "5 clients à relancer (inactifs depuis 6 mois)",
          "Top 3 clients: 45% du chiffre",
        ],
      };
    }

    if (lowerQuery.includes("lead") || lowerQuery.includes("prospect")) {
      return {
        summary: "12 leads chauds en pipeline.",
        recommendations: ["3 leads à relancer", "2 leads qualifiés à convertir"],
      };
    }

    if (lowerQuery.includes("devis") || lowerQuery.includes("commande")) {
      return {
        summary: "8 devis en attente de signature.",
        recommendations: ["Relancer les clients pour signature"],
      };
    }

    return {
      summary: "Je n'ai pas compris.",
      recommendations: ["Demandez les clients, leads, ou devis en attente"],
    };
  }

  async detectAnomalies(): Promise<string[]> {
    return [
      "8 devis sans signature depuis > 7 jours",
      "5 clients inactifs depuis 6 mois",
      "3 contrats non finalisés",
    ];
  }

  async generateRecommendations(): Promise<string[]> {
    return [
      "Relancer les 8 devis en attente",
      "Reprendre contact avec les 5 clients inactifs",
      "Finaliser les contrats non terminés",
    ];
  }

  async suggestActions(): Promise<AgentAction[]> {
    return [
      {
        id: "send-reminders",
        label: "Relancer devis",
        description: "Notifier 8 clients",
        action: () => console.log("Reminders sent"),
        variant: "primary",
      },
      {
        id: "contact-inactive",
        label: "Reprendre contact inactifs",
        description: "Email + appel",
        action: () => console.log("Contact initiated"),
      },
    ];
  }
}

export class RHAgent extends BaseAgent {
  role: AgentRole = "rh";
  name = "Responsable RH";
  description = "Gère employés, congés, paie et évaluations";

  async getGreeting(): Promise<AgentMessage> {
    return {
      greeting: "Bonjour. Résumé RH du jour.",
      summary: "24 employés actifs, 2 en congé, 3 contrats à renouveler.",
      alerts: [
        "Paie à générer (fin de mois demain)",
        "2 demandes de congés en attente",
        "1 contrat expire dans 15 jours",
      ],
    };
  }

  async processQuery(query: string): Promise<AgentMessage> {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("employé") || lowerQuery.includes("effectif")) {
      return {
        summary: "24 employés actifs.",
        recommendations: ["2 CDI récents", "3 CDD à transformer ou finaliser"],
      };
    }

    if (lowerQuery.includes("congé") || lowerQuery.includes("absence")) {
      return {
        summary: "2 employés en congé cette semaine.",
        recommendations: [
          "2 demandes de congés en attente de validation",
        ],
      };
    }

    if (lowerQuery.includes("paie") || lowerQuery.includes("salaire")) {
      return {
        summary: "Masse salariale: 185 000€/mois.",
        recommendations: ["Paie à générer demain"],
      };
    }

    return {
      summary: "Je n'ai pas compris.",
      recommendations: ["Demandez les employés, congés, ou paie"],
    };
  }

  async detectAnomalies(): Promise<string[]> {
    return [
      "3 contrats expirant dans 15 jours",
      "2 demandes de congés en attente",
      "1 absente non déclarée",
    ];
  }

  async generateRecommendations(): Promise<string[]> {
    return [
      "Valider les demandes de congés",
      "Renouveler les contrats qui expirent",
      "Vérifier l'absence non déclarée",
    ];
  }

  async suggestActions(): Promise<AgentAction[]> {
    return [
      {
        id: "validate-leaves",
        label: "Valider demandes de congés",
        description: "Approuver 2 demandes",
        action: () => console.log("Leaves validated"),
        variant: "primary",
      },
      {
        id: "generate-payroll",
        label: "Générer la paie",
        description: "Créer les bulletins",
        action: () => console.log("Payroll generated"),
      },
    ];
  }
}

export class AnalyticsAgent extends BaseAgent {
  role: AgentRole = "analytics";
  name = "Analyste Données";
  description = "Tableau de bord, statistiques et analyse de performance";

  async getGreeting(): Promise<AgentMessage> {
    return {
      greeting: "Bonjour. Bienvenue au tableau de bord analytique.",
      summary:
        "Synthèse du jour: Chiffre d'affaires: 45,230€ (+12% vs hier), Transactions: 128",
      alerts: [
        "Pics d'activité: 14h-16h",
        "Performance: Requêtes en -8% vs semaine passée",
      ],
    };
  }

  async processQuery(query: string): Promise<AgentMessage> {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("chiffre") || lowerQuery.includes("revenu")) {
      return {
        summary: "Chiffre d'affaires du mois: 1,237,450€.",
        recommendations: [
          "Croissance mensuelle: +15% vs dernier mois",
          "Top secteur: Foncier (38% du chiffre)",
        ],
      };
    }

    if (lowerQuery.includes("client") || lowerQuery.includes("utilisateur")) {
      return {
        summary: "Utilisateurs actifs ce mois: 1,247.",
        recommendations: [
          "Rétention: 87%",
          "Utilisateurs nouveaux: +120 cette semaine",
        ],
      };
    }

    if (lowerQuery.includes("performance") || lowerQuery.includes("temps")) {
      return {
        summary: "Temps de réponse moyen API: 145ms.",
        recommendations: [
          "Performance excellente",
          "Charge serveur: 35% de capacité",
        ],
      };
    }

    return {
      summary: "Je n'ai pas compris.",
      recommendations: [
        "Demandez les revenus, clients, ou performance",
      ],
    };
  }

  async detectAnomalies(): Promise<string[]> {
    return [
      "Augmentation anormale de requêtes (22:00-23:00)",
      "Taux d'erreur API: 0.8% (seuil: 0.5%)",
      "Charge serveur: 65% de capacité (alerte à 70%)",
    ];
  }

  async generateRecommendations(): Promise<string[]> {
    return [
      "Vérifier l'activité anormale en fin de soirée",
      "Investiguer les erreurs API",
      "Évaluer un upgrade serveur si trend se poursuit",
    ];
  }

  async suggestActions(): Promise<AgentAction[]> {
    return [
      {
        id: "view-logs",
        label: "Consulter logs API",
        description: "Analyser erreurs",
action: () => {
        console.log("Viewing API logs");
        // TODO: Implement actual log viewing functionality
        // This could involve fetching logs from the backend and displaying them in the UI
        alert("API logs functionality is not implemented yet.");
      },
        variant: "default",
      },
      {
        id: "export-report",
        label: "Exporter rapport",
        description: "PDF du mois",
action: () => {
        console.log("Generating and exporting report...");
        // Simulate fetching data for the report
        const now = new Date();
        // Simulated data: replace with actual data fetching logic
        const filtered: Record<string, any>[] = [
          { date: "2024-01-01", value1: 10, value2: 20 },
          { date: "2024-01-02", value1: 15, value2: 25 },
        ];
        if (filtered.length === 0) {
          const headers = ["date", "value1", "value2"];
          const csvContent = [
            headers.join(","),
            ...Array.from({ length: 30 }, (_, i) => {
              const date = new Date(now.getFullYear(), now.getMonth(), i + 1);
              return [`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`, "0", "0"].join(",");
            })
          ].join("\n");
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `rapport_mensuel_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }
        const headers = Object.keys(filtered[0]);
        const rows = [headers.join(",")];
        for (const record of filtered) {
          const values = headers.map(header => {
            let val = record[header];
            if (typeof val === "string" && val.includes(",")) {
              val = `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          });
          rows.push(values.join(","));
        }
        const csvContent = rows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `rapport_mensuel_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
        variant: "primary",
      },
    ];
  }
}

export class ProjectManagerAgent extends BaseAgent {
  role: AgentRole = "project-manager";
  name = "Chef de Projet";
  description = "Gère projets, tâches, jalons et progression";

  async getGreeting(): Promise<AgentMessage> {
    return {
      greeting: "Bonjour. Résumé des projets en cours.",
      summary: "3 projets actifs, 47 tâches en cours, 12 à commencer.",
      alerts: [
        "1 tâche critique en retard de 3 jours",
        "2 jalons livrés à l'heure cette semaine",
        "Équipe: 8 membres assignés",
      ],
    };
  }

  async processQuery(query: string): Promise<AgentMessage> {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("projet") || lowerQuery.includes("projet")) {
      return {
        summary: "Vous supervisez 3 projets.",
        recommendations: [
          "Projet A: 67% complété (14 jours restants)",
          "Projet B: 42% complété (21 jours restants)",
          "Projet C: 89% complété (3 jours restants)",
        ],
      };
    }

    if (lowerQuery.includes("tâche") || lowerQuery.includes("travail")) {
      return {
        summary: "47 tâches en cours cette semaine.",
        recommendations: [
          "12 tâches prêtes à être commencées",
          "5 tâches bloquées en attente",
        ],
      };
    }

    if (lowerQuery.includes("jalons") || lowerQuery.includes("livrable")) {
      return {
        summary: "Prochains jalons importants.",
        recommendations: [
          "Cette semaine: Livrable sprint 3",
          "Semaine prochaine: Fin phase 2",
        ],
      };
    }

    return {
      summary: "Je n'ai pas compris.",
      recommendations: [
        "Demandez les projets, tâches, ou jalons",
      ],
    };
  }

  async detectAnomalies(): Promise<string[]> {
    return [
      "1 tâche critique en retard de 3 jours",
      "2 tâches sans assignation",
      "Dépense: +18% vs budget estimé",
    ];
  }

  async generateRecommendations(): Promise<string[]> {
    return [
      "Prioriser la tâche critique",
      "Assigner les tâches orphelines",
      "Revoir le budget du projet",
    ];
  }

  async suggestActions(): Promise<AgentAction[]> {
    return [
      {
        id: "escalate-task",
        label: "Escalader tâche critique",
        description: "Notifier leadership",
        action: () => console.log("Task escalated"),
        variant: "destructive",
      },
      {
        id: "assign-tasks",
        label: "Assigner tâches",
        description: "Distribuer le travail",
        action: () => console.log("Tasks assigned"),
        variant: "primary",
      },
    ];
  }
}
