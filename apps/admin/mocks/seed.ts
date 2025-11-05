import { Policy, PolicyStatusType } from '@/features/policies/schemas'
import dayjs from 'dayjs'

const SKUS = [
  { id: 'sku_001', name: 'Basic Coverage Plan' },
  { id: 'sku_002', name: 'Premium Protection' },
  { id: 'sku_003', name: 'Elite Coverage Plus' },
  { id: 'sku_004', name: 'Travel Insurance' },
  { id: 'sku_005', name: 'Health Shield Pro' },
]

const ADDRESSES = [
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  '0x5A0b54D5dc17e0AadC383d2db43B0a0D3E029c4c',
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
  '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
  '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
  '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
]

const STATUSES: PolicyStatusType[] = ['pending', 'under_review', 'approved', 'rejected', 'expired']

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generatePolicy(index: number): Policy {
  const status = randomChoice(STATUSES)
  const sku = randomChoice(SKUS)
  const createdAt = dayjs().subtract(randomInt(1, 60), 'day').toISOString()
  const premiumAmt = randomInt(100, 5000)
  const coverageAmt = premiumAmt * randomInt(10, 50)
  const termDays = randomChoice([30, 60, 90, 180, 365])

  let startAt: string | null = null
  let endAt: string | null = null

  if (status === 'approved') {
    startAt = dayjs(createdAt).add(randomInt(1, 3), 'day').toISOString()
    endAt = dayjs(startAt).add(termDays, 'day').toISOString()
  } else if (status === 'expired') {
    startAt = dayjs(createdAt).add(1, 'day').toISOString()
    endAt = dayjs(startAt).add(termDays, 'day').subtract(randomInt(1, 10), 'day').toISOString()
  }

  const hasPayment = status !== 'pending'

  return {
    id: `POL-${String(index).padStart(6, '0')}`,
    skuId: sku.id,
    skuName: sku.name,
    walletAddress: randomChoice(ADDRESSES),
    premiumAmt,
    coverageAmt,
    termDays,
    startAt,
    endAt,
    createdAt,
    status,
    email: `user${index}@example.com`,
    phone: `+1${randomInt(2000000000, 9999999999)}`,
    attachments: [],
    contractUrl: status === 'approved' ? `https://contracts.example.com/${index}.pdf` : undefined,
    payments: hasPayment
      ? [
          {
            id: `PAY-${index}`,
            txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
            chainId: 1,
            amount: premiumAmt,
            token: 'USDC',
            paidAt: dayjs(createdAt).add(1, 'hour').toISOString(),
          },
        ]
      : [],
    reviewerNote:
      status === 'rejected' ? 'Insufficient documentation provided.' : undefined,
  }
}

export function generatePolicies(count: number): Policy[] {
  return Array.from({ length: count }, (_, i) => generatePolicy(i + 1))
}

// Generate initial dataset
export const MOCK_POLICIES = generatePolicies(60)
