#!/usr/bin/env bash
set -euo pipefail

# Safe S3 bucket delete helper
# Usage examples:
#  Dry run (default): ./safe-delete-s3-buckets.sh --bucket my-bucket --region sa-east-1
#  Execute (after verifying dry-run outputs): ./safe-delete-s3-buckets.sh --bucket my-bucket --region sa-east-1 --execute --confirm my-bucket
#  Backup to local dir: ./safe-delete-s3-buckets.sh --bucket my-bucket --backup-dir ./backups/my-bucket --region sa-east-1
#  Backup to another bucket: ./safe-delete-s3-buckets.sh --bucket my-bucket --backup-bucket my-backup-bucket --region sa-east-1

# NOTE: This script uses the AWS CLI. Ensure your AWS credentials/profile are configured and you have the required IAM permissions.

print_usage() {
  cat <<EOF
Safe S3 Bucket Delete Script

Options:
  --bucket BUCKET_NAME        (required) bucket to delete
  --region REGION             (required) AWS region of the bucket
  --profile PROFILE           (optional) AWS CLI profile to use
  --backup-dir PATH           (optional) local directory to sync objects before deleting
  --backup-bucket BUCKET      (optional) destination S3 bucket to sync objects before deleting
  --dry-run                   (default) show actions without deleting
  --execute                   actually perform deletions (requires --confirm)
  --confirm BUCKET_NAME       type the bucket name to confirm destructive action
  -h, --help                  show this help

Recommended flow:
  1) Run a dry-run (no --execute) to inspect what will be deleted
  2) Provide a backup destination (--backup-dir or --backup-bucket) and verify the backup
  3) Re-run with --execute and --confirm <bucket-name>

EOF
}

# Defaults
DRY_RUN=true
PROFILE_ARG=""
BACKUP_DIR=""
BACKUP_BUCKET=""
BUCKET=""
REGION=""
CONFIRM=""

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --bucket) BUCKET="$2"; shift 2;;
    --region) REGION="$2"; shift 2;;
    --profile) PROFILE_ARG="--profile $2"; shift 2;;
    --backup-dir) BACKUP_DIR="$2"; shift 2;;
    --backup-bucket) BACKUP_BUCKET="$2"; shift 2;;
    --dry-run) DRY_RUN=true; shift;;
    --execute) DRY_RUN=false; shift;;
    --confirm) CONFIRM="$2"; shift 2;;
    -h|--help) print_usage; exit 0;;
    *) echo "Unknown arg: $1"; print_usage; exit 1;;
  esac
done

if [[ -z "$BUCKET" || -z "$REGION" ]]; then
  echo "Error: --bucket and --region are required"
  print_usage
  exit 1
fi

if [[ "$DRY_RUN" = false && "$CONFIRM" != "$BUCKET" ]]; then
  echo "To actually delete, you must pass --execute and --confirm $BUCKET"
  exit 1
fi

# Helper to run or echo commands depending on dry-run
run_cmd() {
  if [[ "$DRY_RUN" = true ]]; then
    echo "DRY-RUN: $*"
  else
    echo "+ $*"
    eval "$@"
  fi
}

# Ensure aws CLI present
if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI not found. Install and configure AWS CLI before running."
  exit 1
fi

echo "Bucket: $BUCKET"
echo "Region: $REGION"
echo "Profile arg: $PROFILE_ARG"
echo "Dry run: $DRY_RUN"

# 1) List top-level info
echo "\n== Bucket info =="
run_cmd aws s3api get-bucket-location --bucket "$BUCKET" --region "$REGION" $PROFILE_ARG || true
run_cmd aws s3api get-bucket-versioning --bucket "$BUCKET" --region "$REGION" $PROFILE_ARG || true

# 2) Backup / Sync (optional)
if [[ -n "$BACKUP_DIR" ]]; then
  echo "\n== Backing up to local dir: $BACKUP_DIR =="
  if [[ "$DRY_RUN" = false ]]; then
    mkdir -p "$BACKUP_DIR"
  fi
  run_cmd aws s3 sync "s3://$BUCKET" "$BACKUP_DIR" --region "$REGION" $PROFILE_ARG
fi

if [[ -n "$BACKUP_BUCKET" ]]; then
  echo "\n== Backing up to bucket: $BACKUP_BUCKET =="
  run_cmd aws s3 ls "s3://$BACKUP_BUCKET" --region "$REGION" $PROFILE_ARG || echo "Backup bucket may not exist yet"
  run_cmd aws s3 sync "s3://$BUCKET" "s3://$BACKUP_BUCKET" --region "$REGION" $PROFILE_ARG
fi

# 3) Determine if versioning is enabled
VERSIONING_STATUS=$(aws s3api get-bucket-versioning --bucket "$BUCKET" --region "$REGION" $PROFILE_ARG 2>/dev/null || true)
if echo "$VERSIONING_STATUS" | grep -q "Enabled"; then
  VERSIONED=true
else
  VERSIONED=false
fi

echo "\nVersioned bucket: $VERSIONED"

# 4) List objects to be deleted (dry-run prints, execute deletes)
echo "\n== Objects preview (first 100) =="
run_cmd aws s3api list-objects-v2 --bucket "$BUCKET" --region "$REGION" --max-items 100 $PROFILE_ARG --query 'Contents[].{Key:Key,Size:Size,LastModified:LastModified}' --output table || true

# 5) If versioned, delete all versions and delete markers
if [[ "$VERSIONED" = true ]]; then
  echo "\n== Deleting object versions and delete markers (this may take time) =="
  # Delete Versions
  echo "Listing Versions..."
  if [[ "$DRY_RUN" = true ]]; then
    aws s3api list-object-versions --bucket "$BUCKET" --region "$REGION" $PROFILE_ARG --query 'Versions[].{Key:Key,VersionId:VersionId}' --output text | awk '{print $1 "\t" $2}' | sed -n '1,200p' || true
  else
    aws s3api list-object-versions --bucket "$BUCKET" --region "$REGION" $PROFILE_ARG --query 'Versions[].{Key:Key,VersionId:VersionId}' --output text | while read -r key version; do
      if [[ -n "$key" && -n "$version" ]]; then
        echo "Deleting version: $key / $version"
        aws s3api delete-object --bucket "$BUCKET" --key "$key" --version-id "$version" --region "$REGION" $PROFILE_ARG || true
      fi
    done
  fi

  # Delete DeleteMarkers
  echo "Listing DeleteMarkers..."
  if [[ "$DRY_RUN" = true ]]; then
    aws s3api list-object-versions --bucket "$BUCKET" --region "$REGION" $PROFILE_ARG --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}' --output text | sed -n '1,200p' || true
  else
    aws s3api list-object-versions --bucket "$BUCKET" --region "$REGION" $PROFILE_ARG --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}' --output text | while read -r key version; do
      if [[ -n "$key" && -n "$version" ]]; then
        echo "Deleting delete marker: $key / $version"
        aws s3api delete-object --bucket "$BUCKET" --key "$key" --version-id "$version" --region "$REGION" $PROFILE_ARG || true
      fi
    done
  fi
fi

# 6) Delete remaining (non-versioned) objects
echo "\n== Deleting remaining objects (recursive) =="
run_cmd aws s3 rm "s3://$BUCKET" --recursive --region "$REGION" $PROFILE_ARG || true

# 7) Final check: list objects (should be empty)
echo "\n== Final objects check =="
run_cmd aws s3api list-objects-v2 --bucket "$BUCKET" --region "$REGION" $PROFILE_ARG --query 'Contents' --output json || true

# 8) Delete bucket
if [[ "$DRY_RUN" = true ]]; then
  echo "\nDRY-RUN: bucket not deleted. Re-run with --execute --confirm $BUCKET to delete."
else
  echo "\nDeleting bucket: $BUCKET"
  run_cmd aws s3api delete-bucket --bucket "$BUCKET" --region "$REGION" $PROFILE_ARG
  echo "Bucket delete attempted. If AWS returned no error, bucket deletion succeeded."
fi

# 9) Done
echo "\nDone. Review output above. If you backed up to a bucket, verify backup before permanently removing backups."
