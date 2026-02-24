<#
.SYNOPSIS
    BONNESANTE ASAL — Local Development Launcher
.DESCRIPTION
    Sets up Python venv, installs backend & frontend deps, then starts
    both the FastAPI backend (port 8000) and Vite frontend (port 5173).
    Press Ctrl+C to stop everything.
#>

param(
    [switch]$SkipInstall  # Add -SkipInstall to skip pip/npm install
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }

# ── Colours ─────────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n✅  $msg" -ForegroundColor Green }
function Write-Info  { param($msg) Write-Host "   $msg" -ForegroundColor Cyan }
function Write-Warn  { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║   BONNESANTE ASAL — Local Development Environment   ║" -ForegroundColor Blue
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Blue

# ── 1. Python virtual environment ───────────────────────
$venvPath = Join-Path $root "backend\.venv"
$venvActivate = Join-Path $venvPath "Scripts\Activate.ps1"

if (-not (Test-Path $venvPath)) {
    Write-Step "Creating Python virtual environment..."
    python -m venv "$venvPath"
} else {
    Write-Info "Python venv already exists."
}

# Activate venv for this session
& $venvActivate

# ── 2. Install backend deps ────────────────────────────
if (-not $SkipInstall) {
    Write-Step "Installing backend dependencies..."
    Push-Location (Join-Path $root "backend")
    pip install -r requirements.txt --quiet
    Pop-Location
}

# ── 3. Install frontend deps ───────────────────────────
if (-not $SkipInstall) {
    Write-Step "Installing frontend dependencies..."
    Push-Location (Join-Path $root "frontend")
    pnpm install
    Pop-Location
}

# ── 4. Start backend (FastAPI + Uvicorn) ────────────────
Write-Step "Starting FastAPI backend on http://localhost:8000 ..."
$backendJob = Start-Job -ScriptBlock {
    param($root, $venvActivate)
    Set-Location (Join-Path $root "backend")
    & $venvActivate
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
} -ArgumentList $root, $venvActivate

# ── 5. Start frontend (Vite) ───────────────────────────
Write-Step "Starting Vite frontend on http://localhost:5173 ..."
$frontendJob = Start-Job -ScriptBlock {
    param($root)
    Set-Location (Join-Path $root "frontend")
    pnpm dev
} -ArgumentList $root

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Backend  → http://localhost:8000"               -ForegroundColor White
Write-Host "  Frontend → http://localhost:5173"               -ForegroundColor White
Write-Host "  API Docs → http://localhost:8000/docs"          -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop both servers."             -ForegroundColor Yellow
Write-Host ""

# ── 6. Stream logs ──────────────────────────────────────
try {
    while ($true) {
        # Print any new output from both jobs
        Receive-Job -Job $backendJob  -ErrorAction SilentlyContinue | Write-Host
        Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue | Write-Host

        # If either job stopped unexpectedly, warn
        if ($backendJob.State  -eq "Failed") { Write-Warn "Backend crashed.";  break }
        if ($frontendJob.State -eq "Failed") { Write-Warn "Frontend crashed."; break }

        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host "`nShutting down..." -ForegroundColor Yellow
    Stop-Job -Job $backendJob  -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob, $frontendJob -Force -ErrorAction SilentlyContinue
    Write-Host "Done." -ForegroundColor Green
}
