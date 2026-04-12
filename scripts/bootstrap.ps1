# Local setup: Docker Postgres + Prisma schema + seed
# From project root:  powershell -ExecutionPolicy Bypass -File scripts/bootstrap.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host "Docker not found. Install Docker Desktop, start it, then run this again." -ForegroundColor Yellow
  Write-Host "Or install PostgreSQL locally and set DATABASE_URL in .env, then run: npx prisma db push && npm run db:seed"
  exit 1
}

Write-Host "Starting Postgres (docker compose)..." -ForegroundColor Cyan
docker compose up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Waiting 8s for Postgres to accept connections..." -ForegroundColor Cyan
Start-Sleep -Seconds 8

Write-Host "Applying database schema (prisma db push)..." -ForegroundColor Cyan
npx prisma db push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Seeding demo data..." -ForegroundColor Cyan
npm run db:seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Ready. Next: npm run dev" -ForegroundColor Green
Write-Host "Open http://localhost:3333 — dev mode logs you in as the seeded admin automatically." -ForegroundColor Green
