$ErrorActionPreference = "Stop"

$taskName = "SIB Mirassol PostgreSQL Tunnel"
$scriptPath = Join-Path $PSScriptRoot "tunnel.ps1"
$powershellPath = Join-Path $PSHOME "powershell.exe"

if (-not (Test-Path -LiteralPath $scriptPath)) {
  throw "Script do tunel nao encontrado em: $scriptPath"
}

$action = New-ScheduledTaskAction `
  -Execute $powershellPath `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""

$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Days 365) `
  -RestartCount 999 `
  -RestartInterval (New-TimeSpan -Minutes 1)

$principal = New-ScheduledTaskPrincipal `
  -UserId "$env:USERDOMAIN\$env:USERNAME" `
  -LogonType Interactive `
  -RunLevel Limited

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Principal $principal `
  -Force | Out-Null

Start-ScheduledTask -TaskName $taskName

Write-Host "Tarefa '$taskName' instalada e iniciada."
