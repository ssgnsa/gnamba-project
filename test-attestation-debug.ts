import { buildAttestationCoutumiereHTML } from './src/utils/print';

const testData = {
  reference: 'ATT-20260505-0001',
  numero_enregistrement: 'REG-001',
  region: 'AGNEBY-TIASSA',
  departement: 'SIKENSI',
  commune: 'SIKENSI',
  village: 'KATADJI',
  proprietaire_nom: 'KOUAME',
  proprietaire_prenom: 'Jean',
  proprietaire_naissance_date: '15/01/1980',
  proprietaire_naissance_lieu: 'Yamoussoukro',
  proprietaire_profession: 'Agriculteur',
  proprietaire_telephone: '+225 07 12 34 56 78',
  proprietaire_cni_numero: 'CI-001-234-567',
  proprietaire_cni_date: '10/05/2020',
  proprietaire_cni_lieu: 'Yamoussoukro',
  proprietaire_domicile: 'Quartier Katadji, Village Katadji',
  numero_lot: 'LOT-K-001',
  superficie_m2: 1500,
  quartier: 'Quartier Katadji',
  lotissement: 'Lotissement Katadji',
  mode_acquisition: 'Héritage',
  historique_possession: 'Possession coutumière depuis 1995',
  date_etablissement: '05/05/2026',
  validation_chef_nom: 'NANAN FAUSTIN ABOH KOUAME',
};

const html = buildAttestationCoutumiereHTML(testData as any);

// Vérifier la structure
console.log('=== ANALYSE DE LA STRUCTURE HTML ===\n');
console.log('Longueur totale:', html.length);
console.log('Nombre d\'occurences de <html>:', (html.match(/<html/g) || []).length);
console.log('Nombre d\'occurences de </html>:', (html.match(/<\/html>/g) || []).length);
console.log('Nombre d\'occurences de <body>:', (html.match(/<body/g) || []).length);
console.log('Nombre d\'occurences de </body>:', (html.match(/<\/body>/g) || []).length);
console.log('Nombre d\'occurences de .document:', (html.match(/\.document/g) || []).length);
console.log('Nombre d\'occurences de class="document":', (html.match(/class="document"/g) || []).length);

// Vérifier les positions de début et fin
const htmlStart = html.indexOf('<!DOCTYPE html>');
const htmlEnd = html.lastIndexOf('</html>');
console.log('\nPosition <!DOCTYPE html>:', htmlStart);
console.log('Position </html>:', htmlEnd);
console.log('Fin du fichier à:', html.length);

// Vérifier s'il y a du contenu après </html>
if (htmlEnd < html.length - 10) {
  console.log('\n⚠️  ATTENTION: Contenu après </html>:');
  console.log(html.substring(htmlEnd + 7, Math.min(htmlEnd + 100, html.length)));
}

// Sauvegarder pour inspection
import { writeFileSync } from 'fs';
writeFileSync('test-attestation-debug.html', html);
console.log('\n✅ HTML sauvegardé dans test-attestation-debug.html');
