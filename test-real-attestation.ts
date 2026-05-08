import { buildAttestationCoutumiereHTML } from './src/utils/print';

// Simule des données réelles depuis la base de données
const testData = {
  reference: 'ATT-20260505-9999',
  numero_enregistrement: 'REG-20260505-001',
  region: 'AGNEBY-TIASSA',
  departement: 'DE SIKENSI',
  commune: 'DE SIKENSI',
  village: 'VILLAGE DE KATADJI',
  proprietaire_nom: 'KOUAME',
  proprietaire_prenom: 'Jean Paul',
  proprietaire_naissance_date: '15/01/1980',
  proprietaire_naissance_lieu: 'Yamoussoukro',
  proprietaire_profession: 'Agriculteur',
  proprietaire_telephone: '+225 07 12 34 56 78',
  proprietaire_cni_numero: 'CI 001 234 567 AB',
  proprietaire_cni_date: '10/05/2020',
  proprietaire_cni_lieu: 'Yamoussoukro',
  proprietaire_domicile: 'Quartier Centre, Village Katadji',
  numero_lot: 'LOT-K-001-A',
  superficie_m2: 1500,
  quartier: 'Quartier Centre',
  lotissement: 'Lotissement Katadji',
  mode_acquisition: 'Héritage coutumier',
  historique_possession: 'Possession coutumière depuis 1995, reconnaissance du chef du village',
  date_etablissement: '05/05/2026',
  validation_chef_nom: 'NANAN FAUSTIN ABOH KOUAME',
  chef_nom: 'NANAN FAUSTIN ABOH KOUAME',
  control_number: 'CTRL-20260505-0001',
  hash_sha256: 'a3f5c2d1e4b6f9g8h7i6j5k4l3m2n1o0p9q8r7s6t5u4v3w2x1y0z',
  verification_url: 'https://gnambaservices.ci/verify',
  logoUrl: '',
  village_logo_url: '',
  signatureUrl: '',
  cachetUrl: '',
};

const html = buildAttestationCoutumiereHTML(testData as any);

// Inspecter les couleurs du texte et du fond
const bodyMatch = html.match(/<body[^>]*>/);
const hasBodyStyle = html.includes('style');

// Chercher les zones problématiques
const titleMatch = html.match(/<div class="title-main"[^>]*>([^<]+)<\/div>/);
const headerLeftMatch = html.match(/<div class="header-left"[^>]*>/);

console.log('=== DIAGNOSTIC D\'AFFICHAGE ===\n');
console.log('Longueur HTML:', html.length);
console.log('body tag:', bodyMatch ? 'Présent' : 'Absent');
console.log('body background color:', html.includes('background: #f5f5f5') ? 'Gris (bon)' : 'Non trouvé');
console.log('.document background:', html.includes('background: white') ? 'Blanc (bon)' : 'Non trouvé');
console.log('.title-main color:', html.includes('color: #2d5a1b') ? 'Vert foncé (bon)' : 'Non trouvé');
console.log('.header-left color:', html.includes('color: #2d5a1b') ? 'Vert foncé (bon)' : 'Non trouvé');
console.log('\nPossible.model-bg avec image:', html.includes('.model-bg') ? 'OUI - potentiel problème!' : 'Non utilisée');
console.log('Image attestation model:', html.includes('attestation%20model.png') ? 'OUI - potentiel problème!' : 'Non référencée');

// Sauvegarder
import { writeFileSync } from 'fs';
writeFileSync('test-real-attestation.html', html);
console.log('\n✅ HTML test sauvegardé: test-real-attestation.html');
console.log('Visualisez-le pour vérifier le problème d\'affichage.');
