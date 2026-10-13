@echo off
rem Stop the TopMSV server on Windows (double-click, or run from a terminal).
rem
rem   stop_server.bat
rem
rem Stops every TopMSV server started from this folder (by start_server.bat
rem or npm start), whatever its port; TopMSV servers started from other
rem folders and other Node.js programs keep running. The window of
rem start_server.bat closes when its server stops. A server started as
rem administrator can only be stopped by running this script as
rem administrator too.

setlocal
set "TOPMSV_DIR=%~dp0"

rem The server is the node.exe process that runs this folder's ts-node on
rem server.ts. When npm started it, npm's own node.exe (above the cmd.exe
rem that runs the script) is stopped with it, so npm reports no failed
rem script.
powershell -NoProfile -Command ^
  "$modules = $env:TOPMSV_DIR + 'node_modules\';" ^
  "$all = @(Get-CimInstance Win32_Process);" ^
  "$servers = @($all | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -and $_.CommandLine.IndexOf($modules, [StringComparison]::OrdinalIgnoreCase) -ge 0 -and $_.CommandLine -match 'ts-node' -and $_.CommandLine -match 'server\.ts' });" ^
  "if ($servers.Count -eq 0) { Write-Host 'No TopMSV server started from this folder is running.'; exit 1 };" ^
  "$failed = $false;" ^
  "foreach ($server in $servers) {" ^
  "  $top = $server;" ^
  "  $shell = $all | Where-Object { $_.ProcessId -eq $server.ParentProcessId -and $_.Name -eq 'cmd.exe' };" ^
  "  if ($shell) {" ^
  "    $npm = $all | Where-Object { $_.ProcessId -eq $shell.ParentProcessId -and $_.Name -eq 'node.exe' -and $_.CommandLine -match 'npm-cli\.js' };" ^
  "    if ($npm) { $top = $npm };" ^
  "  };" ^
  "  Write-Host ('Stopping the TopMSV server (process ' + $server.ProcessId + ')');" ^
  "  taskkill /PID $top.ProcessId /T /F | Out-Null;" ^
  "  if ($LASTEXITCODE -ne 0) { $failed = $true };" ^
  "};" ^
  "if ($failed) { exit 1 };" ^
  "exit 0"
if errorlevel 1 (
  pause
  exit /b 1
)

endlocal
