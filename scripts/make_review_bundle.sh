#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Review Bundle Generator for Cohe Capital Monorepo
# ==============================================================================
# Creates a reproducible offline review bundle with manifest and tree structure
# Usage: bash scripts/make_review_bundle.sh
# ==============================================================================

# Check we're at repo root
if [[ ! -f "pnpm-workspace.yaml" ]] && [[ ! -f "package.json" ]]; then
  echo "ERROR: Must run from repository root (no pnpm-workspace.yaml or package.json found)" >&2
  exit 1
fi

# Configuration
BUNDLE_DIR=".review_bundles"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ZIP_NAME="cohe-capitl-review-${TIMESTAMP}.zip"
ZIP_PATH="${BUNDLE_DIR}/${ZIP_NAME}"

# Save current directory (absolute path)
REPO_ROOT="$(pwd)"

# Create output directory
mkdir -p "$BUNDLE_DIR"

# Create temporary staging directory
STAGING_DIR=$(mktemp -d)
trap 'rm -rf "$STAGING_DIR"' EXIT

echo "Building review bundle..."
echo "Staging directory: $STAGING_DIR"

# ==============================================================================
# Helper Functions
# ==============================================================================

copy_if_exists() {
  local src="$1"
  local dst="${STAGING_DIR}/${src}"

  if [[ -e "$src" ]]; then
    mkdir -p "$(dirname "$dst")"
    cp -r "$src" "$dst"
    echo "  ✓ ${src}"
  fi
}

# ==============================================================================
# Copy Files to Staging
# ==============================================================================

# Root files
echo ""
echo "Copying root files..."
for file in README.md pnpm-lock.yaml yarn.lock package-lock.json pnpm-workspace.yaml turbo.json; do
  copy_if_exists "$file"
done

# Config files with glob patterns
echo ""
echo "Copying config files..."
shopt -s nullglob
for file in .prettierrc* .eslintrc* tsconfig.base.json; do
  copy_if_exists "$file"
done
shopt -u nullglob

# GitHub workflows and templates
echo ""
echo "Copying GitHub files..."
if [[ -d ".github" ]]; then
  mkdir -p "${STAGING_DIR}/.github"

  # Workflows
  if [[ -d ".github/workflows" ]]; then
    mkdir -p "${STAGING_DIR}/.github/workflows"
    find .github/workflows -type f \( -name "*.yml" -o -name "*.yaml" \) 2>/dev/null | while read -r file; do
      dst="${STAGING_DIR}/${file}"
      mkdir -p "$(dirname "$dst")"
      cp "$file" "$dst"
      echo "  ✓ ${file}"
    done
  fi

  # Issue and PR templates
  for template_dir in ISSUE_TEMPLATE PULL_REQUEST_TEMPLATE issue_template pull_request_template; do
    if [[ -d ".github/${template_dir}" ]]; then
      cp -r ".github/${template_dir}" "${STAGING_DIR}/.github/"
      echo "  ✓ .github/${template_dir}"
    fi
  done
fi

# Documentation
echo ""
echo "Copying documentation..."
if [[ -d "docs" ]]; then
  mkdir -p "${STAGING_DIR}/docs"

  # Copy important documentation files
  for doc_file in CHANGELOG.md project_state.md; do
    if [[ -f "docs/${doc_file}" ]]; then
      cp "docs/${doc_file}" "${STAGING_DIR}/docs/"
      echo "  ✓ docs/${doc_file}"
    fi
  done

  # Copy any other markdown files in docs/
  find docs -maxdepth 1 -type f -name "*.md" 2>/dev/null | while read -r file; do
    filename=$(basename "$file")
    # Skip if already copied above
    if [[ "$filename" != "CHANGELOG.md" ]] && [[ "$filename" != "project_state.md" ]]; then
      cp "$file" "${STAGING_DIR}/docs/"
      echo "  ✓ ${file}"
    fi
  done
fi

# Root documentation files
for doc in CLAUDE.md CODEX.md; do
  if [[ -f "$doc" ]]; then
    cp "$doc" "${STAGING_DIR}/"
    echo "  ✓ ${doc}"
  fi
done

# apps/api
echo ""
echo "Copying apps/api..."
if [[ -d "apps/api" ]]; then
  mkdir -p "${STAGING_DIR}/apps/api"

  # Source code
  if [[ -d "apps/api/src" ]]; then
    cp -r "apps/api/src" "${STAGING_DIR}/apps/api/"
    echo "  ✓ apps/api/src"
  fi

  # Prisma
  if [[ -d "apps/api/prisma" ]]; then
    mkdir -p "${STAGING_DIR}/apps/api/prisma"

    if [[ -f "apps/api/prisma/schema.prisma" ]]; then
      cp "apps/api/prisma/schema.prisma" "${STAGING_DIR}/apps/api/prisma/"
      echo "  ✓ apps/api/prisma/schema.prisma"
    fi

    if [[ -d "apps/api/prisma/migrations" ]]; then
      cp -r "apps/api/prisma/migrations" "${STAGING_DIR}/apps/api/prisma/"
      echo "  ✓ apps/api/prisma/migrations"
    fi
  fi

  # Config files
  for file in package.json tsconfig.json README.md .env.example openapi.json; do
    if [[ -f "apps/api/${file}" ]]; then
      cp "apps/api/${file}" "${STAGING_DIR}/apps/api/"
      echo "  ✓ apps/api/${file}"
    fi
  done
fi

# Root prisma (if separate from apps/api)
echo ""
echo "Copying root prisma..."
if [[ -d "prisma" ]]; then
  mkdir -p "${STAGING_DIR}/prisma"

  if [[ -f "prisma/schema.prisma" ]]; then
    cp "prisma/schema.prisma" "${STAGING_DIR}/prisma/"
    echo "  ✓ prisma/schema.prisma"
  fi

  if [[ -d "prisma/migrations" ]]; then
    cp -r "prisma/migrations" "${STAGING_DIR}/prisma/"
    echo "  ✓ prisma/migrations"
  fi
fi

# apps/mobile
echo ""
echo "Copying apps/mobile..."
if [[ -d "apps/mobile" ]]; then
  mkdir -p "${STAGING_DIR}/apps/mobile"

  if [[ -d "apps/mobile/src" ]]; then
    cp -r "apps/mobile/src" "${STAGING_DIR}/apps/mobile/"
    echo "  ✓ apps/mobile/src"
  fi

  for file in package.json app.json; do
    if [[ -f "apps/mobile/${file}" ]]; then
      cp "apps/mobile/${file}" "${STAGING_DIR}/apps/mobile/"
      echo "  ✓ apps/mobile/${file}"
    fi
  done

  shopt -s nullglob
  for file in apps/mobile/app.config.*; do
    cp "$file" "${STAGING_DIR}/${file}"
    echo "  ✓ ${file}"
  done
  shopt -u nullglob
fi

# apps/admin
echo ""
echo "Copying apps/admin..."
if [[ -d "apps/admin" ]]; then
  mkdir -p "${STAGING_DIR}/apps/admin"

  for dir in src app; do
    if [[ -d "apps/admin/${dir}" ]]; then
      cp -r "apps/admin/${dir}" "${STAGING_DIR}/apps/admin/"
      echo "  ✓ apps/admin/${dir}"
    fi
  done

  if [[ -f "apps/admin/package.json" ]]; then
    cp "apps/admin/package.json" "${STAGING_DIR}/apps/admin/"
    echo "  ✓ apps/admin/package.json"
  fi

  shopt -s nullglob
  for file in apps/admin/next.config.*; do
    cp "$file" "${STAGING_DIR}/${file}"
    echo "  ✓ ${file}"
  done
  shopt -u nullglob
fi

# packages
echo ""
echo "Copying packages..."
for pkg in types ui config; do
  if [[ -d "packages/${pkg}" ]]; then
    mkdir -p "${STAGING_DIR}/packages/${pkg}"
    cp -r "packages/${pkg}"/* "${STAGING_DIR}/packages/${pkg}/" 2>/dev/null || true
    echo "  ✓ packages/${pkg}"
  fi
done

# ==============================================================================
# Clean Excluded Patterns
# ==============================================================================

echo ""
echo "Removing excluded patterns..."

cd "$STAGING_DIR"

# Remove excluded directories
find . -type d \( \
  -name "node_modules" -o \
  -name "dist" -o \
  -name ".next" -o \
  -name ".expo" -o \
  -name ".turbo" -o \
  -name "coverage" -o \
  -name "build" \
\) -exec rm -rf {} + 2>/dev/null || true

# Remove excluded files
find . -type f \( \
  -name "*.pem" -o \
  -name "*.key" -o \
  -name "*.p12" \
\) -delete 2>/dev/null || true

# Remove .env files (but keep .env.example)
find . -type f -name ".env" -delete 2>/dev/null || true
find . -type f -name ".env.*" ! -name ".env.example" -delete 2>/dev/null || true

echo "  ✓ Cleaned excluded patterns"

# ==============================================================================
# Generate manifest.json
# ==============================================================================

echo ""
echo "Generating manifest.json..."

MANIFEST_FILE="${STAGING_DIR}/manifest.json"

# Detect sha256 command
if command -v sha256sum >/dev/null 2>&1; then
  SHA_CMD="sha256sum"
elif command -v shasum >/dev/null 2>&1; then
  SHA_CMD="shasum -a 256"
else
  echo "ERROR: Neither sha256sum nor shasum found" >&2
  exit 1
fi

# Start JSON
{
  echo "{"
  echo "  \"bundle\": \"cohe-capitl-review-${TIMESTAMP}\","
  echo "  \"generated\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"files\": ["

  # Collect all files
  first=true
  find . -type f ! -name "manifest.json" ! -name "TREE.txt" | sort | while read -r file; do
    # Remove leading ./
    clean_path="${file#./}"

    # Get size (compatible with both Linux and macOS)
    if stat -c %s "$file" >/dev/null 2>&1; then
      size=$(stat -c %s "$file")
    else
      size=$(stat -f %z "$file")
    fi

    # Get sha256
    hash=$($SHA_CMD "$file" | awk '{print $1}')

    # Add comma separator (except for first entry)
    if [[ "$first" == "false" ]]; then
      echo ","
    fi
    first=false

    # Write JSON entry
    printf '    {"path": "%s", "size": %d, "sha256": "%s"}' "$clean_path" "$size" "$hash"
  done

  echo ""
  echo "  ]"
  echo "}"
} > "$MANIFEST_FILE"

echo "  ✓ manifest.json created"

# ==============================================================================
# Generate TREE.txt
# ==============================================================================

echo ""
echo "Generating TREE.txt..."

TREE_FILE="${STAGING_DIR}/TREE.txt"

if command -v tree >/dev/null 2>&1; then
  # Use tree command if available
  tree -a -I "manifest.json|TREE.txt" --charset ascii > "$TREE_FILE"
else
  # Fallback: manual tree generation
  {
    echo "."
    find . ! -path "." ! -name "manifest.json" ! -name "TREE.txt" | sort | sed 's|^\./||' | while read -r path; do
      # Count directory depth
      depth=$(echo "$path" | tr -cd '/' | wc -c)
      name=$(basename "$path")

      # Create indentation
      prefix=""
      for ((i=0; i<depth; i++)); do
        prefix="${prefix}  "
      done

      # Add directory marker
      if [[ -d "$path" ]]; then
        echo "${prefix}├── ${name}/"
      else
        echo "${prefix}├── ${name}"
      fi
    done
  } > "$TREE_FILE"
fi

echo "  ✓ TREE.txt created"

# ==============================================================================
# Create ZIP Archive
# ==============================================================================

echo ""
echo "Creating zip archive..."

if ! command -v zip >/dev/null 2>&1; then
  echo "ERROR: zip command not found" >&2
  exit 1
fi

# Create zip using absolute path
FULL_ZIP_PATH="${REPO_ROOT}/${ZIP_PATH}"
cd "$STAGING_DIR"
zip -q -r "$FULL_ZIP_PATH" .
cd "$REPO_ROOT"

# ==============================================================================
# Output Results
# ==============================================================================

# FULL_ZIP_PATH already defined above
FILE_COUNT=$(unzip -l "$FULL_ZIP_PATH" | tail -n 1 | awk '{print $2}')
ZIP_SIZE=$(du -h "$FULL_ZIP_PATH" | awk '{print $1}')

echo ""
echo "=========================================================================="
echo "✓ Review bundle created successfully!"
echo "=========================================================================="
echo ""
echo "  Location: ${FULL_ZIP_PATH}"
echo "  Size:     ${ZIP_SIZE}"
echo "  Files:    ${FILE_COUNT}"
echo ""
echo "Contents include:"
echo "  - manifest.json (file hashes and metadata)"
echo "  - TREE.txt (directory structure)"
echo "  - Source code and configurations"
echo ""
echo "To extract:"
echo "  unzip ${ZIP_PATH}"
echo ""
echo "${FULL_ZIP_PATH}"
