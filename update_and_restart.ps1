$regPath = "HKLM:\SOFTWARE\Windhawk\Engine\Mods\local@sekaipop-launcher"
Set-ItemProperty -Path $regPath -Name "LibraryFileName" -Value "local@sekaipop-launcher_1.0.0_999999.dll" -Type String
Set-ItemProperty -Path $regPath -Name "Disabled" -Value 0 -Type DWord
Set-ItemProperty -Path $regPath -Name "LoggingEnabled" -Value 1 -Type DWord
Set-ItemProperty -Path $regPath -Name "SettingsChangeTime" -Value ([int][DateTimeOffset]::UtcNow.ToUnixTimeSeconds()) -Type DWord

Stop-Process -Name explorer -Force
