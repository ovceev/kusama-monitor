import { ApiPromise, WsProvider } from '@polkadot/api';
import { Gauge } from 'prom-client';
import express from 'express';
import { register } from 'prom-client';
import fs from 'fs';
import yaml from 'js-yaml';

// Create a gauge for Prometheus
const fundsGauge = new Gauge({
  name: 'kusama_account_funds',
  help: 'Funds of the monitored Kusama accounts',
  labelNames: ['address'],
});

interface WalletConfig {
  address: string;
  threshold: number;
}

interface Config {
  wallets: WalletConfig[];
}

// Read a list of accounts you want to monitor from config.yaml
let config: Config;
try {
  const configFile = fs.readFileSync('./config/config.yaml', 'utf-8');
  config = yaml.load(configFile) as Config;
} catch (err) {
  console.error("Failed to read or parse the configuration file.", err);
  process.exit(1);
}

const accountsToMonitor: { address: string, threshold: number }[] = config.wallets;


async function main() {
  // Connect to the Kusama network
  const wsProvider = new WsProvider('wss://kusama-rpc.polkadot.io/');
  const api = await ApiPromise.create({ provider: wsProvider });

  // Subscribe to new blocks
  api.rpc.chain.subscribeNewHeads(async (header) => {
    console.log(`New block #${header.number}: ${header.hash}`);

    for (const account of accountsToMonitor) {
      const accountInfo = await api.query.system.account(account.address);
  
      // Bypass TypeScript type checking by asserting to 'any'
      const freeBalance = (accountInfo as any).data.free.toBn().toNumber();
  
      // Update the Prometheus gauge with the free funds of the account
      fundsGauge.set({ address: account.address }, freeBalance);
    }
  });

  // Create a basic Express server to expose the metrics
  const app = express();
  const port = 3000;

  app.get('/metrics', async (_, res) => {
    try {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics(); // Wait for Promise to resolve
      res.end(metrics);
    } catch (error) {
      res.status(500).end(error); // Handle errors
    }
  });

  // Start the server on port 3000
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}/metrics`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
