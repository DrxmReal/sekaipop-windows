$regPath = "HKLM:\SOFTWARE\Windhawk\Engine\Mods\local@sekaipop-launcher"
if (!(Test-Path $regPath)) {
    New-Item -Path $regPath -Force | Out-Null
}
Set-ItemProperty -Path $regPath -Name "LibraryFileName" -Value "local@sekaipop-launcher_1.0.0_aaaaaa.dll" -Type String
Set-ItemProperty -Path $regPath -Name "Disabled" -Value 0 -Type DWord
Set-ItemProperty -Path $regPath -Name "LoggingEnabled" -Value 1 -Type DWord
Set-ItemProperty -Path $regPath -Name "Include" -Value "explorer.exe" -Type String
Set-ItemProperty -Path $regPath -Name "Exclude" -Value "" -Type String
Set-ItemProperty -Path $regPath -Name "Architecture" -Value "x86-64" -Type String
Set-ItemProperty -Path $regPath -Name "Version" -Value "1.0.0" -Type String
Set-ItemProperty -Path $regPath -Name "SettingsChangeTime" -Value ([int][DateTimeOffset]::UtcNow.ToUnixTimeSeconds()) -Type DWord

# Also apply acrylicblur to File Explorer Styler so it stays transparent when unfocused
$fesPath = "HKLM:\SOFTWARE\Windhawk\Engine\Mods\windows-11-file-explorer-styler\Settings"
if (Test-Path $fesPath) {
    Set-ItemProperty -Path $fesPath -Name "backgroundTranslucentEffect" -Value "acrylicblur" -Type String
}

& "C:\Program Files\Windhawk\windhawk.exe" -restart -tray-only
