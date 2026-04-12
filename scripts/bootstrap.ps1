# Local setup: Prisma schema + seed (requires DATABASE_URL in .env)
# From project root:  powershell -ExecutionPolicy Bypass -File scripts/bootstrap.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "Applying database schema (prisma db push)..." -ForegroundColor Cyan
npx prisma db push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Seeding demo data..." -ForegroundColor Cyan
npm run db:seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Ready. Next: npm run dev" -ForegroundColor Green
Write-Host "Open http://localhost:3333" -ForegroundColor Green
