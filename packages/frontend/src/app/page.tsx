import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-16">
      <div className="text-center">
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
          Reward Your Favorite
          <span className="text-primary"> Cricket Players</span>
        </h1>
        <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
          Show your appreciation by sending real money rewards to cricket players.
          Secure payments via Stripe and Razorpay with real-time notifications.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Link
            href="/players"
            className="bg-primary text-white px-8 py-3 rounded-lg text-lg hover:bg-primary-dark"
          >
            Browse Players
          </Link>
          <Link
            href="/register"
            className="border border-primary text-primary px-8 py-3 rounded-lg text-lg hover:bg-blue-50"
          >
            Get Started
          </Link>
        </div>
      </div>

      <div className="mt-12 sm:mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-3">Secure Payments</h3>
          <p className="text-gray-600">
            Stripe for US users, Razorpay for India. 3D Secure, UPI, cards, and more.
          </p>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-3">Real-Time Updates</h3>
          <p className="text-gray-600">
            Instant notifications when your reward is delivered. Live wallet updates.
          </p>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-3">Transparent Fees</h3>
          <p className="text-gray-600">
            Only 5% platform fee. Full financial ledger. Track every transaction.
          </p>
        </div>
      </div>
    </div>
  );
}
