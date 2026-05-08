@echo off
echo ============================================
echo   EGS - Enterprise Gnamba System
echo   Démarrage du serveur local...
echo ============================================
echo.

REM Vérifier si Node.js est installé
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installé !
    echo Téléchargez-le sur https://nodejs.org/
    pause
    exit /b 1
)

REM Vérifier si Supabase CLI est installé
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo [ATTENTION] Supabase CLI n'est pas installé
    echo Installation en cours...
    npm install -g supabase
)

echo [1/3] Démarrage de Supabase local...
cd /d "%~dp0"
start "Supabase Studio" http://localhost:54323
supabase start

echo.
echo [2/3] Installation des dépendances...
call npm install

echo.
echo [3/3] Démarrage du serveur EGS...
echo.
echo ============================================
echo   Serveur accessible sur :
echo   - Local: http://localhost:5173
echo   - Réseau: http://%COMPUTERNAME%.local:5173
echo   - Studio Supabase: http://localhost:54323
echo ============================================
echo.
echo Appuyez sur CTRL+C pour arrêter le serveur
echo.

call npm run dev -- --host 0.0.0.0 --port 5173

pause
