#!/bin/bash
# Test de la Edge Function admin-create-user

# Charger les variables
cd /home/soma/gnamba-project
if [ -f ".env" ]; then
    source .env
fi

SUPABASE_URL=$VITE_SUPABASE_URL
SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

echo "=========================================="
echo "Test de la Edge Function admin-create-user"
echo "=========================================="
echo ""
echo "Supabase URL: $SUPABASE_URL"
echo ""

# Obtenir un token (nécessite un utilisateur connecté)
echo "Pour tester, vous devez être connecté avec un compte ADMIN."
echo ""
echo "Copiez votre token JWT depuis le localStorage du navigateur :"
echo "1. Ouvrez http://192.168.1.58:5173"
echo "2. Connectez-vous avec un compte admin"
echo "3. Ouvrez la console Dev (F12)"
echo "4. Tapez: localStorage.getItem('supabase.auth.token')"
echo "5. Copiez la valeur"
echo ""
read -p "Entrez votre token JWT: " JWT_TOKEN

if [ -z "$JWT_TOKEN" ]; then
    echo "Token requis pour tester"
    exit 1
fi

echo ""
echo "Envoi de la requête..."
echo ""

# Tester la fonction
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$SUPABASE_URL/functions/v1/admin-create-user" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-admin-create-user@gnamba.ci",
    "password": "Test1234!",
    "full_name": "Test Admin Create User",
    "access_level": "admin",
    "department": "Test",
    "poste": "Test"
  }')

# Extraire le code HTTP et le corps
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Code HTTP: $HTTP_CODE"
echo ""
echo "Réponse:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ La fonction fonctionne correctement !"
else
    echo "❌ Erreur détectée. Code: $HTTP_CODE"
    echo ""
    echo "Causes possibles :"
    echo "  1. Token JWT invalide ou expiré"
    echo "  2. L'utilisateur n'est pas admin dans user_profiles"
    echo "  3. URL non autorisée dans Supabase (ajoutez 192.168.1.58)"
    echo "  4. Problème de CORS"
fi
