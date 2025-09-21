import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';

const SolanaPayCheckout = ({ plan, onClose, onSuccess }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('USDC');
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, processing, success, error
  const [transactionSignature, setTransactionSignature] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);

  // Solana connection
  const connection = new Connection(process.env.REACT_APP_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
  
  // Our treasury wallet (replace with actual wallet)
  const TREASURY_WALLET = new PublicKey('ComplyChainTreasuryWalletAddressHere123456789');
  
  // Token mint addresses
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC mainnet
  const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112'); // Wrapped SOL

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (window.solana && window.solana.isPhantom) {
      try {
        const response = await window.solana.connect({ onlyIfTrusted: true });
        setWalletConnected(true);
      } catch (error) {
        setWalletConnected(false);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.solana) {
      setErrorMessage('Phantom wallet not found. Please install Phantom wallet.');
      return;
    }

    try {
      const response = await window.solana.connect();
      setWalletConnected(true);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Failed to connect wallet: ' + error.message);
    }
  };

  const processPayment = async () => {
    if (!walletConnected) {
      await connectWallet();
      return;
    }

    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      const publicKey = window.solana.publicKey;
      const amount = selectedCurrency === 'USDC' ? plan.usdcAmount : plan.solAmount;
      
      let transaction;
      
      if (selectedCurrency === 'USDC') {
        // USDC transfer
        const fromTokenAccount = await getAssociatedTokenAddress(USDC_MINT, publicKey);
        const toTokenAccount = await getAssociatedTokenAddress(USDC_MINT, TREASURY_WALLET);
        
        transaction = new Transaction().add(
          createTransferInstruction(
            fromTokenAccount,
            toTokenAccount,
            publicKey,
            amount * 1000000, // USDC has 6 decimals
            [],
            TOKEN_PROGRAM_ID
          )
        );
      } else {
        // SOL transfer
        const { SystemProgram } = await import('@solana/web3.js');
        transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: TREASURY_WALLET,
            lamports: amount * 1000000000, // SOL has 9 decimals
          })
        );
      }

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign and send transaction
      const signedTransaction = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // Confirm transaction
      await connection.confirmTransaction(signature, 'confirmed');
      
      setTransactionSignature(signature);
      setPaymentStatus('success');
      
      // Call backend to create subscription
      await createSubscription(signature, plan.id);
      
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage('Payment failed: ' + error.message);
      setPaymentStatus('error');
    }
  };

  const createSubscription = async (signature, planId) => {
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionSignature: signature,
          planId: planId,
          walletAddress: window.solana.publicKey.toString(),
          amount: selectedCurrency === 'USDC' ? plan.usdcAmount : plan.solAmount,
          currency: selectedCurrency
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }
    } catch (error) {
      console.error('Subscription creation error:', error);
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'processing':
        return <ArrowPathIcon className="h-8 w-8 text-blue-400 animate-spin" />;
      case 'success':
        return <CheckCircleIcon className="h-8 w-8 text-green-400" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />;
      default:
        return <CurrencyDollarIcon className="h-8 w-8 text-purple-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'processing':
        return 'Processing payment...';
      case 'success':
        return 'Payment successful! Welcome to ComplyChain!';
      case 'error':
        return 'Payment failed. Please try again.';
      default:
        return 'Complete your purchase';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="glass rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Checkout</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Plan Summary */}
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">{plan.name}</h3>
            <p className="text-gray-300 text-sm mb-3">{plan.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{plan.price}</span>
              <span className="text-green-400 text-sm">{plan.savings}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h4 className="text-white font-medium mb-3">Payment Method</h4>
            <div className="grid grid-cols-2 gap-3">
              {plan.paymentMethods.map((method) => (
                <button
                  key={method}
                  onClick={() => setSelectedCurrency(method)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedCurrency === method
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium">{method}</div>
                    <div className="text-sm opacity-75">
                      {method === 'USDC' ? `$${plan.usdcAmount}` : `${plan.solAmount} SOL`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Status Display */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              {getStatusIcon()}
            </div>
            <p className="text-white font-medium">{getStatusMessage()}</p>
            {errorMessage && (
              <p className="text-red-400 text-sm mt-2">{errorMessage}</p>
            )}
          </div>

          {/* Transaction Details */}
          {transactionSignature && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-6">
              <p className="text-green-400 text-sm font-medium mb-1">Transaction Signature:</p>
              <p className="text-green-300 text-xs break-all">{transactionSignature}</p>
              <a
                href={`https://solscan.io/tx/${transactionSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 text-xs hover:underline mt-1 inline-block"
              >
                View on Solscan →
              </a>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={processPayment}
            disabled={paymentStatus === 'processing' || paymentStatus === 'success'}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
              paymentStatus === 'processing' || paymentStatus === 'success'
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
            }`}
          >
            {!walletConnected 
              ? 'Connect Phantom Wallet'
              : paymentStatus === 'processing'
              ? 'Processing...'
              : paymentStatus === 'success'
              ? 'Payment Complete!'
              : `Pay ${selectedCurrency === 'USDC' ? `$${plan.usdcAmount}` : `${plan.solAmount} SOL`}`
            }
          </button>

          {/* Security Notice */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-300 text-xs">
              🔒 Secure payment powered by Solana blockchain. Your wallet remains in your control at all times.
            </p>
          </div>

          {/* What's Next */}
          {paymentStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg"
            >
              <h4 className="text-purple-300 font-medium mb-2">What's Next?</h4>
              <ul className="text-purple-200 text-sm space-y-1">
                <li>• Access to ComplyChain beta dashboard</li>
                <li>• Set up your first wallet monitor</li>
                <li>• Join our founding customer Discord</li>
                <li>• Get 3 months free when we launch</li>
              </ul>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SolanaPayCheckout;
