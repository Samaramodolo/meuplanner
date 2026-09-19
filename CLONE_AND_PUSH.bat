@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

cd /d "%USERPROFILE%\OneDrive\Área de Trabalho"

echo.
echo ===================================
echo Clonando repositório...
echo ===================================
echo.

git clone https://github.com/Samaramodolo/meuplanner.git meuplanner_temp

if %errorlevel% neq 0 (
    echo ERRO: Falha ao clonar repositório
    pause
    exit /b 1
)

echo.
echo ===================================
echo Copiando arquivos modificados...
echo ===================================
echo.

copy "MEU PLANNER\app.html" "meuplanner_temp\app.html" /Y
copy "MEU PLANNER\index_1.html" "meuplanner_temp\index.html" /Y

echo.
echo ===================================
echo Entrando no repositório...
echo ===================================
echo.

cd /d meuplanner_temp

echo.
echo ===================================
echo Verificando status...
echo ===================================
echo.

git status

echo.
echo ===================================
echo Fazendo commit...
echo ===================================
echo.

git add -A
git commit -m "Fix: Corrigir duplicação de SUPABASE_URL que quebrava a funcionalidade interativa"

echo.
echo ===================================
echo Fazendo push para GitHub...
echo ===================================
echo.

git push origin main

if %errorlevel% neq 0 (
    echo.
    echo ERRO: Falha ao fazer push
    pause
    exit /b 1
)

echo.
echo ===================================
echo ✓ SUCESSO! Commit enviado para GitHub
echo ===================================
echo.
echo Aguarde 2-5 minutos para o Vercel fazer o redeploy
echo.

pause
