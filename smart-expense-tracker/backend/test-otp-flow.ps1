# ============================================================
# Smart Expense Tracker - Password Reset OTP Flow Test Script
# ============================================================

$BASE_AUTH_URL = "http://localhost:5000/api/auth"

# Generate a unique email suffix using timestamp to avoid registration collision
$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$testEmail = "otp-tester-$timestamp@example.com"
$testPassword = "InitialPassword@123"
$newPassword = "UpdatedPassword@987"

Write-Host "Starting Password Reset OTP Flow Verification..." -ForegroundColor Green
Write-Host "Test Email: $testEmail" -ForegroundColor Yellow

# Helper for HTTP Requests
function Send-Request($url, $method, $bodyObj) {
    $bodyJson = $bodyObj | ConvertTo-Json
    try {
        $response = Invoke-RestMethod -Uri $url -Method $method `
            -ContentType "application/json" -Body $bodyJson -ErrorAction Stop
        return @{ Success = $true; Data = $response }
    }
    catch {
        $errorMsg = $_.Exception.Message
        if ($_.ErrorDetails.Message) {
            try {
                $errObj = $_.ErrorDetails.Message | ConvertFrom-Json
                if ($errObj.message) { $errorMsg = $errObj.message }
            } catch {}
        }
        return @{ Success = $false; Error = $errorMsg }
    }
}

# 1. Register the test user
Write-Host "`n1. Registering test user..." -ForegroundColor Cyan
$regRes = Send-Request "$BASE_AUTH_URL/register" "POST" @{
    name = "OTP Tester"
    email = $testEmail
    password = $testPassword
}
if ($regRes.Success) {
    Write-Host "[SUCCESS] User registered successfully!" -ForegroundColor Green
} else {
    Write-Host "[FAILED] Registration failed: $($regRes.Error)" -ForegroundColor Red
    exit 1
}

# 2. Trigger forgot password OTP request
Write-Host "`n2. Requesting Password Reset OTP..." -ForegroundColor Cyan
$forgotRes = Send-Request "$BASE_AUTH_URL/forgotpassword" "POST" @{
    email = $testEmail
}
if ($forgotRes.Success) {
    Write-Host "[SUCCESS] $($forgotRes.Data.message)" -ForegroundColor Green
} else {
    Write-Host "[FAILED] Failed to request OTP: $($forgotRes.Error)" -ForegroundColor Red
    exit 1
}

# 3. Retrieve the OTP code directly from MongoDB database
Write-Host "`n3. Retrieving OTP from MongoDB database..." -ForegroundColor Cyan
$nodeCmd = "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-expense-tracker').then(async () => { const User = require('./models/User'); const u = await User.findOne({ email: '$testEmail' }); console.log(u ? u.resetPasswordOTP : 'NOT_FOUND'); process.exit(0); }).catch(err => { console.error(err); process.exit(1); });"
$otp = (node -e $nodeCmd).Trim()

if ($otp -eq "NOT_FOUND" -or -not $otp) {
    Write-Host "[FAILED] Could not retrieve OTP code from database." -ForegroundColor Red
    exit 1
}
Write-Host "[SUCCESS] OTP code retrieved from database: $otp" -ForegroundColor Green

# 4. Verify invalid OTP code
Write-Host "`n4. Testing OTP verification with an invalid OTP..." -ForegroundColor Cyan
$verifyBadRes = Send-Request "$BASE_AUTH_URL/verifyotp" "POST" @{
    email = $testEmail
    otp = "000000"
}
if (-not $verifyBadRes.Success) {
    Write-Host "[SUCCESS] Invalid OTP correctly rejected: $($verifyBadRes.Error)" -ForegroundColor Green
} else {
    Write-Host "[FAILED] Invalid OTP was incorrectly accepted!" -ForegroundColor Red
    exit 1
}

# 5. Verify valid OTP code
Write-Host "`n5. Testing OTP verification with the correct OTP..." -ForegroundColor Cyan
$verifyGoodRes = Send-Request "$BASE_AUTH_URL/verifyotp" "POST" @{
    email = $testEmail
    otp = $otp
}
if ($verifyGoodRes.Success) {
    Write-Host "[SUCCESS] Correct OTP successfully verified: $($verifyGoodRes.Data.message)" -ForegroundColor Green
} else {
    Write-Host "[FAILED] Correct OTP was rejected: $($verifyGoodRes.Error)" -ForegroundColor Red
    exit 1
}

# 6. Attempt password reset with weak password (complexity check)
Write-Host "`n6. Testing password reset with a weak password (no uppercase/digits)..." -ForegroundColor Cyan
$resetWeakRes = Send-Request "$BASE_AUTH_URL/resetpassword" "POST" @{
    email = $testEmail
    otp = $otp
    password = "weakpwd"
}
if (-not $resetWeakRes.Success) {
    Write-Host "[SUCCESS] Weak password correctly rejected: $($resetWeakRes.Error)" -ForegroundColor Green
} else {
    Write-Host "[FAILED] Weak password was incorrectly accepted!" -ForegroundColor Red
    exit 1
}

# 7. Reset password with strong password using correct OTP
Write-Host "`n7. Testing password reset with strong password..." -ForegroundColor Cyan
$resetGoodRes = Send-Request "$BASE_AUTH_URL/resetpassword" "POST" @{
    email = $testEmail
    otp = $otp
    password = $newPassword
}
if ($resetGoodRes.Success) {
    Write-Host "[SUCCESS] Password reset successful: $($resetGoodRes.Data.message)" -ForegroundColor Green
} else {
    Write-Host "[FAILED] Password reset failed: $($resetGoodRes.Error)" -ForegroundColor Red
    exit 1
}

# 8. Attempt login with old password (should fail)
Write-Host "`n8. Attempting login with old password..." -ForegroundColor Cyan
$loginOldRes = Send-Request "$BASE_AUTH_URL/login" "POST" @{
    email = $testEmail
    password = $testPassword
}
if (-not $loginOldRes.Success) {
    Write-Host "[SUCCESS] Login with old password correctly rejected: $($loginOldRes.Error)" -ForegroundColor Green
} else {
    Write-Host "[FAILED] Login with old password incorrectly succeeded!" -ForegroundColor Red
    exit 1
}

# 9. Attempt login with new password (should succeed)
Write-Host "`n9. Attempting login with new password..." -ForegroundColor Cyan
$loginNewRes = Send-Request "$BASE_AUTH_URL/login" "POST" @{
    email = $testEmail
    password = $newPassword
}
if ($loginNewRes.Success) {
    Write-Host "[SUCCESS] Login with new password succeeded! Token: $($loginNewRes.Data.token.Substring(0, 30))..." -ForegroundColor Green
} else {
    Write-Host "[FAILED] Login with new password failed: $($loginNewRes.Error)" -ForegroundColor Red
    exit 1
}

Write-Host "`n============================================================" -ForegroundColor Yellow
Write-Host "All OTP Password Reset Flow tests passed successfully!" -ForegroundColor Green
Write-Host "============================================================`n" -ForegroundColor Yellow
