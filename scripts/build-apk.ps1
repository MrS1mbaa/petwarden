param([switch]$NoOpen, [switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
try {
    Set-Location (Split-Path $PSScriptRoot -Parent)
    if (-not (Get-Command npx.cmd -ErrorAction SilentlyContinue)) { throw 'Node.js/npm nisu dostupni. Instaliraj Node.js 22+.' }
    if (-not (Test-Path 'node_modules/expo/package.json')) { throw 'Prvo pokreni npm ci u folderu projekta.' }
    $javaCandidates = @($env:JAVA_HOME, 'C:\Program Files\Java\jdk-17', 'C:\Program Files\Java\jdk-21', 'C:\Program Files\Android\Android Studio\jbr')
    $jdk = $javaCandidates | Where-Object { $_ -and (Test-Path (Join-Path $_ 'bin\java.exe')) } | Select-Object -First 1
    if (-not $jdk) { throw 'Potreban je JDK 17+ (JAVA_HOME). Instaliraj JDK ili Android Studio.' }
    $sdkCandidates = @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, (Join-Path $env:LOCALAPPDATA 'Android\Sdk'))
    $sdk = $sdkCandidates | Where-Object { $_ -and (Test-Path (Join-Path $_ 'platforms\android-36')) -and (Test-Path (Join-Path $_ 'build-tools\36.0.0')) } | Select-Object -First 1
    if (-not $sdk) { throw 'U Android Studio SDK Manager instaliraj Android SDK Platform 36 i Build Tools 36.0.0.' }
    $env:JAVA_HOME = $jdk
    $env:ANDROID_HOME = $sdk
    $env:ANDROID_SDK_ROOT = $sdk
    $env:PATH = (Join-Path $jdk 'bin') + ';' + $env:PATH
    Write-Host "Lokalni build: JDK=$jdk; Android SDK=$sdk"
    if ($CheckOnly) { Write-Host 'Preduslovi su dostupni. Build nije pokrenut.'; exit 0 }
    Write-Host 'Generisem Android projekat preko Expo prebuild-a...'
    # Native CLI progress on stderr must not terminate Windows PowerShell 5.1.
    $ErrorActionPreference = 'Continue'
    & npx.cmd expo prebuild --platform android --no-install --no-clean
    if ($LASTEXITCODE -ne 0) { throw 'Expo prebuild nije uspeo. Pogledaj log iznad.' }
    Write-Host 'Gradim release APK lokalno. Prvi build preuzima zavisnosti; ostavi prozor otvoren.'
    # Bundled JS images are regenerated every build; stale copies (e.g. after png -> webp) clash as duplicate resources.
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue 'android\app\build\generated\res\react', 'android\app\build\generated\assets\react'
    Push-Location android
    try {
        & .\gradlew.bat :app:assembleRelease --console=plain
        if ($LASTEXITCODE -ne 0) { throw 'Gradle build nije uspeo. Pogledaj log iznad.' }
    } finally { Pop-Location }
    $ErrorActionPreference = 'Stop'
    $sourceApk = Join-Path (Get-Location) 'android\app\build\outputs\apk\release\app-release.apk'
    if (-not (Test-Path -LiteralPath $sourceApk)) { throw 'Gradle nije proizveo app-release.apk.' }
    $outputDir = Join-Path (Get-Location) 'build-apk'
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
    $apkPath = Join-Path $outputDir ('PetWarden-local-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.apk')
    Copy-Item -LiteralPath $sourceApk -Destination $apkPath
    Write-Host "APK sacuvan: $apkPath"
    $hashStream = [IO.File]::OpenRead($apkPath)
    $sha = [Security.Cryptography.SHA256]::Create()
    try { Write-Host ('SHA256: ' + [BitConverter]::ToString($sha.ComputeHash($hashStream)).Replace('-', '')) }
    finally { $sha.Dispose(); $hashStream.Dispose() }
    if (Test-Path (Join-Path $env:USERPROFILE '.petwarden\keystore.properties')) { Write-Host 'APK je potpisan lokalnim release kljucem (~/.petwarden).' } else { Write-Host 'Nema ~/.petwarden/keystore.properties: APK koristi debug potpis.' }
    if (-not $NoOpen) { Start-Process -FilePath (Join-Path $env:WINDIR 'explorer.exe') -ArgumentList ('"' + $outputDir + '"') }
    exit 0
} catch {
    Write-Host ('GRESKA: ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
