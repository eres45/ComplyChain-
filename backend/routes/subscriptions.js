const express = require('express');
const { Connection, PublicKey } = require('@solana/web3.js');
const router = express.Router();

// In-memory storage for demo (use database in production)
const subscriptions = new Map();
const users = new Map();

// Solana connection
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');

// Create subscription after payment
router.post('/', async (req, res) => {
  try {
    const { transactionSignature, planId, walletAddress, amount, currency } = req.body;

    // Verify transaction on Solana
    const transaction = await connection.getTransaction(transactionSignature, {
      commitment: 'confirmed'
    });

    if (!transaction) {
      return res.status(400).json({ error: 'Transaction not found or not confirmed' });
    }

    // Create subscription record
    const subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: walletAddress,
      planId,
      status: 'active',
      amount,
      currency,
      transactionSignature,
      createdAt: new Date().toISOString(),
      expiresAt: planId === 'founding' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days for non-founding
      features: getPlanFeatures(planId)
    };

    subscriptions.set(subscription.id, subscription);

    // Create or update user record
    const user = users.get(walletAddress) || {
      id: walletAddress,
      walletAddress,
      email: null,
      createdAt: new Date().toISOString(),
      subscriptions: []
    };

    user.subscriptions.push(subscription.id);
    user.currentPlan = planId;
    users.set(walletAddress, user);

    // Send welcome email (mock for demo)
    await sendWelcomeEmail(user, subscription);

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        planId: subscription.planId,
        status: subscription.status,
        features: subscription.features,
        expiresAt: subscription.expiresAt
      }
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Get user subscription
router.get('/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const user = users.get(walletAddress);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userSubscriptions = user.subscriptions.map(subId => subscriptions.get(subId)).filter(Boolean);

    res.json({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        currentPlan: user.currentPlan,
        createdAt: user.createdAt
      },
      subscriptions: userSubscriptions
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// Check subscription status
router.get('/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = subscriptions.get(subscriptionId);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Check if subscription is expired
    if (subscription.expiresAt && new Date(subscription.expiresAt) < new Date()) {
      subscription.status = 'expired';
      subscriptions.set(subscriptionId, subscription);
    }

    res.json(subscription);

  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// Cancel subscription
router.delete('/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = subscriptions.get(subscriptionId);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date().toISOString();
    subscriptions.set(subscriptionId, subscription);

    res.json({ success: true, message: 'Subscription cancelled' });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Get all subscriptions (admin)
router.get('/', async (req, res) => {
  try {
    const allSubscriptions = Array.from(subscriptions.values());
    const stats = {
      total: allSubscriptions.length,
      active: allSubscriptions.filter(s => s.status === 'active').length,
      founding: allSubscriptions.filter(s => s.planId === 'founding').length,
      revenue: allSubscriptions.reduce((sum, s) => sum + (s.amount || 0), 0)
    };

    res.json({
      subscriptions: allSubscriptions,
      stats
    });

  } catch (error) {
    console.error('Get all subscriptions error:', error);
    res.status(500).json({ error: 'Failed to get subscriptions' });
  }
});

function getPlanFeatures(planId) {
  const features = {
    founding: [
      'wallet_monitoring',
      'real_time_analysis',
      'ai_compliance_checks',
      'monthly_reports',
      'nft_certificates',
      'priority_support',
      'beta_access',
      'lifetime_access',
      'post_launch_free_months'
    ],
    pro: [
      'wallet_monitoring',
      'real_time_analysis',
      'ai_compliance_checks',
      'weekly_reports',
      'nft_certificates',
      'email_support'
    ],
    enterprise: [
      'unlimited_wallets',
      'custom_compliance_rules',
      'white_label',
      'dedicated_support',
      'custom_integrations',
      'sla_guarantees'
    ]
  };

  return features[planId] || [];
}

async function sendWelcomeEmail(user, subscription) {
  // Mock email sending for demo
  console.log(`Welcome email sent to ${user.walletAddress}:`);
  console.log(`- Plan: ${subscription.planId}`);
  console.log(`- Features: ${subscription.features.join(', ')}`);
  console.log(`- Transaction: ${subscription.transactionSignature}`);
  
  // In production, integrate with email service like SendGrid, Mailgun, etc.
  return true;
}

module.exports = router;
