#!/usr/bin/env node

/**
 * Transaction Diagnosis Script
 *
 * Directly queries BSC Testnet to inspect transaction logs
 * Helps diagnose why Transfer events might not be found
 */

import { ethers } from 'ethers';

const TX_HASH = process.argv[2];

if (!TX_HASH) {
  console.error('Usage: node diagnose-tx.mjs <txHash>');
  console.error('Example: node diagnose-tx.mjs 0xf38aa9a95f709f1e5944d8ee2d862ae7d527a6d7d585e4b3079ef8f416dcb982');
  process.exit(1);
}

// BSC Testnet RPC endpoints
const RPC_ENDPOINTS = [
  'https://bsc-testnet.publicnode.com',
  'https://data-seed-prebsc-1-s1.binance.org:8545',
  'https://data-seed-prebsc-2-s1.binance.org:8545',
];

// ERC20 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

async function diagnoseTx() {
  console.log('========================================');
  console.log('Transaction Diagnosis');
  console.log('========================================\n');
  console.log(`TX Hash: ${TX_HASH}`);
  console.log(`Chain: BSC Testnet (97)\n`);

  let provider;
  let rpcUsed;

  // Try each RPC endpoint
  for (const rpc of RPC_ENDPOINTS) {
    try {
      console.log(`Trying RPC: ${rpc}...`);
      provider = new ethers.JsonRpcProvider(rpc);
      await provider.getBlockNumber(); // Test connection
      rpcUsed = rpc;
      console.log(`✅ Connected to ${rpc}\n`);
      break;
    } catch (error) {
      console.log(`❌ Failed to connect to ${rpc}: ${error.message}`);
    }
  }

  if (!provider) {
    console.error('\n❌ Could not connect to any RPC endpoint');
    process.exit(1);
  }

  // Fetch transaction
  console.log('Fetching transaction...');
  const tx = await provider.getTransaction(TX_HASH);

  if (!tx) {
    console.error(`❌ Transaction not found: ${TX_HASH}`);
    process.exit(1);
  }

  console.log('✅ Transaction found');
  console.log(`  From: ${tx.from}`);
  console.log(`  To: ${tx.to}`);
  console.log(`  Value: ${ethers.formatEther(tx.value)} BNB`);
  console.log(`  Block: ${tx.blockNumber}\n`);

  // Fetch receipt
  console.log('Fetching transaction receipt...');
  const receipt = await provider.getTransactionReceipt(TX_HASH);

  if (!receipt) {
    console.error(`❌ Receipt not found for ${TX_HASH}`);
    process.exit(1);
  }

  console.log('✅ Receipt found');
  console.log(`  Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
  console.log(`  Gas Used: ${receipt.gasUsed.toString()}`);
  console.log(`  Logs Count: ${receipt.logs.length}\n`);

  if (receipt.logs.length === 0) {
    console.log('⚠️  No logs found in transaction');
    console.log('This could mean:');
    console.log('  - Native token transfer (BNB, not ERC20)');
    console.log('  - Failed transaction');
    console.log('  - Contract call with no events');
    process.exit(0);
  }

  // Analyze each log
  console.log('========================================');
  console.log('Log Analysis');
  console.log('========================================\n');

  const transferEvents = [];

  receipt.logs.forEach((log, index) => {
    console.log(`Log #${index + 1}:`);
    console.log(`  Address: ${log.address}`);
    console.log(`  Topics: ${log.topics.length}`);
    log.topics.forEach((topic, i) => {
      console.log(`    [${i}] ${topic}`);
    });
    console.log(`  Data: ${log.data.substring(0, 66)}${log.data.length > 66 ? '...' : ''}`);

    // Check if it's a Transfer event
    if (log.topics[0] === TRANSFER_EVENT_SIGNATURE) {
      console.log(`  ✅ This is a Transfer event!`);

      const from = '0x' + log.topics[1].substring(26);
      const to = '0x' + log.topics[2].substring(26);
      const amount = BigInt(log.data).toString();

      console.log(`    From: ${from}`);
      console.log(`    To: ${to}`);
      console.log(`    Amount (wei): ${amount}`);
      console.log(`    Token: ${log.address}`);

      transferEvents.push({
        tokenAddress: log.address,
        from,
        to,
        amount,
      });
    } else {
      console.log(`  ℹ️  Not a Transfer event (signature: ${log.topics[0]?.substring(0, 10)}...)`);
    }
    console.log('');
  });

  // Summary
  console.log('========================================');
  console.log('Summary');
  console.log('========================================\n');
  console.log(`Total Logs: ${receipt.logs.length}`);
  console.log(`Transfer Events: ${transferEvents.length}\n`);

  if (transferEvents.length > 0) {
    console.log('Transfer Events Found:');
    transferEvents.forEach((event, i) => {
      console.log(`  ${i + 1}. ${event.tokenAddress}`);
      console.log(`     From: ${event.from}`);
      console.log(`     To: ${event.to}`);
      console.log(`     Amount: ${event.amount}`);
      console.log('');
    });
  } else {
    console.log('⚠️  No Transfer events found');
    console.log('\nPossible reasons:');
    console.log('  1. This is a native token (BNB) transfer');
    console.log('  2. Contract interaction without ERC20 transfers');
    console.log('  3. RPC endpoint returning incomplete data');
  }
}

diagnoseTx().catch((error) => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
