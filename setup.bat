@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   EGS - Enterprise Gnamba System
echo   Installation et Configuration Complète
echo ============================================
echo.

REM ============================================
REM ÉTAPE 1: Vérification des prérequis
REM ============================================
echo [ETAPE 1/6] Verification des prerequis...
echo.

REM Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe !
    echo Telechargez-le sur https://nodejs.org/
    echo.
    pause
    exit /b 1
) else (
    echo [OK] Node.js installe
    node --version
)

echo.

REM npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] npm n'est pas installe !
    pause
    exit /b 1
) else (
    echo [OK] npm installe
    npm --version
)

echo.

REM Docker (pour Supabase local)
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARN] Docker non installe (requis pour Supabase local)
    echo Telechargez-le sur https://www.docker.com/products/docker-desktop
) else (
    echo [OK] Docker installe
    docker --version
)

echo.

REM Git (optionnel)
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Git non installe (optionnel)
) else (
    echo [OK] Git installe
)

echo.

REM ============================================
REM ÉTAPE 2: Installation des dépendances
REM ============================================
echo [ETAPE 2/6] Installation des dependances...
echo.

call npm install

if %errorlevel% neq 0 (
    echo [ERREUR] L'installation des dependances a echoue
    pause
    exit /b 1
)

echo.
echo [OK] Dependances installees avec succes !
echo.

REM ============================================
REM ÉTAPE 3: Configuration du fichier .env
REM ============================================
echo [ETAPE 3/6] Configuration du fichier .env...
echo.

REM Récupérer l'adresse IP
set SERVER_IP=192.168.1.100
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set SERVER_IP=%%b
        goto :found
    )
)
:found

echo Adresse IP detectee : %SERVER_IP%
echo.

REM Créer le fichier .env s'il n'existe pas
if not exist .env (
    echo VITE_SUPABASE_URL=http://%SERVER_IP%:54321 > .env
    echo VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cGFiYXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2ODk2MDAsImV4cCI6MjA1MTI2NTYwMH0.local-key >> .env
    echo [OK] Fichier .env cree
) else (
    echo [INFO] Fichier .env deja existant
)

echo.

REM ============================================
REM ÉTAPE 4: Installation de Supabase CLI
REM ============================================
echo [ETAPE 4/6] Installation de Supabase CLI...
echo.

REM Vérifier si Supabase CLI est déjà installé
where supabase >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Supabase CLI deja installe
    supabase --version
) else (
    echo Installation de Supabase CLI...
    npm install -g supabase
    
    if %errorlevel% neq 0 (
        echo.
        echo [WARN] L'installation de Supabase CLI a echoue.
        echo Essayez en tant qu'administrateur :
        echo   powershell -ExecutionPolicy Bypass -Command "npm install -g supabase"
        echo.
    ) else (
        echo [OK] Supabase CLI installe avec succes !
    )
)

echo.

REM ============================================
REM ÉTAPE 5: Initialisation de Supabase
REM ============================================
echo [ETAPE 5/6] Initialisation de Supabase...
echo.

if exist supabase\config.toml (
    echo [INFO] Projet Supabase deja initialise
) else (
    echo Initialisation de Supabase...
    supabase init
    
    if %errorlevel% neq 0 (
        echo [WARN] L'initialisation de Supabase a echoue
    ) else (
        echo [OK] Supabase initialise avec succes !
    )
)

echo.

REM ============================================
REM ÉTAPE 6: Démarrage des services
REM ============================================
echo [ETAPE 6/6] Demarrage des services...
echo.

echo Voulez-vous demarrer Supabase local maintenant ? (Y/N)
set /p START_SUPABASE=
if /i "%START_SUPABASE%"=="Y" (
    echo.
    echo Demarrage de Supabase...
    echo Ceci peut prendre quelques minutes...
    echo.
    
    start "Supabase Studio" http://localhost:54323
    supabase start
    
    if %errorlevel% neq 0 (
        echo.
        echo [ERREUR] Le demarrage de Supabase a echoue.
        echo Verifiez que Docker Desktop est installe et en execution.
        echo.
    ) else (
        echo.
        echo [OK] Supabase demarre avec succes !
        echo.
        echo Application des migrations...
        supabase db push
    )
)

echo.
echo ============================================
echo   Installation terminee avec succes !
echo ============================================
echo.
echo URLs d'acces :
echo   - Application EGS : http://localhost:5173
echo   - Supabase Studio : http://localhost:54323
echo   - API Supabase    : http://localhost:54321
echo.
echo Commandes utiles :
echo   - npm run dev         : Demarrer le frontend
echo   - supabase start      : Demarrer Supabase local
echo   - supabase stop       : Arreter Supabase local
echo   - supabase db push    : Appliquer les migrations
echo.
echo Scripts disponibles :
echo   - start-server.bat    : Demarrer le serveur de developpement
echo   - scripts\check-ports.sh : Verifier les ports disponibles
echo.
pause
