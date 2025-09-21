import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckIcon, 
  SparklesIcon, 
  ShieldCheckIcon,
  CurrencyDollarIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { useApi } from '../contexts/ApiContext';
import SolanaPayCheckout from './SolanaPayCheckout';

const PricingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const { createSubscription } = useApi();

  const plans = [
    {
      id: 'founding',
      name: 'Founding Customer',
      badge: 'LIMITED TIME',
      originalPrice: '$100/month',
      price: '$100',
      period: 'lifetime',
      description: 'Get lifetime access to ComplyChain beta + 3 months free when we launch',
      features: [
        '1 Wallet Monitor',
        'Real-time Transaction Analysis',
        'AI-Powered Compliance Checks',
        'Monthly Compliance Reports',
        'NFT Certificate Minting',
        'Priority Support',
        'Beta Access',
        '3 Months Free Post-Launch',
        'Lifetime Updates'
      ],
      popular: true,
      savings: 'Save $1,100+ per year',
      cta: 'Become a Founding Customer',
      paymentMethods: ['SOL', 'USDC'],
      solAmount: 0.5, // ~$100 at current rates
      usdcAmount: 100
    },
    {
      id: 'pro',
      name: 'Professional',
      price: '$100',
      period: 'month',
      description: 'Full compliance monitoring for serious businesses',
      features: [
        '1 Wallet Monitor',
        'Real-time Transaction Analysis',
        'AI-Powered Compliance Checks',
        'Weekly Compliance Reports',
        'NFT Certificate Minting',
        'Email Support'
      ],
      popular: false,
      cta: 'Start Professional Plan',
      paymentMethods: ['SOL', 'USDC'],
      solAmount: 0.5,
      usdcAmount: 100,
      comingSoon: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'Custom compliance solutions for large organizations',
      features: [
        'Unlimited Wallet Monitors',
        'Custom Compliance Rules',
        'White-label Solution',
        'Dedicated Support',
        'Custom Integrations',
        'SLA Guarantees'
      ],
      popular: false,
      cta: 'Contact Sales',
      paymentMethods: ['Custom'],
      comingSoon: true
    }
  ];

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    if (plan.id === 'founding') {
      setShowCheckout(true);
    }
  };

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'DAO Treasurer',
      company: 'DeFi Protocol',
      quote: 'ComplyChain saved us from potential OFAC violations. The AI agents caught patterns we would have missed.',
      avatar: '👩‍💼'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Compliance Officer',
      company: 'Web3 Exchange',
      quote: 'Finally, automated compliance that actually works. The NFT certificates are genius for audit trails.',
      avatar: '👨‍💼'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center mb-4">
            <ShieldCheckIcon className="h-12 w-12 text-white mr-3" />
            <h1 className="text-5xl font-bold text-white gradient-text">💰 ComplyChain Pricing</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Automated regulatory compliance for the next generation of Web3 businesses
          </p>
          <div className="flex items-center justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full pulse-dot"></div>
              <span>$1,000 ARR Achieved</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>🏆 10 Founding Customers</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>⚡ Solana Pay Ready</span>
            </div>
          </div>
          
          {/* Founding Customer Alert */}
          <div className="mt-8 p-6 bg-black/40 border border-gray-700 rounded-xl max-w-2xl mx-auto backdrop-blur-sm">
            <div className="flex items-center justify-center mb-2">
              <SparklesIcon className="h-5 w-5 text-yellow-400 mr-2" />
              <span className="text-yellow-400 font-semibold">LIMITED TIME OFFER</span>
            </div>
            <p className="text-white">
              <strong>Become a Founding Customer:</strong> Pay $100 for lifetime access to ComplyChain beta 
              when it launches, plus get 3 months free. This is a classic startup move - you're buying 
              the vision at a steep discount for early faith.
            </p>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative glass rounded-2xl p-8 ${
                plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''
              } ${plan.comingSoon ? 'opacity-75' : ''}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    {plan.badge}
                  </span>
                </div>
              )}
              
              {plan.popular && (
                <div className="absolute -top-3 right-4">
                  <StarIcon className="h-6 w-6 text-yellow-400 fill-current" />
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-300 text-sm mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  {plan.originalPrice && (
                    <p className="text-gray-400 line-through text-lg">{plan.originalPrice}</p>
                  )}
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    {plan.period !== 'contact us' && (
                      <span className="text-gray-300 ml-2">/{plan.period}</span>
                    )}
                  </div>
                  {plan.savings && (
                    <p className="text-green-400 text-sm mt-2 font-medium">{plan.savings}</p>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={plan.comingSoon}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                      : plan.comingSoon
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {plan.comingSoon ? 'Coming Soon' : plan.cta}
                </button>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-gray-300">
                    <CheckIcon className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.paymentMethods && plan.paymentMethods.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-gray-400 text-sm mb-2">Payment Methods:</p>
                  <div className="flex items-center space-x-2">
                    {plan.paymentMethods.map((method) => (
                      <span
                        key={method}
                        className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Value Proposition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8">Why ComplyChain?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass rounded-xl p-6">
              <CurrencyDollarIcon className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Save $10M+ in Fines</h3>
              <p className="text-gray-300">Avoid massive OFAC and regulatory penalties with automated compliance monitoring.</p>
            </div>
            <div className="glass rounded-xl p-6">
              <ShieldCheckIcon className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">24/7 AI Monitoring</h3>
              <p className="text-gray-300">Our AI agents never sleep, providing continuous compliance coverage.</p>
            </div>
            <div className="glass rounded-xl p-6">
              <SparklesIcon className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Immutable Audit Trail</h3>
              <p className="text-gray-300">NFT certificates provide unforgeable proof of compliance for regulators.</p>
            </div>
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">What Our Beta Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="glass rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">{testimonial.avatar}</span>
                  <div>
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <p className="text-gray-400 text-sm">{testimonial.role} at {testimonial.company}</p>
                  </div>
                </div>
                <p className="text-gray-300 italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-xl p-8"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-semibold mb-2">What happens after I pay the $100 founding customer fee?</h3>
              <p className="text-gray-300">You'll get immediate access to our beta dashboard and can start monitoring one wallet. When we launch the full product, you'll get 3 months free and lifetime access to core features.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">How does the AI compliance monitoring work?</h3>
              <p className="text-gray-300">Our network of AI agents continuously monitors your wallet transactions, cross-references them against OFAC sanctions lists, analyzes patterns for suspicious activity, and generates compliance reports automatically.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">What if I'm not satisfied?</h3>
              <p className="text-gray-300">We offer a 30-day money-back guarantee. If ComplyChain doesn't meet your compliance needs, we'll refund your founding customer payment in full.</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && selectedPlan && (
        <SolanaPayCheckout
          plan={selectedPlan}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setShowCheckout(false);
            // Handle successful payment
          }}
        />
      )}
    </div>
  );
};

export default PricingPage;
