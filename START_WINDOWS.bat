@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (py -3 scripts\server.py --open & goto end)
where python >nul 2>nul
if %errorlevel%==0 (python scripts\server.py --open & goto end)
where node >nul 2>nul
if %errorlevel%==0 (node scripts\serve.mjs --open & goto end)
echo Please install Python 3 or Node.js, or serve the included dist folder over HTTP.
:end
pause
