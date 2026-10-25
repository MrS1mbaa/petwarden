@echo off
setlocal
title PetWarden - local APK build
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build-apk.ps1"
set "BUILD_EXIT=%ERRORLEVEL%"
echo.
if not "%BUILD_EXIT%"=="0" echo Build nije zavrsen. Pogledaj gresku iznad.
pause
exit /b %BUILD_EXIT%
