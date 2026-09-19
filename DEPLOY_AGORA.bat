@echo off
chcp 65001 >nul
REM Deploy automático do Meu Planner - Clique duplo para executar

setlocal enabledelayedexpansion
set REPO_PATH=%USERPROFILE%\meu-planner-repo
set DESKTOP_PATH=%USERPROFILE%\OneDrive\Área de Trabalho\MEU PLANNER

echo.
echo ╔════════════════════════════════════════════╗
echo ║  MEU PLANNER - DEPLOY AUTOMÁTICO           ║
echo ╚════════════════════════════════════════════╝
echo.

REM Verificar se Git está instalado
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ ERRO: Git não está instalado!
    echo.
    echo Instale Git em: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo ✅ Git encontrado
echo.

REM Clonar repositório
if not exist "%REPO_PATH%" (
    echo 📥 Clonando repositório do Meu Planner...
    git clone https://github.com/samaramodolo/meuplanner.git "%REPO_PATH%"
    if %ERRORLEVEL% neq 0 (
        echo ❌ Erro ao clonar repositório
        pause
        exit /b 1
    )
)

cd /d "%REPO_PATH%"
echo ✅ Repositório pronto
echo.

REM Copiar arquivos do Desktop
echo 📋 Copiando arquivos atualizados...
copy "%DESKTOP_PATH%\index.html" . /Y >nul
copy "%DESKTOP_PATH%\app.html" . /Y >nul
copy "%DESKTOP_PATH%\auth.js" . /Y >nul
copy "%DESKTOP_PATH%\db.js" . /Y >nul
copy "%DESKTOP_PATH%\app.js" . /Y >nul
copy "%DESKTOP_PATH%\supabase-config-UNIFIED.js" . /Y >nul
echo ✅ Arquivos copiados
echo.

REM Git add
echo ➕ Preparando commit...
git add index.html app.html auth.js db.js app.js supabase-config-UNIFIED.js
echo.

REM Git commit
echo 💾 Fazendo commit...
git commit -m "Deploy - Meu Planner com autenticação e interface melhoradas"

REM Git push
echo.
echo 🚀 Enviando para GitHub... (isso pode levar um tempo)
echo.
git push origin main

if %ERRORLEVEL% eq 0 (
    cls
    echo.
    echo ╔════════════════════════════════════════════╗
    echo ║  ✅ SUCESSO! DEPLOY REALIZADO!            ║
    echo ╚════════════════════════════════════════════╝
    echo.
    echo 🌐 Seu site será atualizado em:
    echo    https://samaramodolo.github.io/meuplanner/
    echo.
    echo ⏱️ Aguarde 2-5 minutos para o Vercel fazer deploy
    echo.
    echo ✨ Depois, teste seu Meu Planner:
    echo    1. Acesse o link acima
    echo    2. Teste login/criar conta
    echo    3. Pronto para usar!
    echo.
) else (
    echo.
    echo ❌ ERRO ao fazer push!
    echo.
    echo ⚠️ Possíveis causas:
    echo    - Sem conexão com internet
    echo    - Problemas de autenticação do Git
    echo.
)

pause
