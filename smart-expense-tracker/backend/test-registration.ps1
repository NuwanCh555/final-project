
# ============================================================
# Smart Expense Tracker - Registration Flow Test Script
# Tests that:
#   1. Multiple accounts can be created from the same device/IP
#   2. Duplicate email registrations are correctly rejected
# ============================================================

$BASE_URL = "http://localhost:5000/api/auth/register"

# Generate a unique email suffix using timestamp to avoid registration collision and make tests repeatable
$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$email1 = "alice-$timestamp@example.com"
$email2 = "bob-$timestamp@example.com"

function Register-User($label, $name, $email, $password) {
    Write-Host "`n--- $label ---" -ForegroundColor Cyan
    Write-Host "POST $BASE_URL" -ForegroundColor Gray
    Write-Host "Body: name=$name | email=$email | password=$password" -ForegroundColor Gray

    $body = @{ name = $name; email = $email; password = $password } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri $BASE_URL -Method POST `
            -ContentType "application/json" -Body $body -ErrorAction Stop

        Write-Host "[SUCCESS] User registered!" -ForegroundColor Green
        Write-Host "  _id   : $($response.user._id)"
        Write-Host "  name  : $($response.user.name)"
        Write-Host "  email : $($response.user.email)"
        Write-Host "  token : $($response.token.Substring(0,30))..." -ForegroundColor DarkGray
    }
    catch {
        $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        $msg = if ($err) { $err.error } else { $_.Exception.Message }
        Write-Host "[FAILED] $msg" -ForegroundColor Red
    }
}

# Test 1: Register first user from this device/IP
Register-User "Test 1: First Account (same device)" "Alice Smith" $email1 "Alice@1234"

# Test 2: Register second user from this device/IP (different email)
Register-User "Test 2: Second Account (same device, different email)" "Bob Jones" $email2 "Bob@5678"

# Test 3: Try to register with the SAME email as Test 1 — should be rejected
Register-User "Test 3: Duplicate Email (should FAIL)" "Alice Again" $email1 "Alice@1234"

Write-Host "`n============================================================" -ForegroundColor Yellow
Write-Host "Expected Results:" -ForegroundColor Yellow
Write-Host "  Test 1 -> SUCCESS (new account)" -ForegroundColor Green
Write-Host "  Test 2 -> SUCCESS (new account, same IP)" -ForegroundColor Green
Write-Host "  Test 3 -> FAILED  (duplicate email blocked)" -ForegroundColor Red
Write-Host "============================================================`n" -ForegroundColor Yellow
