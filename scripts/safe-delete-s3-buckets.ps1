<#
.SYNOPSIS
  Safe S3 bucket delete helper for Windows/PowerShell

.DESCRIPTION
  This script provides a dry-run by default and requires explicit confirmation to perform destructive actions.

.EXAMPLE
  Dry run:
    .\safe-delete-s3-buckets.ps1 -BucketName my-bucket -Region sa-east-1

  Execute (after verifying dry run output):
    .\safe-delete-s3-buckets.ps1 -BucketName my-bucket -Region sa-east-1 -Execute -ConfirmName my-bucket

#>
param(
    [Parameter(Mandatory = $true)] [string] $BucketName,
    [Parameter(Mandatory = $true)] [string] $Region,
    [string] $Profile = $null,
    [string] $BackupDir = $null,
    [string] $BackupBucket = $null,
    [switch] $Execute,
    [string] $ConfirmName = $null
)

function Show-Usage {
    Write-Host "Usage:`n  -BucketName <name> -Region <region> [-Profile <profile>] [-BackupDir <path>] [-BackupBucket <bucket>] [-Execute -ConfirmName <name>]"
}

if ($Execute -and ($ConfirmName -ne $BucketName)) {
    Write-Error "To actually delete, use -Execute and -ConfirmName $BucketName"
    exit 1
}

$ProfileArg = if ($Profile) { "--profile $Profile" } else { "" }
$DryRun = -not $Execute

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error "aws CLI not found. Install and configure AWS CLI before running."
    exit 1
}

Write-Host "Bucket: $BucketName"
Write-Host "Region: $Region"
Write-Host "Profile: $Profile"
Write-Host "Dry run: $DryRun"

Write-Host "`n== Bucket info =="
if ($DryRun) {
    Write-Host "DRY-RUN: aws s3api get-bucket-location --bucket $BucketName --region $Region $ProfileArg"
    Write-Host "DRY-RUN: aws s3api get-bucket-versioning --bucket $BucketName --region $Region $ProfileArg"
}
else {
    aws s3api get-bucket-location --bucket $BucketName --region $Region $ProfileArg | Write-Output
    aws s3api get-bucket-versioning --bucket $BucketName --region $Region $ProfileArg | Write-Output
}

if ($BackupDir) {
    Write-Host "`n== Backing up to local dir: $BackupDir =="
    if (-not $DryRun) { New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null }
    if ($DryRun) { Write-Host "DRY-RUN: aws s3 sync s3://$BucketName $BackupDir --region $Region $ProfileArg" }
    else { aws s3 sync "s3://$BucketName" "$BackupDir" --region $Region $ProfileArg }
}

if ($BackupBucket) {
    Write-Host "`n== Backing up to bucket: $BackupBucket =="
    if ($DryRun) { Write-Host "DRY-RUN: aws s3 sync s3://$BucketName s3://$BackupBucket --region $Region $ProfileArg" }
    else { aws s3 sync "s3://$BucketName" "s3://$BackupBucket" --region $Region $ProfileArg }
}

$versioning = aws s3api get-bucket-versioning --bucket $BucketName --region $Region $ProfileArg 2>$null | Out-String
$IsVersioned = $versioning -match 'Enabled'
Write-Host "`nVersioned bucket: $IsVersioned"

Write-Host "`n== Objects preview (first 100) =="
if ($DryRun) {
    Write-Host "DRY-RUN: aws s3api list-objects-v2 --bucket $BucketName --region $Region --max-items 100 $ProfileArg --query 'Contents[].{Key:Key,Size:Size,LastModified:LastModified}' --output table"
}
else {
    aws s3api list-objects-v2 --bucket $BucketName --region $Region --max-items 100 $ProfileArg --query 'Contents[].{Key:Key,Size:Size,LastModified:LastModified}' --output table
}

if ($IsVersioned) {
    Write-Host "`n== Deleting object versions and delete markers =="
    if ($DryRun) {
        Write-Host "DRY-RUN: list versions (sample)"
        aws s3api list-object-versions --bucket $BucketName --region $Region $ProfileArg --query 'Versions[].{Key:Key,VersionId:VersionId}' --output text | Select-Object -First 200
    }
    else {
        aws s3api list-object-versions --bucket $BucketName --region $Region $ProfileArg --query 'Versions[].{Key:Key,VersionId:VersionId}' --output text | ForEach-Object {
            $parts = $_ -split "\t|\s+"
            $key = $parts[0]
            $version = $parts[1]
            if ($key -and $version) {
                Write-Host "Deleting version: $key / $version"
                aws s3api delete-object --bucket $BucketName --key "$key" --version-id $version --region $Region $ProfileArg
            }
        }
        aws s3api list-object-versions --bucket $BucketName --region $Region $ProfileArg --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}' --output text | ForEach-Object {
            $parts = $_ -split "\t|\s+"
            $key = $parts[0]
            $version = $parts[1]
            if ($key -and $version) {
                Write-Host "Deleting delete marker: $key / $version"
                aws s3api delete-object --bucket $BucketName --key "$key" --version-id $version --region $Region $ProfileArg
            }
        }
    }
}

Write-Host "`n== Deleting remaining (recursive) =="
if ($DryRun) { Write-Host "DRY-RUN: aws s3 rm s3://$BucketName --recursive --region $Region $ProfileArg" }
else { aws s3 rm "s3://$BucketName" --recursive --region $Region $ProfileArg }

Write-Host "`n== Final objects check =="
if ($DryRun) { Write-Host "DRY-RUN: aws s3api list-objects-v2 --bucket $BucketName --region $Region $ProfileArg --query 'Contents' --output json" }
else { aws s3api list-objects-v2 --bucket $BucketName --region $Region $ProfileArg --query 'Contents' --output json }

if ($DryRun) {
    Write-Host "\nDRY-RUN: bucket not deleted. Re-run with -Execute -ConfirmName $BucketName to delete."
}
else {
    Write-Host "\nDeleting bucket: $BucketName"
    aws s3api delete-bucket --bucket $BucketName --region $Region $ProfileArg
    Write-Host "Bucket delete attempted. If AWS returned no error, bucket deletion succeeded."
}

Write-Host "`nDone. Verify backups before removing any backup resources."
