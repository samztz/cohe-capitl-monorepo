import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0F111A] flex flex-col">
      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/assets/cohe-capitl-app-logo.png"
            alt="Cohe Capital Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-white text-base font-semibold tracking-wide">
            COHE.CAPITL
          </span>
        </div>
        <Link
          href="/auth/connect"
          className="bg-[#FFD54F] text-[#0F111A] px-4 py-1.5 rounded-lg text-sm font-semibold hover:brightness-110 transition-all h-8 flex items-center"
        >
          Contact us
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 pb-12">
        {/* Shield Logo */}
        <div className="mb-12 flex items-center justify-center">
          <Image
            src="/assets/welcome-logo.png"
            alt="Shield Logo"
            width={280}
            height={280}
            className="w-[65vw] h-[65vw] max-w-[280px] max-h-[280px]"
            priority
          />
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-white text-[28px] md:text-[36px] lg:text-[42px] font-bold leading-tight tracking-wide">
            THE <span className="text-[#FFD54F]">FIRST</span> CRYPTO
          </h1>
          <h1 className="text-white text-[28px] md:text-[36px] lg:text-[42px] font-bold leading-tight tracking-wide">
            INSURANCE
          </h1>
          <h1 className="text-white text-[28px] md:text-[36px] lg:text-[42px] font-bold leading-tight tracking-wide">
            ALTERNATIVE
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-[#9CA3AF] text-xs font-medium tracking-[2px] text-center">
          COVERING CRYPTO SINCE 2025
        </p>
      </main>

      {/* Bottom Section */}
      <div className="px-5 pb-12 flex flex-col items-center">
        <Link
          href="/auth/email-verify"
          className="bg-[#FFD54F] text-[#0F111A] w-[70%] min-w-[200px] max-w-[280px] h-12 rounded-lg flex items-center justify-center text-base font-semibold tracking-wide hover:brightness-110 transition-all shadow-[0_4px_16px_rgba(255,213,79,0.3)]"
        >
          Connect Wallet
        </Link>
      </div>
    </div>
  )
}
