@echo off
REM
REM The following should start the mongoose mini-server with the directory of the batch file as its www-root folder.
REM Note that this won't work if mongoose is already running
REM

REM
REM First we need to remove the trailing slash that gets appended.
REM


SET BATDIR=%~dp0

IF %BATDIR:~-1%==\ SET BATDIR=%BATDIR:~0,-1%

start %BATDIR%\bin\win\mongoose-3.0.exe -r %BATDIR%

REM You may not have the timeout command...
timeout 1
start http://localhost:8080/src/index.html?ex=1