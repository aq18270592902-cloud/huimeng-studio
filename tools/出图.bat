@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ================================================
echo   绘梦工坊 免费出图
echo ================================================
set /p P=请输入画面描述（直接回车用默认示例）: 
if "%P%"=="" set P=一只赛博朋克风格的黑猫，霓虹灯，电影感，8K
echo.
echo 正在提交，请稍等 40-90 秒...
node gen.mjs "%P%" --out "%~dp0out.png"
echo.
if exist "%~dp0out.png" (start "" "%~dp0out.png") else (echo 没出图，再双击一次)
pause