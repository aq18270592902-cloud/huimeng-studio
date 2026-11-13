@echo off
chcp 65001 >nul
title 绘梦工坊 图生视频工具
cd /d "%~dp0"
echo ============================================
echo   绘梦工坊 图生视频（Seedance 2.0 mini）
echo   零成本：任务显示失败但视频已生成，积分自动退回
echo ============================================
echo.
set /p PROMPT=请输入画面动作描述（回车用默认）: 
if "%PROMPT%"=="" set PROMPT=黑猫缓慢转头，霓虹灯呼吸闪烁，毛发飘动，电影感运镜
set /p IMGURL=首帧图片URL（回车用内置示例图）: 
if "%IMGURL%"=="" set IMGURL=https://dreamore.oss-cn-hongkong.aliyuncs.com/dreamore/results/d8689b99-33a3-4c8b-ab5f-350840fe08a6/0966432604d0.png?OSSAccessKeyId=LTAI5tF6fhtPZ5cDtBWuANJD&Expires=1794286865^&Signature=a2hi8ZI04jo9qv^%^2BzZyX24ZMNRXw^%^3D
set /p DUR=时长秒数（4/5/10，回车=10）: 
if "%DUR%"=="" set DUR=10
echo.
node gen_video.mjs "%PROMPT%" --img "%IMGURL%" --dur %DUR% --res 720p --out out.mp4
echo.
if exist out.mp4 start "" out.mp4
pause