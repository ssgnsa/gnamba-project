const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, LevelFormat, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');

// ─── Palette de couleurs ───────────────────────────────────────────
const C = {
  navy:      '1B2A4A',
  teal:      '0F6E56',
  tealLight: 'E1F5EE',
  amber:     'BA7517',
  amberLight:'FFF8EC',
  red:       'A32D2D',
  redLight:  'FDF0F0',
  gray:      '5F5E5A',
  grayLight: 'F1EFE8',
  grayBorder:'CCCCCC',
  white:     'FFFFFF',
  black:     '000000',
  blue:      '185FA5',
  blueLight: 'E6F1FB',
  green:     '3B6D11',
  greenLight:'EAF3DE',
};

// ─── Utilitaires ───────────────────────────────────────────────────
const border1 = { style: BorderStyle.SINGLE, size: 1, color: C.grayBorder };
const borders  = { top: border1, bottom: border1, left: border1, right: border1 };
const noBorder = { style: BorderStyle.NONE, size: 0, color: C.white };
const noBorders= { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

const cell = (text, opts = {}) => new TableCell({
  borders: opts.noBorder ? noBorders : borders,
  width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
  shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
  margins: { top: 80, bottom: 80, left: 140, right: 140 },
  verticalAlign: VerticalAlign.CENTER,
  children: [new Paragraph({
    children: [new TextRun({
      text,
      bold: opts.bold || false,
      color: opts.color || C.black,
      size: opts.size || 20,
      font: 'Arial',
    })],
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
  })],
});

const hr = (color = C.grayBorder) => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color, space: 1 } },
  spacing: { before: 60, after: 60 },
  children: [],
});

const sp = (n = 120) => new Paragraph({ spacing: { before: n, after: 0 }, children: [] });

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 320, after: 120 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.navy, space: 4 } },
  children: [new TextRun({ text, font: 'Arial', bold: true, size: 32, color: C.navy })],
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 260, after: 100 },
  children: [new TextRun({ text, font: 'Arial', bold: true, size: 26, color: C.teal })],
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 80 },
  children: [new TextRun({ text, font: 'Arial', bold: true, size: 22, color: C.navy })],
});

const body = (text, opts = {}) => new Paragraph({
  spacing: { before: 60, after: 80 },
  children: [new TextRun({ text, font: 'Arial', size: 20, color: C.black, ...opts })],
});

const bullet = (text, ref = 'b1', level = 0) => new Paragraph({
  numbering: { reference: ref, level },
  spacing: { before: 40, after: 40 },
  children: [new TextRun({ text, font: 'Arial', size: 20 })],
});

const code = (text) => new Paragraph({
  spacing: { before: 0, after: 0 },
  children: [new TextRun({ text, font: 'Courier New', size: 18, color: C.navy })],
});

const badge = (label, fill, color) => new Paragraph({
  spacing: { before: 40, after: 40 },
  children: [
    new TextRun({ text: `  ${label}  `, font: 'Arial', size: 18, bold: true, color, highlight: undefined, shading: { fill, type: ShadingType.CLEAR } }),
  ],
});

// Bloc "alerte" (fond coloré, texte)
const alertBlock = (label, lines, fill, borderColor) => {
  const rows = lines.map(l => new TableRow({
    children: [new TableCell({
      borders: noBorders,
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 50, bottom: 50, left: 160, right: 160 },
      children: [new Paragraph({
        spacing: { before: 30, after: 30 },
        children: [new TextRun({ text: l, font: 'Arial', size: 19, color: C.black })],
      })],
    })],
  }));

  const labelRow = new TableRow({
    children: [new TableCell({
      borders: { ...noBorders, left: { style: BorderStyle.SINGLE, size: 12, color: borderColor } },
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 20, left: 160, right: 160 },
      children: [new Paragraph({
        children: [new TextRun({ text: label, font: 'Arial', size: 19, bold: true, color: borderColor })],
      })],
    })],
  });

  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [9026],
    rows: [labelRow, ...rows],
  });
};

const codeBlock = (lines) => {
  const rows = lines.map(l => new TableRow({
    children: [new TableCell({
      borders: noBorders,
      shading: { fill: '1E2A3A', type: ShadingType.CLEAR },
      margins: { top: 20, bottom: 20, left: 200, right: 200 },
      children: [new Paragraph({
        spacing: { before: 20, after: 20 },
        children: [new TextRun({ text: l === '' ? ' ' : l, font: 'Courier New', size: 17, color: '9FE1CB' })],
      })],
    })],
  }));

  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [9026],
    rows,
  });
};

// ─── Tableaux métier ───────────────────────────────────────────────
function makeTable(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  const hRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: C.navy, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 140, right: 140 },
      children: [new Paragraph({
        children: [new TextRun({ text: h, font: 'Arial', bold: true, size: 19, color: C.white })],
      })],
    })),
  });

  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((val, ci) => new TableCell({
      borders,
      width: { size: colWidths[ci], type: WidthType.DXA },
      shading: { fill: ri % 2 === 0 ? C.white : C.grayLight, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 140, right: 140 },
      children: [new Paragraph({
        children: [new TextRun({ text: val, font: 'Arial', size: 19, color: C.black })],
      })],
    })),
  }));

  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: colWidths, rows: [hRow, ...dataRows] });
}

// ─── Statut badge inline ───────────────────────────────────────────
const riskRun = (level) => {
  const map = { 'Faible': [C.greenLight, C.green], 'Moyen': [C.amberLight, C.amber], 'Élevé': [C.redLight, C.red] };
  const [fill, color] = map[level] || [C.grayLight, C.gray];
  return new TextRun({ text: ` ${level} `, font: 'Arial', size: 18, bold: true, color, shading: { fill, type: ShadingType.CLEAR } });
};

// ─── DOCUMENT ─────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      { reference: 'b1', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 600, hanging: 300 } } } }] },
      { reference: 'b2', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2013', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 900, hanging: 300 } } } }] },
      { reference: 'n1', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 600, hanging: 300 } } } }] },
    ],
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 20 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, font: 'Arial', color: C.navy }, paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, font: 'Arial', color: C.teal }, paragraph: { spacing: { before: 260, after: 100 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 22, bold: true, font: 'Arial', color: C.navy }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1200, right: 1200, bottom: 1200, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.navy, space: 4 } },
          spacing: { before: 0, after: 80 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: 'AUDIT TECHNIQUE — gnambaservices.ci', font: 'Arial', size: 17, bold: true, color: C.navy }),
            new TextRun({ text: '\tCONFIDENTIEL — Usage interne', font: 'Arial', size: 17, color: C.gray }),
          ],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.grayBorder, space: 4 } },
          spacing: { before: 80, after: 0 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: 'Équipe technique — Juin 2026', font: 'Arial', size: 17, color: C.gray }),
            new TextRun({ text: '\tPage ', font: 'Arial', size: 17, color: C.gray }),
            new PageNumber({ font: 'Arial', size: 17, color: C.gray }),
          ],
        })],
      }),
    },
    children: [

      // ══════════════════════════════════════════════
      // PAGE DE GARDE
      // ══════════════════════════════════════════════
      sp(600),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: 'AUDIT TECHNIQUE', font: 'Arial', bold: true, size: 56, color: C.navy })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 200 },
        children: [new TextRun({ text: 'gnambaservices.ci — ERP & Plateforme commerciale', font: 'Arial', size: 28, color: C.teal })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 8, color: C.navy }, bottom: { style: BorderStyle.SINGLE, size: 8, color: C.navy } },
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: 'Guide d\'implémentation pour l\'équipe de développement', font: 'Arial', size: 22, color: C.gray })],
      }),
      sp(200),
      makeTable(['Champ','Valeur'], [
        ['Version','1.0'],
        ['Date','Juin 2026'],
        ['Statut','Confidentiel — Usage interne équipe dev'],
        ['Périmètre','Intégration sans régression — gnambaservices.ci'],
        ['Stack','PHP / Laravel · MySQL · React · JS vanilla'],
      ], [3000, 6026]),
      sp(400),
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════
      // SECTION 1 — CONTEXTE & DIAGNOSTIC
      // ══════════════════════════════════════════════
      h1('1. Contexte & diagnostic technique'),
      h2('1.1 Périmètre fonctionnel'),
      body('La plateforme gnambaservices.ci couvre quatre domaines métiers distincts qui partagent une base de données commune :'),
      bullet('Immobilier : terrains, lots, maisons (cycle de vente long, confiance documentaire élevée)'),
      bullet('Produits tech : ordinateurs, fournitures de bureau (gestion de stock, livraison)'),
      bullet('Services : devis, facturation, suivi d\'exécution'),
      bullet('Administration : utilisateurs, rôles, commissions, reporting'),
      sp(),
      h2('1.2 Problèmes identifiés'),
      alertBlock('Risque principal identifié', [
        'La coexistence de 4 domaines métiers sans segmentation de données produit un schéma',
        'trop généraliste. Chaque entité (bien immobilier, produit, lead) partage les mêmes',
        'tables génériques, ce qui rend impossible un pilotage par KPI fiable et cohérent.',
      ], C.redLight, C.red),
      sp(),
      makeTable(['Problème','Impact','Priorité'], [
        ['Tables métier non différenciées','Requêtes lentes, reporting impossible','P0'],
        ['Absence de 2FA sur l\'admin','Risque sécurité critique','P0'],
        ['Pas de journal de modifications','Auditabilité nulle sur les fiches','P1'],
        ['Absence de CRM','Perte de leads non traquée','P1'],
        ['Aucun KPI temps réel','Pilotage à l\'aveugle','P1'],
        ['Pas de géolocalisation','Conversion immobilier réduite','P2'],
        ['Aucune automatisation IA','Compétitivité réduite','P2'],
      ], [3500, 3500, 2026]),
      sp(),
      h2('1.3 Modules cibles'),
      makeTable(['Module','Rôle technique','Priorité'], [
        ['properties','Terrains, lots, maisons, GPS, statut juridique','P0'],
        ['leads + CRM','Pipeline, interactions, scoring, relances','P0'],
        ['attachments','Documents liés aux entités (pivot générique)','P1'],
        ['audit_logs','Journal immuable via trigger SQL','P1'],
        ['v_kpi_*','Vues analytiques lecture seule','P1'],
        ['chatbot','Widget IA flottant isolé','P2'],
        ['geojson','Carte Leaflet pour l\'immobilier','P2'],
      ], [2600, 4200, 2226]),

      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════
      // SECTION 2 — PRINCIPES D'INTÉGRATION
      // ══════════════════════════════════════════════
      h1('2. Principes d\'intégration sans régression'),
      body('Toute modification de la codebase doit respecter ces quatre règles sans exception. Elles sont non-négociables pour l\'équipe dev.'),
      sp(),
      h2('Règle 1 — Additif avant invasif'),
      body('Créer de nouvelles tables / colonnes nullable / modules dans de nouveaux dossiers. Ne jamais restructurer une table existante avant que la migration additive soit validée en production.'),
      h2('Règle 2 — Feature flags systématiques'),
      body('Chaque nouveau module est contrôlé par une variable d\'environnement. En cas d\'incident, un changement de valeur suffit à désactiver la fonctionnalité sans rollback de code.'),
      codeBlock([
        '# .env — variables de contrôle des modules',
        'CRM_ENABLED=true',
        'AI_ENABLED=true',
        'MAP_ENABLED=true',
        'REPORTS_ENABLED=true',
      ]),
      sp(),
      h2('Règle 3 — Fallback gracieux obligatoire'),
      body('Tout appel à un service externe (API IA, SMS, carte) est encapsulé dans un bloc try/catch. En cas de panne du service tiers, la section UI est masquée silencieusement. L\'application ne peut jamais planter à cause d\'une dépendance externe.'),
      h2('Règle 4 — Déploiement progressif (canary)'),
      body('Chaque phase est déployée d\'abord sur l\'environnement staging, surveillée 48h, puis étendue à 100% du trafic. Si un KPI de surveillance dépasse son seuil d\'alerte, le rollback est immédiat.'),
      sp(),
      alertBlock('Règle d\'or absolue', [
        'Ne jamais supprimer avant de remplacer. Chaque amélioration est construite à côté du',
        'code existant, testée et validée en production. L\'ancien code est retiré uniquement',
        'après confirmation complète sur 100% du trafic.',
      ], C.blueLight, C.blue),

      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════
      // SECTION 3 — ROADMAP
      // ══════════════════════════════════════════════
      h1('3. Roadmap d\'implémentation'),
      h2('Phase 1 — Semaines 1–4 (Fondations)'),
      makeTable(['Action','Méthode technique','Risque'], [
        ['Création tables properties, attachments, audit_logs','CREATE TABLE additive','Faible'],
        ['Trigger audit sur properties','DB trigger passif','Faible'],
        ['Vues KPI v_kpi_properties','CREATE VIEW lecture seule','Faible'],
        ['2FA admin','Middleware sur /admin/* uniquement','Faible'],
      ], [3600, 3600, 1826]),
      sp(),
      h2('Phase 2 — Mois 1–2 (CRM & UX)'),
      makeTable(['Action','Méthode technique','Risque'], [
        ['Tables leads, lead_interactions, reminder_queue','Nouvelles tables + feature flag','Moyen'],
        ['Service de scoring des leads','Calcul temps réel, colonne lead_score','Faible'],
        ['Cron de relances (WhatsApp/SMS/email)','Queue indépendante + try/catch','Moyen'],
        ['Filtres avancés immobilier','Query params + UI front seulement','Faible'],
        ['Gestion des pièces jointes','Table pivot attachments + stockage','Moyen'],
      ], [3200, 3600, 2226]),
      sp(),
      h2('Phase 3 — Mois 2–4 (IA & innovations)'),
      makeTable(['Action','Méthode technique','Risque'], [
        ['Générateur de fiche IA','API Anthropic + retour brouillon uniquement','Moyen'],
        ['Widget chatbot flottant','Fichier JS autonome, zéro dépendance DB','Faible'],
        ['Carte interactive Leaflet','GeoJSON endpoint + composant optionnel','Moyen'],
        ['Rapport PDF mensuel','Cron + générateur PDF, email dirigeant','Faible'],
      ], [3200, 3600, 2226]),
      sp(),
      h2('Phase 4 — Mois 4–6 (Analytique)'),
      makeTable(['Action','Méthode technique','Risque'], [
        ['Moteur de recommandation','Microservice séparé, accès lecture seule','Moyen'],
        ['API publique partenaires','API Gateway + auth token, lecture seule','Moyen'],
        ['Score de maturité avancé','Enrichissement scoring Phase 2','Faible'],
      ], [3200, 3600, 2226]),

      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════
      // SECTION 4 — BASE DE DONNÉES
      // ══════════════════════════════════════════════
      h1('4. Base de données — Migrations SQL'),
      alertBlock('Prérequis absolu', [
        'Effectuer un dump complet avant toute migration :',
        'mysqldump -u root -p gnamba_db > backup_$(date +%F).sql',
        'Vérifier la taille du fichier de sauvegarde avant de continuer.',
      ], C.amberLight, C.amber),
      sp(),
      h2('4.1 Table properties'),
      codeBlock([
        'CREATE TABLE properties (',
        '  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,',
        '  ref         VARCHAR(20) UNIQUE NOT NULL,',
        '  type        ENUM(\'terrain\',\'lot\',\'maison\') NOT NULL,',
        '  title       VARCHAR(255) NOT NULL,',
        '  description TEXT,',
        '  price       DECIMAL(15,2) NOT NULL,',
        '  surface_m2  DECIMAL(10,2),',
        '  city        VARCHAR(100),',
        '  district    VARCHAR(100),',
        '  latitude    DECIMAL(10,7),   -- nullable : carte optionnelle',
        '  longitude   DECIMAL(10,7),',
        '  status      ENUM(\'disponible\',\'reserve\',\'vendu\') DEFAULT \'disponible\',',
        '  legal_doc   VARCHAR(255),',
        '  created_by  BIGINT UNSIGNED,',
        '  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,',
        '  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,',
        '  INDEX idx_type_status (type, status),',
        '  INDEX idx_city (city)',
        ');',
      ]),
      sp(),
      h2('4.2 Table attachments (pivot générique)'),
      codeBlock([
        'CREATE TABLE attachments (',
        '  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,',
        '  entity_type  VARCHAR(50) NOT NULL,  -- \'property\', \'product\', \'lead\'',
        '  entity_id    BIGINT UNSIGNED NOT NULL,',
        '  file_name    VARCHAR(255) NOT NULL,',
        '  file_path    VARCHAR(500) NOT NULL,',
        '  file_size    INT UNSIGNED,',
        '  mime_type    VARCHAR(100),',
        '  uploaded_by  BIGINT UNSIGNED,',
        '  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,',
        '  INDEX idx_entity (entity_type, entity_id)',
        ');',
      ]),
      sp(),
      h2('4.3 Table audit_logs + trigger'),
      codeBlock([
        'CREATE TABLE audit_logs (',
        '  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,',
        '  table_name  VARCHAR(100) NOT NULL,',
        '  record_id   BIGINT UNSIGNED NOT NULL,',
        '  action      ENUM(\'INSERT\',\'UPDATE\',\'DELETE\') NOT NULL,',
        '  old_values  JSON,',
        '  new_values  JSON,',
        '  user_id     BIGINT UNSIGNED,',
        '  ip_address  VARCHAR(45),',
        '  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,',
        '  INDEX idx_record (table_name, record_id),',
        '  INDEX idx_created (created_at)',
        ');',
        '',
        'DELIMITER $$',
        'CREATE TRIGGER trg_properties_audit',
        'AFTER UPDATE ON properties',
        'FOR EACH ROW BEGIN',
        '  INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values)',
        '  VALUES (\'properties\', OLD.id, \'UPDATE\',',
        '    JSON_OBJECT(\'status\', OLD.status, \'price\', OLD.price),',
        '    JSON_OBJECT(\'status\', NEW.status, \'price\', NEW.price)',
        '  );',
        'END$$',
        'DELIMITER ;',
      ]),
      sp(),
      h2('4.4 Vues analytiques KPI'),
      codeBlock([
        '-- Vue immobilier (lecture seule)',
        'CREATE OR REPLACE VIEW v_kpi_properties AS',
        'SELECT',
        '  type,',
        '  COUNT(*)                                                 AS total,',
        '  SUM(CASE WHEN status = \'disponible\' THEN 1 ELSE 0 END)  AS disponibles,',
        '  SUM(CASE WHEN status = \'vendu\'      THEN 1 ELSE 0 END)  AS vendus,',
        '  AVG(price)                                               AS prix_moyen,',
        '  SUM(CASE WHEN status = \'vendu\' THEN price ELSE 0 END)   AS ca_total',
        'FROM properties',
        'GROUP BY type;',
        '',
        '-- Vue leads hebdomadaire (après création du module CRM)',
        'CREATE OR REPLACE VIEW v_kpi_leads_weekly AS',
        'SELECT',
        '  YEARWEEK(created_at, 1)                                  AS semaine,',
        '  COUNT(*)                                                  AS nb_leads,',
        '  SUM(CASE WHEN status = \'converti\' THEN 1 ELSE 0 END)    AS convertis',
        'FROM leads',
        'GROUP BY YEARWEEK(created_at, 1)',
        'ORDER BY semaine DESC;',
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════
      // SECTION 5 — AUTH & SÉCURITÉ
      // ══════════════════════════════════════════════
      h1('5. Authentification & sécurité (2FA)'),
      h2('5.1 Migration de la table users'),
      body('Les colonnes sont ajoutées en nullable. Les comptes existants ne sont pas affectés.'),
      codeBlock([
        'ALTER TABLE users',
        '  ADD COLUMN totp_secret   VARCHAR(32)  NULL AFTER password,',
        '  ADD COLUMN totp_enabled  TINYINT(1)   DEFAULT 0 AFTER totp_secret,',
        '  ADD COLUMN last_2fa_at   TIMESTAMP    NULL AFTER totp_enabled;',
      ]),
      sp(),
      h2('5.2 Installation'),
      codeBlock([
        '# PHP / Laravel',
        'composer require pragmarx/google2fa-laravel',
        '',
        '# Node.js / Express',
        'npm install speakeasy qrcode',
      ]),
      sp(),
      h2('5.3 Middleware Require2FA'),
      codeBlock([
        '// app/Http/Middleware/Require2FA.php',
        'class Require2FA',
        '{',
        '    public function handle(Request $request, Closure $next)',
        '    {',
        '        $user = $request->user();',
        '        if ($user->totp_enabled && !session(\'2fa_verified\')) {',
        '            return redirect()->route(\'admin.2fa.challenge\');',
        '        }',
        '        return $next($request);',
        '    }',
        '}',
        '',
        '// Enregistrer dans Kernel.php — routes admin seulement',
        'protected $middlewareGroups = [',
        '    \'admin\' => [\'auth\', \\App\\Http\\Middleware\\Require2FA::class],',
        '];',
      ]),
      sp(),
      h2('5.4 Vérification du code TOTP'),
      codeBlock([
        'public function verify(Request $request)',
        '{',
        '    $user  = $request->user();',
        '    $valid = app(Google2FA::class)->verifyKey(',
        '        $user->totp_secret,',
        '        $request->input(\'code\')',
        '    );',
        '    if ($valid) {',
        '        session([\'2fa_verified\' => true]);',
        '        $user->update([\'last_2fa_at\' => now()]);',
        '        return redirect()->intended(\'/admin/dashboard\');',
        '    }',
        '    return back()->withErrors([\'code\' => \'Code invalide\']);',
        '}',
      ]),
      sp(),
      alertBlock('Procédure de déploiement 2FA', [
        '1. Déployer le middleware en mode optionnel (totp_enabled = 0 pour tous)',
        '2. Activer le 2FA sur votre propre compte admin en premier',
        '3. Tester le flux complet (QR code, vérification, session)',
        '4. Activer compte par compte sur les autres admins',
        '5. Rendre obligatoire (totp_enabled = 1 par défaut) après validation complète',
      ], C.tealLight, C.teal),

      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════
      // SECTION 6 — MODULE CRM
      // ══════════════════════════════════════════════
      h1('6. Module CRM'),
      h2('6.1 Feature flag'),
      codeBlock([
        '# .env',
        'CRM_ENABLED=true',
        'CRM_REMINDER_CHANNEL=whatsapp   # whatsapp | sms | email',
        'WHATSAPP_API_KEY=your_key_here',
      ]),
      sp(),
      h2('6.2 Tables CRM'),
      codeBlock([
        'CREATE TABLE leads (',
        '  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,',
        '  full_name    VARCHAR(150) NOT NULL,',
        '  phone        VARCHAR(20),',
        '  email        VARCHAR(150),',
        '  interest     VARCHAR(255),',
        '  source       VARCHAR(50),   -- \'site\', \'whatsapp\', \'referral\'',
        '  status       ENUM(\'nouveau\',\'contacte\',\'negocie\',\'converti\',\'perdu\')',
        '               DEFAULT \'nouveau\',',
        '  lead_score   TINYINT UNSIGNED DEFAULT 0,',
        '  assigned_to  BIGINT UNSIGNED NULL,',
        '  customer_id  BIGINT UNSIGNED NULL,  -- FK optionnelle',
        '  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,',
        '  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ');',
        '',
        'CREATE TABLE lead_interactions (',
        '  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,',
        '  lead_id    BIGINT UNSIGNED NOT NULL,',
        '  type       ENUM(\'appel\',\'email\',\'whatsapp\',\'visite\',\'relance\') NOT NULL,',
        '  notes      TEXT,',
        '  done_by    BIGINT UNSIGNED,',
        '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,',
        '  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE',
        ');',
        '',
        'CREATE TABLE reminder_queue (',
        '  id       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,',
        '  lead_id  BIGINT UNSIGNED NOT NULL,',
        '  channel  VARCHAR(20) NOT NULL,',
        '  message  TEXT NOT NULL,',
        '  send_at  TIMESTAMP NOT NULL,',
        '  sent     TINYINT(1) DEFAULT 0,',
        '  sent_at  TIMESTAMP NULL,',
        '  INDEX idx_unsent (sent, send_at)',
        ');',
      ]),
      sp(),
      h2('6.3 Service de scoring des leads'),
      codeBlock([
        '// app/Services/LeadScoringService.php',
        'class LeadScoringService',
        '{',
        '    public function calculate(Lead $lead): int',
        '    {',
        '        $score = 0;',
        '        $interactions = $lead->interactions;',
        '',
        '        // +10 par interaction dans les 7 derniers jours',
        '        $score += $interactions',
        '            ->where(\'created_at\', \'>=\', now()->subDays(7))',
        '            ->count() * 10;',
        '',
        '        // +20 si visite physique',
        '        if ($interactions->where(\'type\', \'visite\')->isNotEmpty()) $score += 20;',
        '',
        '        // +15 si réponse WhatsApp',
        '        if ($interactions->where(\'type\', \'whatsapp\')->isNotEmpty()) $score += 15;',
        '',
        '        // -5 par jour sans contact, plafond -30',
        '        $last = $interactions->max(\'created_at\');',
        '        if ($last) $score -= min(30, now()->diffInDays($last) * 5);',
        '',
        '        return max(0, min(100, $score));',
        '    }',
        '}',
      ]),
      sp(),
      h2('6.4 Cron de relances automatiques'),
      codeBlock([
        '// Crontab : * * * * * php artisan reminders:process',
        'public function handle()',
        '{',
        '    if (!config(\'crm.enabled\')) return;',
        '',
        '    $due = ReminderQueue::where(\'sent\', 0)',
        '        ->where(\'send_at\', \'<=\', now())',
        '        ->limit(50)->get();',
        '',
        '    foreach ($due as $reminder) {',
        '        try {',
        '            match ($reminder->channel) {',
        '                \'whatsapp\' => $this->sendWhatsApp($reminder),',
        '                \'sms\'      => $this->sendSms($reminder),',
        '                \'email\'    => $this->sendEmail($reminder),',
        '            };',
        '            $reminder->update([\'sent\' => 1, \'sent_at\' => now()]);',
        '        } catch (\\Exception $e) {',
        '            // Erreur isolée : les autres relances continuent',
        '            Log::error("Reminder {$reminder->id}: " . $e->getMessage());',
        '        }',
        '    }',
        '}',
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════
      // SECTION 7 — KPI & REPORTING
      // ══════════════════════════════════════════════
      h1('7. KPI & tableau de bord'),
      h2('7.1 Endpoint API KPI'),
      codeBlock([
        '// routes/api.php',
        'Route::middleware([\'auth:sanctum\', \'role:admin\'])',
        '    ->prefix(\'admin\')',
        '    ->group(function () {',
        '        Route::get(\'/kpis\', [KpiController::class, \'index\']);',
        '    });',
        '',
        '// app/Http/Controllers/KpiController.php',
        'public function index()',
        '{',
        '    return response()->json([',
        '        \'properties\'         => DB::select(\'SELECT * FROM v_kpi_properties\'),',
        '        \'leads_weekly\'       => DB::select(\'SELECT * FROM v_kpi_leads_weekly LIMIT 8\'),',
        '        \'avg_response_hours\' => DB::scalar(',
        '            \'SELECT AVG(TIMESTAMPDIFF(HOUR, l.created_at, i.created_at))',
        '             FROM leads l',
        '             JOIN lead_interactions i ON i.lead_id = l.id',
        '             WHERE i.id = (SELECT MIN(id) FROM lead_interactions WHERE lead_id = l.id)\'',
        '        ),',
        '        \'generated_at\'       => now()->toIso8601String(),',
        '    ]);',
        '}',
      ]),
      sp(),
      h2('7.2 Rapport PDF mensuel (cron)'),
      codeBlock([
        '// Crontab : 0 8 1 * * php artisan report:monthly',
        'public function handle()',
        '{',
        '    $data = [',
        '        \'month\'      => now()->subMonth()->format(\'F Y\'),',
        '        \'properties\' => DB::select(\'SELECT * FROM v_kpi_properties\'),',
        '        \'leads\'      => DB::select(\'SELECT * FROM v_kpi_leads_weekly LIMIT 4\'),',
        '    ];',
        '',
        '    $pdf  = PDF::loadView(\'reports.monthly\', $data);',
        '    $path = storage_path(\'reports/rapport_\' . now()->format(\'Y_m\') . \'.pdf\');',
        '    $pdf->save($path);',
        '',
        '    Mail::to(config(\'app.director_email\'))',
        '        ->send(new MonthlyReportMail($path));',
        '',
        '    Log::info(\'Rapport mensuel envoyé.\');',
        '}',
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════
      // SECTION 8 — IA & AUTOMATISATION
      // ══════════════════════════════════════════════
      h1('8. IA & automatisation'),
      h2('8.1 Configuration'),
      codeBlock([
        '# .env',
        'AI_ENABLED=true',
        'AI_PROVIDER=anthropic',
        'ANTHROPIC_API_KEY=sk-ant-...',
        'AI_MODEL=claude-haiku-4-5-20251001  # modèle léger = coût réduit',
      ]),
      sp(),
      h2('8.2 Générateur de fiche immobilière (IA)'),
      alertBlock('Principe de sécurité', [
        'L\'IA retourne toujours un BROUILLON. Aucune écriture automatique en base.',
        'L\'utilisateur valide et corrige avant de sauvegarder.',
        'En cas de panne de l\'API IA, le formulaire classique reste accessible.',
      ], C.tealLight, C.teal),
      sp(),
      codeBlock([
        '// POST /api/ai/generate-listing',
        'public function generateListing(Request $request)',
        '{',
        '    if (!config(\'ai.enabled\')) {',
        '        return response()->json([\'error\' => \'IA désactivée\'], 503);',
        '    }',
        '',
        '    $prompt = "Tu es un assistant immobilier en Côte d\'Ivoire.',
        'Génère un objet JSON structuré à partir de cette description.',
        'Ne réponds qu\'en JSON valide, sans texte autour.',
        '',
        'Description : {$request->input(\'raw_description\')}',
        '',
        'JSON attendu :',
        '{\"title\":\"...\",\"type\":\"terrain|lot|maison\",\"city\":\"...\",',
        '\"district\":\"...\",\"surface_m2\":null,\"price\":null,',
        '\"description\":\"...\",\"status\":\"disponible\"}";',
        '',
        '    try {',
        '        $response = Http::withHeaders([',
        '            \'x-api-key\'         => config(\'ai.anthropic_key\'),',
        '            \'anthropic-version\' => \'2023-06-01\',',
        '        ])->post(\'https://api.anthropic.com/v1/messages\', [',
        '            \'model\'      => config(\'ai.model\'),',
        '            \'max_tokens\' => 500,',
        '            \'messages\'   => [[\'role\' => \'user\', \'content\' => $prompt]],',
        '        ]);',
        '        $data = json_decode($response->json(\'content.0.text\'), true);',
        '        return response()->json([\'draft\' => $data]);  // BROUILLON uniquement',
        '    } catch (\\Exception $e) {',
        '        return response()->json([\'error\' => \'Service IA indisponible\'], 503);',
        '    }',
        '}',
      ]),
      sp(),
      h2('8.3 Widget chatbot flottant'),
      body('Fichier JS autonome. Aucune dépendance sur la base de données. Activable/désactivable en retirant la balise <script>.'),
      codeBlock([
        '// public/js/chatbot.js',
        '// Inclure via : <script src="/js/chatbot.js"></script>',
        '(function () {',
        '    const btn = document.createElement(\'button\');',
        '    btn.innerHTML = \'Assistant\';',
        '    btn.style.cssText = \'position:fixed;bottom:24px;right:24px;padding:10px 18px;\'',
        '      + \'background:#1D9E75;color:#fff;border:none;border-radius:24px;\'',
        '      + \'cursor:pointer;z-index:9999;\';',
        '    document.body.appendChild(btn);',
        '',
        '    // ... (voir source complète dans /public/js/chatbot.js)',
        '',
        '    async function sendMessage() {',
        '        try {',
        '            const res  = await fetch(\'/api/chatbot\', {',
        '                method: \'POST\',',
        '                headers: { \'Content-Type\': \'application/json\' },',
        '                body: JSON.stringify({ message: text }),',
        '            });',
        '            const data = await res.json();',
        '            msgs.innerHTML += `<p><strong>Assistant :</strong> ${data.reply}</p>`;',
        '        } catch {',
        '            msgs.innerHTML += \'<p>Service temporairement indisponible.</p>\';',
        '        }',
        '    }',
        '})();',
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════
      // SECTION 9 — CARTE LEAFLET
      // ══════════════════════════════════════════════
      h1('9. Carte interactive (Leaflet.js)'),
      h2('9.1 Colonnes GPS (migration douce)'),
      codeBlock([
        '-- Colonnes nullable = aucun impact sur les fiches sans coordonnées',
        'ALTER TABLE properties',
        '  ADD COLUMN latitude  DECIMAL(10,7) NULL,',
        '  ADD COLUMN longitude DECIMAL(10,7) NULL;',
        '',
        '-- Vérification',
        'SELECT COUNT(*) AS sans_coords FROM properties WHERE latitude IS NULL;',
      ]),
      sp(),
      h2('9.2 Endpoint GeoJSON'),
      codeBlock([
        '// GET /api/properties/geojson?type=terrain',
        'public function geojson(Request $request)',
        '{',
        '    $features = Property::whereNotNull(\'latitude\')',
        '        ->whereNotNull(\'longitude\')',
        '        ->where(\'status\', \'disponible\')',
        '        ->when($request->type, fn($q, $t) => $q->where(\'type\', $t))',
        '        ->get()',
        '        ->map(fn($p) => [',
        '            \'type\'       => \'Feature\',',
        '            \'geometry\'   => [\'type\' => \'Point\', \'coordinates\' => [(float)$p->longitude, (float)$p->latitude]],',
        '            \'properties\' => [\'id\' => $p->id, \'title\' => $p->title, \'price\' => $p->price, \'url\' => "/biens/{$p->id}"],',
        '        ]);',
        '',
        '    return response()->json([\'type\' => \'FeatureCollection\', \'features\' => $features]);',
        '}',
      ]),
      sp(),
      h2('9.3 Composant carte (JS)'),
      codeBlock([
        '// Dans le HTML de la page liste :',
        '// <div id="map-container" data-type="terrain" style="height:400px"></div>',
        '',
        'function initPropertyMap(containerId) {',
        '    const el = document.getElementById(containerId);',
        '    if (!el) return;  // Fallback gracieux : pas de container = pas de carte',
        '',
        '    const map = L.map(containerId).setView([5.345, -4.008], 11); // Abidjan',
        '',
        '    L.tileLayer(\'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png\', {',
        '        attribution: \'© OpenStreetMap contributors\'',
        '    }).addTo(map);',
        '',
        '    fetch(`/api/properties/geojson?type=${el.dataset.type || \'\'}`) ',
        '        .then(r => r.json())',
        '        .then(geojson => {',
        '            L.geoJSON(geojson, {',
        '                pointToLayer: (f, latlng) => L.circleMarker(latlng,',
        '                    { radius: 8, fillColor: \'#1D9E75\', color: \'#085041\',',
        '                      weight: 1, fillOpacity: 0.8 }),',
        '                onEachFeature: (f, layer) => layer.bindPopup(',
        '                    `<strong>${f.properties.title}</strong><br>',
        '                     ${Number(f.properties.price).toLocaleString(\'fr-CI\')} FCFA<br>',
        '                     <a href="${f.properties.url}">Voir la fiche →</a>`',
        '                ),',
        '            }).addTo(map);',
        '        })',
        '        .catch(() => { el.style.display = \'none\'; }); // Cache si API hors ligne',
        '}',
        '',
        'document.addEventListener(\'DOMContentLoaded\', () => initPropertyMap(\'map-container\'));',
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════
      // SECTION 10 — ARCHITECTURE & CONVENTIONS
      // ══════════════════════════════════════════════
      h1('10. Architecture & conventions de code'),
      h2('10.1 Structure des dossiers'),
      codeBlock([
        'gnambaservices.ci/',
        '├── app/',
        '│   ├── Http/',
        '│   │   ├── Controllers/',
        '│   │   │   ├── PropertyController.php',
        '│   │   │   ├── KpiController.php',
        '│   │   │   ├── AiController.php',
        '│   │   │   └── ChatbotController.php',
        '│   │   └── Middleware/',
        '│   │       └── Require2FA.php',
        '│   ├── Models/',
        '│   │   ├── Property.php',
        '│   │   ├── Lead.php',
        '│   │   ├── LeadInteraction.php',
        '│   │   ├── Attachment.php',
        '│   │   └── AuditLog.php',
        '│   ├── Services/',
        '│   │   └── LeadScoringService.php',
        '│   └── Console/Commands/',
        '│       ├── ProcessReminders.php',
        '│       └── GenerateMonthlyReport.php',
        '├── database/migrations/',
        '│   ├── ..._create_properties_table.php',
        '│   ├── ..._create_leads_table.php',
        '│   ├── ..._create_attachments_table.php',
        '│   └── ..._create_audit_logs_table.php',
        '├── modules/crm/          ← module CRM isolé',
        '│   ├── routes.php',
        '│   ├── views/',
        '│   └── tests/',
        '├── public/js/',
        '│   ├── chatbot.js        ← widget IA flottant',
        '│   └── map.js            ← carte Leaflet',
        '└── resources/js/components/',
        '    └── KpiDashboard.jsx',
      ]),
      sp(),
      h2('10.2 Conventions de nommage'),
      makeTable(['Élément','Convention','Exemple'], [
        ['Tables nouvelles','snake_case','properties, lead_interactions'],
        ['Vues analytiques','préfixe v_','v_kpi_properties, v_kpi_leads_weekly'],
        ['Triggers','préfixe trg_','trg_properties_audit'],
        ['Routes API admin','/api/admin/* + auth middleware','GET /api/admin/kpis'],
        ['Routes publiques','/api/public/* sans auth','GET /api/public/properties'],
        ['Routes IA','/api/ai/* + feature flag check','POST /api/ai/generate-listing'],
        ['Feature flags','UPPERCASE en .env','CRM_ENABLED, AI_ENABLED'],
      ], [2500, 3200, 3326]),

      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════
      // SECTION 11 — CHECKLIST DE DÉPLOIEMENT
      // ══════════════════════════════════════════════
      h1('11. Checklist de déploiement'),
      h2('11.1 Avant chaque déploiement'),
      bullet('Dump de la base de données effectué et taille vérifiée'),
      bullet('Branche feature testée sur l\'environnement staging'),
      bullet('Migrations jouées sur une copie de la base de production'),
      bullet('Feature flag désactivé par défaut au premier déploiement'),
      bullet('Logs configurés pour la nouvelle fonctionnalité'),
      bullet('Plan de rollback documenté dans le ticket de déploiement'),
      sp(),
      h2('11.2 Ordre d\'exécution — Phase 1'),
      makeTable(['Ordre','Action','Commande / vérification'], [
        ['1','Dump de sauvegarde','mysqldump -u root -p gnamba_db > backup_YYYY-MM-DD.sql'],
        ['2','CREATE TABLE properties','mysql -e "SHOW TABLES LIKE \'properties\'"'],
        ['3','CREATE TABLE attachments','mysql -e "SHOW TABLES LIKE \'attachments\'"'],
        ['4','CREATE TABLE audit_logs + trigger','mysql -e "SHOW TRIGGERS"'],
        ['5','CREATE VIEW v_kpi_properties','mysql -e "SELECT * FROM v_kpi_properties LIMIT 1"'],
        ['6','ALTER TABLE users (2FA)','mysql -e "DESCRIBE users" | grep totp'],
        ['7','Déployer middleware Require2FA','Tester /admin/dashboard → redirection 2FA'],
        ['8','Activer 2FA sur compte admin test','Vérifier session 2fa_verified = true'],
      ], [600, 2600, 5826]),
      sp(),
      h2('11.3 KPI de surveillance post-déploiement'),
      makeTable(['KPI','Seuil d\'alerte','Action si dépassé'], [
        ['Temps de réponse moyen','> 2 secondes','Rollback + optimisation des requêtes'],
        ['Taux d\'erreur HTTP 5xx','> 1%','Rollback immédiat'],
        ['Leads créés par semaine','Baisse > 20%','Vérification du middleware CRM'],
        ['Taux de conversion','Baisse > 10%','Audit UX + logs d\'erreur'],
        ['Disponibilité uptime','< 99,5%','Incident P1 — astreinte immédiate'],
        ['Latence API IA','>  3 secondes','Désactiver AI_ENABLED temporairement'],
      ], [2800, 2600, 3626]),
      sp(),
      alertBlock('Critère de rollback immédiat', [
        'Si l\'un des seuils ci-dessus est dépassé dans les 2 heures suivant un déploiement,',
        'le rollback est exécuté sans attendre de diagnostic approfondi.',
        'Le diagnostic se fait toujours sur la version précédente stable.',
      ], C.redLight, C.red),
      sp(),

      // ──────────────────────────────────────────────
      // PIED DE DOCUMENT
      // ──────────────────────────────────────────────
      sp(200),
      hr(C.navy),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 60 },
        children: [new TextRun({ text: 'Document confidentiel — Équipe technique gnambaservices.ci — Juin 2026', font: 'Arial', size: 17, color: C.gray, italics: true })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: 'Toute reproduction ou diffusion hors équipe est interdite sans autorisation de la direction.', font: 'Arial', size: 17, color: C.gray, italics: true })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
 fs.writeFileSync('./audit_technique_gnambaservices.docx', buf);
  console.log('OK');
 });
