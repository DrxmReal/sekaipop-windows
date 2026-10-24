$target = 'C:\ProgramData\Windhawk\Engine\Mods\64\local@sekaipop-launcher_1.0.0_aaaaaa.dll'
$old = 'C:\ProgramData\Windhawk\Engine\Mods\64\local@sekaipop-launcher_1.0.0_old_' + (Get-Random) + '.dll'
Move-Item -Path $target -Destination $old -Force
Copy-Item -Path 'C:\ProgramData\Windhawk\Engine\Mods\64\local@sekaipop-launcher_1.0.0_wine.dll' -Destination $target -Force
Stop-Process -Name explorer -Force
Start-Sleep -Seconds 2
Get-Item $target | Select-Object Name, Length, LastWriteTime
