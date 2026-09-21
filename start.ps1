# iSchool B2B Workshop Platform - Dev Launcher
# Run with: .\start.ps1  (or right-click → Run with PowerShell)

$Host.UI.RawUI.WindowTitle = "iSchool B2B Workshop Platform"

Write-Host ""
Write-Host "  ====================================================" -ForegroundColor Cyan
Write-Host "  🚀  iSchool B2B Onboarding Workshop Platform" -ForegroundColor White
Write-Host "  ====================================================" -ForegroundColor Cyan
Write-Host ""

# Check node is available
try {
    $null = Get-Command node -ErrorAction Stop
} catch {
    Write-Host "  ❌ Node.js not found. Install it from https://nodejs.org" -ForegroundColor Red
    Read-Host "  Press Enter to exit"
    exit 1
}

# ── Kill stale processes on our ports ────────────────────────────────────────
Write-Host "  Clearing ports 3001 and 5173..." -ForegroundColor Gray

foreach ($port in @(3001, 5173)) {
    $result = netstat -ano 2>$null | Select-String ":$port " | Select-String "LISTENING"
    if ($result) {
        $pid = ($result -split '\s+')[-1]
        if ($pid -match '^\d+$') {
            Write-Host "    Killing PID $pid on port $port" -ForegroundColor DarkGray
            try { taskkill /PID $pid /F 2>$null | Out-Null } catch {}
        }
    }
}

# Give OS a moment to release ports
Start-Sleep -Milliseconds 800

Write-Host ""
Write-Host "  Backend  → http://localhost:3001" -ForegroundColor Yellow
Write-Host "  Frontend → http://localhost:5173" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Starting both servers... Press CTRL+C to stop." -ForegroundColor Gray
Write-Host ""

npm run dev
