@echo off
title Refresh IP Address
echo 可能多次得到同一 IP，届时请重复尝试刷新
echo.
pause
cls
ipconfig -release
ipconfig -renew