param(
  [string]$RepoRoot = "",
  [int]$Port = 4000,
  [string]$BasePath = "/north-star-donors",
  [string]$TargetPath = "/"
)

$ErrorActionPreference = "Stop"

if (-not $RepoRoot) {
  $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
}

function Get-RepoDevProcesses {
  Get-CimInstance Win32_Process |
    Where-Object {
      $_.CommandLine -and
      $_.CommandLine -match [regex]::Escape($RepoRoot) -and
      $_.CommandLine -match "next|npm"
    }
}

function Get-ListeningProcess {
  Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1
}

function Test-Http {
  param([string]$Url, [int]$Depth = 0)
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15 -MaximumRedirection 0 -ErrorAction Stop
    if ([int]$response.StatusCode -in @(301, 302, 303, 307, 308) -and $response.Headers.Location -and $Depth -lt 5) {
      $location = [string]$response.Headers.Location
      $nextUrl = if ($location -match '^https?://') { $location } else { ([uri]::new([uri]$Url, $location)).AbsoluteUri }
      return Test-Http -Url $nextUrl -Depth ($Depth + 1)
    }
    [pscustomobject]@{
      url = $Url
      ok = $true
      status = [int]$response.StatusCode
      body = [string]$response.Content
      finalUrl = $Url
      error = $null
    }
  } catch {
    $status = $null
    $location = $null
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $status = [int]$_.Exception.Response.StatusCode
      $location = [string]$_.Exception.Response.Headers.Location
    }
    if ($status -in @(301, 302, 303, 307, 308) -and $location -and $Depth -lt 5) {
      $nextUrl = if ($location -match '^https?://') { $location } else { ([uri]::new([uri]$Url, $location)).AbsoluteUri }
      return Test-Http -Url $nextUrl -Depth ($Depth + 1)
    }
    [pscustomobject]@{
      url = $Url
      ok = $false
      status = $status
      body = ""
      finalUrl = $Url
      error = $_.Exception.Message
    }
  }
}

$started = $false
$listener = Get-ListeningProcess
$repoProcesses = @(Get-RepoDevProcesses)

if (-not $listener -or $repoProcesses.Count -eq 0) {
  Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "dev", "--", "-p", "$Port") -WorkingDirectory $RepoRoot -WindowStyle Hidden
  $started = $true
  $deadline = (Get-Date).AddSeconds(45)
  do {
    Start-Sleep -Milliseconds 750
    $listener = Get-ListeningProcess
    $repoProcesses = @(Get-RepoDevProcesses)
  } while ((-not $listener -or $repoProcesses.Count -eq 0) -and (Get-Date) -lt $deadline)
}

$appUrl = "http://localhost:$Port$BasePath/"
$rootUrl = "http://localhost:$Port/"
$target = $TargetPath
if (-not $target.StartsWith("/")) { $target = "/$target" }
$query = ""
$queryIndex = $target.IndexOf("?")
if ($queryIndex -ge 0) {
  $query = $target.Substring($queryIndex)
  $target = $target.Substring(0, $queryIndex)
}

if ($target -eq "/") {
  $targetUrl = $appUrl
} else {
  $targetUrl = "http://localhost:$Port$BasePath$target$query"
}

$root = Test-Http $rootUrl
$app = Test-Http $appUrl
$targetResult = Test-Http $targetUrl
$listener = Get-ListeningProcess
$repoProcesses = @(Get-RepoDevProcesses)

$dashboardTextFound = $app.body -match "Development Dashboard"
$targetReady = $targetResult.status -eq 200
$ready = [bool]$listener -and $repoProcesses.Count -gt 0 -and $app.status -eq 200 -and $dashboardTextFound -and $targetReady

[pscustomobject]@{
  ready = $ready
  started = $started
  repoRoot = $RepoRoot
  appUrl = $appUrl
  expectedRoot404 = ($root.status -eq 404)
  rootStatus = $root.status
  rootNote = "404 at / is expected because next.config.ts uses basePath '$BasePath'."
  portListening = [bool]$listener
  owningProcess = $listener.OwningProcess
  repoProcessCount = $repoProcesses.Count
  appStatus = $app.status
  dashboardTextFound = $dashboardTextFound
  targetUrl = $targetUrl
  targetFinalUrl = $targetResult.finalUrl
  targetStatus = $targetResult.status
  targetNon404 = ($targetResult.status -ne 404 -and $targetResult.status -ne $null)
  targetReady = $targetReady
  failure = if ($ready) { $null } else { "Local dev not fully verified. Check process/port/appStatus/dashboardTextFound/targetStatus. Target route must return 200, not only non-404." }
} | ConvertTo-Json -Depth 4
