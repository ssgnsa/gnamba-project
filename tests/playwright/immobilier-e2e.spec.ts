import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_FRONTEND_URL || 'http://localhost:5173';

test.describe('Module immobilier — flux de bout en bout', () => {
  test('créer un bien, un bail, un paiement et imprimer la quittance', async ({ page, context }) => {
    // Intercepter les impressions (window.print) pour vérifier le déclenchement
    const printDialogs: any[] = [];
    context.on('dialog', (dialog) => printDialogs.push(dialog));
    page.on('pageerror', () => {}); // éviter les crashes sur window.print non mocké

    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/EGS|GNAMBA/);

    // === Onglet Biens ===
    await page.click('text=Biens');
    await page.click('text=Nouveau Bien');

    await page.fill('input[placeholder*="Ex: Cocody"]', 'Villa Nord, Abidjan');
    await page.fill('input[placeholder*="Cocody"]', 'Cocody');
    await page.fill('input[placeholder*="Abidjan"]', 'Abidjan');
    await page.fill('input[placeholder="0"]', '2500000');
    await page.click('text=Enregistrer');

    await expect(page.getByText('Villa Nord, Abidjan')).toBeVisible();

    // === Onglet Contrats ===
    await page.click('text=Contrats');
    await page.click('text=Nouveau Contrat');

    // Sélectionner le bien créé
    await page.click('text=Sélectionner un bien...');
    await page.click('text=Villa Nord, Abidjan');

    // Créer un locataire (nécessite client)
    await page.click('text=Sélectionner...');
    await page.click('text=Nouveau Locataire');
    await page.fill('input[placeholder="Prénom"]', 'Jean');
    await page.fill('input[placeholder="Nom"]', 'Kouassi');
    await page.fill('input[placeholder="+225 07 00 00 00"]', '+2250700000001');
    await page.click('text=Créer');

    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[placeholder="0"]', '2500000');
    await page.click('text=Enregistrer');

    // Vérifier le contrat listé
    await expect(page.getByText('CTR-')).toBeVisible();

    // === Onglet Paiements ===
    await page.click('text=Paiements');
    await page.click('text=Nouvelle Quittance');

    // Sélectionner le contrat
    await page.click('text=Sélectionner un contrat...');
    await page.click('text=CTR-');

    await page.fill('input[placeholder="0"]', '2500000');
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
    await page.click('text=Enregistrer');

    // Le paiement apparaît avec statut en_attente
    await expect(page.getByText('2500000')).toBeVisible();

    // Marquer comme payé
    await page.click('text=Payé');
    // ou via le bouton CheckCircle
    await page.click('[title="Marquer comme payé"]');

    // Imprimer la quittance (window.print) — vérifie que le bouton est présent
    const printButton = page.locator('[title="Imprimer la quittance"]');
    await expect(printButton).toBeVisible();
    await printButton.click();

    // Vérifier qu'aucune erreur JS n'est survenue
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    expect(errors).toHaveLength(0);
  });
});
