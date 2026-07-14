# ============================================================
# Smart Expense Tracker - Mobile App Launcher
# Run this script instead of 'flutter run' to avoid OneDrive
# interference with Gradle builds.
# ============================================================

Write-Host "`n Smart Expense Tracker - Mobile Launcher" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# Step 1: Kill any leftover Java/Gradle processes
Write-Host "[1/4] Stopping any leftover Gradle processes..." -ForegroundColor Yellow
Get-Process -Name "java" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# Step 2: Clear the project-level .gradle lock folder
Write-Host "[2/4] Clearing Gradle lock files..." -ForegroundColor Yellow
Remove-Item -Path "$PSScriptRoot\android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path "$PSScriptRoot\android\.gradle" -Force | Out-Null

# Step 3: Mark .gradle and build as System+Hidden so OneDrive won't sync/lock them
Write-Host "[3/4] Protecting build folders from OneDrive sync..." -ForegroundColor Yellow
attrib +S +H "$PSScriptRoot\android\.gradle"
attrib +S +H "$PSScriptRoot\build"

# Step 4: Run Flutter with Gradle cache outside OneDrive
Write-Host "[4/4] Launching app on connected Android device...`n" -ForegroundColor Green
$env:Path += ";C:\Users\chath\AppData\Local\Android\sdk\platform-tools"
$env:GRADLE_USER_HOME = "C:\GradleCache"

flutter run -d 126404048R000727
