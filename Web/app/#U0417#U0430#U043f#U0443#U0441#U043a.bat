@echo off
title Запуск Веб-Интерфейса
cd /d %~dp0
echo Запускаем сервер...
npm run dev -- --host 0.0.0.0
pause