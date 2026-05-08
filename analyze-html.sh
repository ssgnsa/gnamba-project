#!/bin/bash

HTML_FILE="test-real-attestation.html"

echo "=== ANALYSE COMPLÈTE DU HTML D'ATTESTATION ==="
echo

# Compter les div
echo "Nombre de <div>: $(grep -o '<div' "$HTML_FILE" | wc -l)"
echo "Nombre de </div>: $(grep -o '</div>' "$HTML_FILE" | wc -l)"
echo "Différence: $(($(grep -o '<div' "$HTML_FILE" | wc -l) - $(grep -o '</div>' "$HTML_FILE" | wc -l)))"
echo

# Compter les sections principales
echo "Sections principales:"
grep -c 'class="header"' "$HTML_FILE" && echo "  .header: $(grep -c 'class="header"' "$HTML_FILE")"
grep -c 'class="title-section"' "$HTML_FILE" && echo "  .title-section: $(grep -c 'class="title-section"' "$HTML_FILE")"
grep -c 'class="sections"' "$HTML_FILE" && echo "  .sections: $(grep -c 'class="sections"' "$HTML_FILE")"
grep -c 'class="section"' "$HTML_FILE" && echo "  .section: $(grep -c 'class="section"' "$HTML_FILE")"
grep -c 'class="signature-section"' "$HTML_FILE" && echo "  .signature-section: $(grep -c 'class="signature-section"' "$HTML_FILE")"
grep -c 'class="footer"' "$HTML_FILE" && echo "  .footer: $(grep -c 'class="footer"' "$HTML_FILE")"
echo

# Chercher du contenu en double
echo "Chercheur de duplications:"
echo "  'ATTESTATION' apparaît: $(grep -c 'ATTESTATION' "$HTML_FILE") fois"
echo "  'ATTESTATION DE PROPRIÉTÉ' apparaît: $(grep -c 'ATTESTATION DE PROPRIÉTÉ' "$HTML_FILE") fois"
echo "  'KOUAME' (nom de test) apparaît: $(grep -c 'KOUAME' "$HTML_FILE") fois"
echo "  'Quartier Centre' apparaît: $(grep -c 'Quartier Centre' "$HTML_FILE") fois"
echo

# Vérifier la structure du document
echo "Structure du document:"
echo -n "  <!DOCTYPE html>: "
grep -c '<!DOCTYPE html>' "$HTML_FILE"
echo -n "  <html>: "
grep -c '^<html' "$HTML_FILE"
echo -n "  <body>: "
grep -c '^<body>' "$HTML_FILE"
echo -n "  <style>: "
grep -c '<style>' "$HTML_FILE"
echo

# Chercher les <div class="document">
echo "Divs .document:"
grep -c 'class="document"' "$HTML_FILE"
