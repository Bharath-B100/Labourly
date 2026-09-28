$ErrorActionPreference = 'Stop'
$jdk = $env:NAMMACREW_JAVA_HOME
if (-not $jdk) {
    $jdk = [Environment]::GetEnvironmentVariable('NAMMACREW_JAVA_HOME', 'User')
}
if (-not $jdk -or -not (Test-Path -LiteralPath (Join-Path $jdk 'bin\java.exe'))) {
    throw 'Set NAMMACREW_JAVA_HOME to the installed JDK 21 directory first.'
}
$javaVersion = & (Join-Path $jdk 'bin\java.exe') -version 2>&1 | Out-String
if ($javaVersion -notmatch 'version "21\.') { throw 'NammaCrew requires JDK 21.' }
$env:JAVA_HOME = $jdk
$sdk = [Environment]::GetEnvironmentVariable('ANDROID_HOME', 'User')
if (-not $sdk) { $sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$entries = @((Join-Path $jdk 'bin'), (Join-Path $sdk 'platform-tools'), (Join-Path $sdk 'emulator'), (Join-Path $sdk 'cmdline-tools\latest\bin'))
$env:Path = (($entries + ($env:Path -split ';') | Select-Object -Unique) -join ';')
Write-Output "NammaCrew session: Java 21 at $jdk; Android SDK at $sdk"
