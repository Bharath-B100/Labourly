# Build the approved Google development module without changing global Java settings.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$socketDirectory = Join-Path $projectRoot '.tools/java-sockets'
New-Item -ItemType Directory -Force $socketDirectory | Out-Null
$previousJava = $env:JAVA_HOME
$previousOptions = $env:JAVA_TOOL_OPTIONS
try {
  $env:JAVA_HOME = Join-Path $projectRoot '.tools/jdk21-local/jdk-21.0.12.1+1'
  $env:JAVA_TOOL_OPTIONS = "$previousOptions -Djdk.net.unixdomain.tmpdir=$($socketDirectory.Replace('\','/'))".Trim()
  Push-Location (Join-Path $projectRoot 'mobile/android')
  try {
    & .\gradlew.bat :app:assembleDebug -PreactNativeArchitectures=x86_64 --max-workers=2 --no-daemon
    if ($LASTEXITCODE -ne 0) { throw "Android build failed with exit code $LASTEXITCODE" }
  } finally { Pop-Location }
} finally {
  $env:JAVA_HOME = $previousJava
  $env:JAVA_TOOL_OPTIONS = $previousOptions
}
