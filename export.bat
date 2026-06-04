@echo off
setlocal enabledelayedexpansion
set "found=0"
set "cmdline="

:loop
if "%~1"=="" goto :done
if !found!==1 (
    if defined cmdline (
        set "cmdline=!cmdline! %~1"
    ) else (
        set "cmdline=%~1"
    )
    shift
    goto :loop
)
set "arg=%~1"
if not "!arg:;=!"=="!arg!" (
    set "found=1"
)
shift
goto :loop

:done
if defined cmdline (
    %cmdline%
)
