# Review Bundle Scripts

Scripts for creating offline review bundles of the Cohe Capital monorepo.

## Overview

The review bundle system creates a reproducible, self-contained archive of your codebase for offline code review. It includes:

- ✅ Source code from all apps and packages
- ✅ Configuration files and schemas
- ✅ Database migrations
- ✅ **manifest.json** - SHA256 hashes and metadata for all files
- ✅ **TREE.txt** - Visual directory structure
- ❌ No secrets (.env, .pem, .key files)
- ❌ No build artifacts (node_modules, dist, .next)

## Quick Start

### macOS / Linux

```bash
# From repository root
bash scripts/make_review_bundle.sh
```

### Windows

```powershell
# From repository root
.\scripts\make_review_bundle.ps1
```

### GitHub Actions

Manually trigger the workflow:
1. Go to Actions → "Create Review Bundle"
2. Click "Run workflow"
3. Download the artifact from the workflow run

## Requirements

### macOS / Linux
- `bash` 4.0+
- `zip` command
- `sha256sum` or `shasum` (usually pre-installed)
- `find`, `sed`, `awk` (POSIX standard)

**Install zip if missing:**
```bash
# Ubuntu/Debian
sudo apt-get install zip

# macOS (usually pre-installed, or via Homebrew)
brew install zip

# RHEL/CentOS/Fedora
sudo yum install zip
```

### Windows
- PowerShell 5.1+ (Windows 10/11 built-in)
- No additional dependencies required

## Output

The script creates:

```
.review_bundles/
└── cohe-capitl-review-YYYYMMDD-HHMMSS.zip
```

**Example output:**
```
.review_bundles/cohe-capitl-review-20241026-143022.zip
```

## Bundle Contents

### Included Paths

The bundle includes (if they exist):

| Path | Description |
|------|-------------|
| `README.md` | Root documentation |
| `CLAUDE.md` | AI collaboration guide |
| `CODEX.md` | Code style standards |
| `docs/CHANGELOG.md` | Development history & progress log |
| `docs/project_state.md` | Project status & task tracking |
| `docs/*.md` | Other documentation files |
| `pnpm-workspace.yaml` | Workspace configuration |
| `pnpm-lock.yaml` | Dependency lockfile |
| `turbo.json` | Turborepo configuration |
| `.prettierrc*` | Code formatting config |
| `.eslintrc*` | Linting rules |
| `tsconfig.base.json` | Base TypeScript config |
| `.github/workflows/*.yml` | CI/CD workflows |
| `.github/ISSUE_TEMPLATE/` | Issue templates |
| `.github/PULL_REQUEST_TEMPLATE/` | PR templates |
| `apps/api/src/**` | API source code |
| `apps/api/prisma/**` | Database schema & migrations |
| `apps/api/package.json` | API dependencies |
| `apps/api/README.md` | API documentation |
| `apps/api/.env.example` | Environment template |
| `apps/mobile/**` | Mobile app (if exists) |
| `apps/admin/**` | Admin app (if exists) |
| `packages/types/**` | Shared TypeScript types |
| `packages/ui/**` | UI components |
| `packages/config/**` | Shared configuration |

### Excluded Patterns

The following are **never** included:

- `node_modules/` - Dependencies
- `dist/`, `build/` - Build outputs
- `.next/`, `.expo/` - Framework caches
- `.turbo/` - Turborepo cache
- `coverage/` - Test coverage
- `.env`, `.env.*` - Environment variables (except `.env.example`)
- `*.pem`, `*.key`, `*.p12` - Secret keys and certificates

## Special Files

### manifest.json

JSON file containing metadata for every file in the bundle:

```json
{
  "bundle": "cohe-capitl-review-20241026-143022",
  "generated": "2024-10-26T14:30:22Z",
  "files": [
    {
      "path": "apps/api/src/main.ts",
      "size": 2048,
      "sha256": "a1b2c3d4e5f6..."
    }
  ]
}
```

**Use cases:**
- Verify bundle integrity
- Detect file modifications
- Audit what was reviewed
- Compare bundles across versions

### TREE.txt

Visual representation of the bundle's directory structure:

```
.
├── README.md
├── apps/
│   └── api/
│       ├── src/
│       ├── prisma/
│       └── package.json
└── packages/
    └── types/
```

## Usage Scenarios

### 1. Code Review

Send the bundle to an external reviewer:

```bash
# Create bundle
bash scripts/make_review_bundle.sh

# Send to reviewer
# Upload .review_bundles/cohe-capitl-review-*.zip to Google Drive, Dropbox, etc.
```

Reviewer extracts and reviews offline:
```bash
unzip cohe-capitl-review-20241026-143022.zip -d cohe-review
cd cohe-review
cat TREE.txt  # Overview
cat manifest.json | jq '.files | length'  # File count
```

### 2. Audit & Compliance

Create timestamped snapshots for compliance:

```bash
# Create monthly audit bundle
bash scripts/make_review_bundle.sh

# Archive with date
mv .review_bundles/cohe-capitl-review-*.zip \
   ./audit-archive/review-2024-10.zip
```

### 3. Automated CI/CD

Trigger via GitHub Actions:
- Pull request reviews
- Release candidates
- Security audits

### 4. Offline Development Reference

Create a bundle before traveling or working offline:

```bash
bash scripts/make_review_bundle.sh
# Extract to laptop for offline reference
```

## Verification

### Verify SHA256 Hashes

```bash
# Extract bundle
unzip cohe-capitl-review-*.zip -d review-extract

# Verify a specific file
cd review-extract
sha256sum apps/api/src/main.ts

# Compare with manifest.json
cat manifest.json | jq '.files[] | select(.path == "apps/api/src/main.ts")'
```

### Verify No Secrets

```bash
# Search for .env files (should only find .env.example)
unzip -l cohe-capitl-review-*.zip | grep "\.env"

# Search for secret files (should return nothing)
unzip -l cohe-capitl-review-*.zip | grep -E "\.pem|\.key|\.p12"
```

## Troubleshooting

### Error: "Must run from repository root"

**Solution:** Run from the monorepo root directory where `pnpm-workspace.yaml` exists:

```bash
cd /path/to/cohe-capitl-monorepo
bash scripts/make_review_bundle.sh
```

### Error: "zip command not found"

**Solution (Linux):**
```bash
sudo apt-get install zip
```

**Solution (macOS):**
```bash
brew install zip
```

### Error: "sha256sum: command not found"

The script automatically falls back to `shasum -a 256` on macOS. If both are missing:

```bash
# macOS (shasum should be pre-installed)
which shasum

# Linux - install coreutils
sudo apt-get install coreutils
```

### Bundle is too large

If the bundle exceeds expected size:

1. Check for accidentally included files:
   ```bash
   unzip -l .review_bundles/cohe-capitl-review-*.zip | sort -k4 -n | tail -20
   ```

2. Verify exclusions are working:
   ```bash
   # Should return nothing
   unzip -l *.zip | grep node_modules
   unzip -l *.zip | grep dist
   ```

## Advanced Usage

### Custom Bundle Location

Modify the `BUNDLE_DIR` variable in the script:

```bash
# Edit scripts/make_review_bundle.sh
BUNDLE_DIR="custom/output/path"
```

### Include Additional Files

Edit the script to copy additional paths:

```bash
# Add after the existing copy_if_exists calls
copy_if_exists "docs/"
copy_if_exists "contracts/"
```

### Scheduled Bundles (cron)

Create daily bundles automatically:

```bash
# Add to crontab
0 2 * * * cd /path/to/repo && bash scripts/make_review_bundle.sh
```

## Security Considerations

✅ **What's safe:**
- Source code
- Configuration files
- Documentation
- Database migrations (SQL only)
- Public schemas

❌ **Never included:**
- Environment variables (`.env`)
- API keys and secrets
- Private keys (`.pem`, `.key`)
- SSL certificates (`.p12`)
- Credentials or tokens

⚠️ **Best practices:**
1. Review `manifest.json` before sharing
2. Never commit bundles to git (already in `.gitignore`)
3. Use secure channels for transfer (encrypted storage, HTTPS)
4. Delete bundles after review is complete

## FAQ

**Q: Can I include the bundle in version control?**
A: No. Bundles are in `.gitignore` and should remain untracked. They can be large and change frequently.

**Q: What if I need to share specific files not in the bundle?**
A: Modify the script to include additional paths, or create a custom copy script.

**Q: How do I compare two bundles?**
A: Extract both and use the manifest files:

```bash
jq -r '.files[].path' bundle1/manifest.json | sort > files1.txt
jq -r '.files[].path' bundle2/manifest.json | sort > files2.txt
diff files1.txt files2.txt
```

**Q: Can reviewers run the code from the bundle?**
A: Partially. The bundle includes source but not dependencies (`node_modules`). Reviewers need to:
```bash
cd apps/api
pnpm install
pnpm dev
```

**Q: Is Windows script compatible with Linux output?**
A: Yes. Both scripts produce identical bundle structures and manifest formats.

## Related

- [CODEX.md](../CODEX.md) - Coding standards
- [CLAUDE.md](../CLAUDE.md) - AI collaboration guide
- [apps/api/README.md](../apps/api/README.md) - API documentation

## Support

For issues or questions:
1. Check [GitHub Issues](../../issues)
2. Review this README
3. Inspect the script source code
