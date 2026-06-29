@echo off
rem Project Launcher Batch File for Windows
setlocal enabledelayedexpansion

:menu
cls
echo ===================================================
echo   JusticeWatch: Public Safety & Integrity Tracker Launcher
echo ===================================================
echo.
echo Please select an action:
echo   [1] Start Review Dashboard (Web Server)
echo   [2] Run Unified Daily Ingestion (MOI, Opinions)
echo   [3] Exit
echo.
set /p opt="Enter choice (1-3): "

if "!opt!"=="1" (
    echo.
    echo Starting Review Dashboard...
    echo Access it at: http://127.0.0.1:8765
    python scripts\serve_review_dashboard.py --db data\local\public_safety.sqlite
    pause
    goto menu
)

if "!opt!"=="2" (
    echo.
    echo ===================================================
    echo   Run Unified Daily Update
    echo ===================================================
    echo.
    echo Please select an ingestion mode:
    echo   [A] Daily Incremental Update - Update current and previous month
    echo   [B] Historical Backfill - From a specific month to present
    echo   [C] Single Month Update - Update a specific month only
    echo.
    set /p subopt="Select option [A/B/C, default A]: "
    if /i "!subopt!"=="B" (
        set /p start_month="Enter start month for backfill [YYYYMM, e.g., 199301]: "
        if not "!start_month!"=="" (
            echo.
            echo Running statistics backfill since !start_month!...
            python scripts\run_daily_update.py --backfill !start_month!
        )
    ) else if /i "!subopt!"=="C" (
        set /p single_month="Enter month to update [YYYYMM, e.g., 202604]: "
        if not "!single_month!"=="" (
            echo.
            echo Running statistics update for !single_month!...
            python scripts\run_daily_update.py --month !single_month!
        )
    ) else (
        echo.
        echo Running default daily update...
        python scripts\run_daily_update.py
    )
    pause
    goto menu
)

if "!opt!"=="3" (
    exit /b
)

echo Invalid choice.
pause
goto menu
