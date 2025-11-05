# Cohe Capital Admin Dashboard

A modern, full-featured admin dashboard for managing insurance policies on the Cohe Capital platform.

## Features

- **Authentication**: Simple email/password login (demo mode)
- **Dashboard**: Real-time statistics and overview
- **Policy Management**: View, search, filter, and paginate all policies
- **Review Queue**: Dedicated interface for reviewing pending policies
- **Policy Details**: Comprehensive view with tabs for overview, payments, and timeline
- **Approve/Reject Flow**: Intuitive dialog-based review workflow
- **Mock API**: Built-in Next.js API routes for development

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: @tanstack/react-query
- **Forms & Validation**: Zod
- **Icons**: Lucide React
- **Date Handling**: Day.js

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm

### Installation

```bash
cd apps/admin
pnpm install
```

### Development

```bash
# Start dev server on port 3002
pnpm dev
```

Visit http://localhost:3002

**Default Login Credentials:**
- Email: `admin@cohe.capital`
- Password: `admin123`

### Build for Production

```bash
pnpm build
pnpm start
```

## Environment Configuration

Create a `.env.local` file (see `.env.example`):

```env
# API Base URL (leave empty for local Mock API routes)
NEXT_PUBLIC_ADMIN_API_BASE=

# Use Mock Mode (true = local API routes, false = real backend)
NEXT_PUBLIC_USE_MOCK=true
```

### Switching Between Mock and Real Backend

**Mock Mode (Default):**
- Uses Next.js API Routes in `app/api/admin/*`
- Data stored in memory (resets on restart)
- No external dependencies

**Real Backend Mode:**
1. Set `NEXT_PUBLIC_ADMIN_API_BASE` to your backend URL (e.g., `https://api.cohe.capital`)
2. Set `NEXT_PUBLIC_USE_MOCK=false`
3. Ensure backend implements these endpoints:
   - `GET /admin/policies?status=&q=&page=&limit=`
   - `GET /admin/policies/:id`
   - `PATCH /admin/policies/:id`
   - `GET /admin/stats`

## Project Structure

```
apps/admin/
├── app/
│   ├── (auth)/
│   │   └── login/              # Login page
│   ├── (dashboard)/
│   │   ├── dashboard/          # Dashboard home
│   │   ├── policies/           # All policies list
│   │   │   └── [id]/           # Policy detail page
│   │   └── review/             # Review queue
│   ├── api/admin/              # Mock API routes
│   │   ├── policies/
│   │   └── stats/
│   ├── globals.css
│   └── layout.tsx
├── components/ui/              # shadcn/ui components
├── features/policies/
│   ├── components/             # Policy-specific components
│   ├── hooks/                  # React Query hooks
│   └── schemas.ts              # Zod schemas
├── lib/
│   ├── apiClient.ts            # API client wrapper
│   ├── auth.ts                 # Auth utilities
│   ├── constants.ts
│   ├── queryClient.ts
│   └── utils.ts
├── mocks/
│   └── seed.ts                 # Mock data generator
└── package.json
```

## Key Pages

| Route | Description |
|-------|-------------|
| `/login` | Authentication page |
| `/dashboard` | Statistics overview |
| `/policies` | All policies with search/filter |
| `/review` | Pending policies awaiting review |
| `/policies/[id]` | Policy detail with tabs |

## API Contract

### Mock API Endpoints

All endpoints are prefixed with `/api/admin`:

**GET /policies**
- Query params: `status`, `q` (search), `page`, `limit`
- Returns: `{ items: Policy[], total: number, page: number, limit: number }`

**GET /policies/:id**
- Returns: `Policy` object

**PATCH /policies/:id**
- Body: `{ status: 'approved' | 'rejected', reviewerNote?: string }`
- Returns: Updated `Policy`

**GET /stats**
- Returns: `{ total, underReview, approvedToday, rejectedToday }`

## Type Definitions

See `features/policies/schemas.ts` for full Zod schemas:

```typescript
type PolicyStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired'

interface Policy {
  id: string
  skuId: string
  skuName: string
  walletAddress: string
  premiumAmt: number
  coverageAmt: number
  termDays: number
  status: PolicyStatus
  email?: string
  phone?: string
  createdAt: string
  startAt?: string | null
  endAt?: string | null
  payments: Payment[]
  reviewerNote?: string
  // ...
}
```

## Development Notes

- **Authentication**: Currently uses localStorage (demo only). Implement proper JWT for production.
- **Data Persistence**: Mock data resets on server restart. Use a real database for production.
- **File Uploads**: Attachments/contracts are mocked. Implement actual file storage.
- **Error Handling**: Basic toast notifications. Enhance with retry logic and detailed error messages.

## TODO / Future Enhancements

- [ ] Dark mode toggle
- [ ] Export policies to CSV
- [ ] Advanced filtering (date range, amount range)
- [ ] Bulk operations (approve multiple policies)
- [ ] Email notifications
- [ ] Audit log tracking
- [ ] Real-time updates (WebSocket)
- [ ] Chart/graph for dashboard trends

## Troubleshooting

**Port already in use:**
```bash
# Change port in package.json or kill process on 3002
lsof -ti:3002 | xargs kill -9
```

**Type errors:**
```bash
pnpm type-check
```

**Build fails:**
- Ensure all dependencies are installed: `pnpm install`
- Check Node.js version: `node -v` (should be 18+)

## License

Private - Cohe Capital Internal Use

---

**Need help?** Contact the development team or open an issue in the monorepo.
