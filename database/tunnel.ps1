param(
  [string]$SshHost = "159.195.150.251",
  [string]$SshUser = "root",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\id_ed25519_vps",
  [int]$LocalPort = 15432,
  [string]$RemoteHost = "127.0.0.1",
  [int]$RemotePort = 5432,
  [int]$ReconnectDelaySeconds = 3
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
  throw "O comando ssh nao foi encontrado no PATH."
}

if (-not (Test-Path -LiteralPath $KeyPath)) {
  throw "Chave SSH nao encontrada em: $KeyPath"
}

Write-Host "Mantendo tunel PostgreSQL em 127.0.0.1:$LocalPort -> ${RemoteHost}:$RemotePort via $SshUser@$SshHost"
Write-Host "Deixe esta janela aberta enquanto estiver usando o app."

while ($true) {
  $listener = Get-NetTCPConnection -LocalPort $LocalPort -State Listen -ErrorAction SilentlyContinue
  if ($listener) {
    Write-Host "A porta local $LocalPort ja esta em uso. Feche o processo existente antes de abrir outro tunel."
    exit 0
  }

  & ssh `
    -i $KeyPath `
    -N `
    -L "$LocalPort`:$RemoteHost`:$RemotePort" `
    -o ExitOnForwardFailure=yes `
    -o ServerAliveInterval=30 `
    -o ServerAliveCountMax=3 `
    "$SshUser@$SshHost"

  Write-Host "Tunel encerrado. Tentando reconectar em $ReconnectDelaySeconds segundos..."
  Start-Sleep -Seconds $ReconnectDelaySeconds
}
