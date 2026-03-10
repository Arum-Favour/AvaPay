$content = Get-Content 'd:\downloads\avalanche-payroll-protocol-c49 (1)\.env' -Raw
$content = $content -replace "app`r?`npName=Cluster0", "appName=Cluster0"
Set-Content -Path 'd:\downloads\avalanche-payroll-protocol-c49 (1)\.env' -Value $content
Write-Host "Fixed!"

