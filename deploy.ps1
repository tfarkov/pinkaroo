# Pinkaroo Portal - Deployment script (PowerShell)
# Creates structure, installs deps, builds. Add error handling and env as needed.

$ErrorActionPreference = 'Stop'
try {
  Write-Host 'Checking Node...'
  node -v
  npm -v

  Write-Host 'Installing dependencies...'
  npm ci

  Write-Host 'Building...'
  npm run build

  Write-Host 'Deploy complete.'
} catch {
  Write-Error "Deploy failed: $_"
  exit 1
}
