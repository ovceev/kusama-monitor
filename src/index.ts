import { ApiPromise, WsProvider } from '@polkadot/api';
import { Gauge } from 'prom-client';
import express from 'express';
import { register } from 'prom-client';

// Create a gauge for Prometheus
const fundsGauge = new Gauge({
  name: 'kusama_account_funds',
  help: 'Funds of the monitored Kusama accounts',
  labelNames: ['address'],
});

// Define a list of accounts you want to monitor
const accountsToMonitor = [
  'Edyfdyoi4KJVdXUJ3SU3nuZYMpg13HHa1SWYtPDCV8UPdxy',
  'GaK38GT7LmgCpRSTRdDC2LeiMaV9TJmx8NmQcb9L3cJ3fyX',
  // add more accounts here
];

async function main() {
  // Connect to the Kusama network
  const wsProvider = new WsProvider('wss://kusama-rpc.polkadot.io/');
  const api = await ApiPromise.create({ provider: wsProvider });

  // Subscribe to new blocks
  api.rpc.chain.subscribeNewHeads(async (header) => {
    console.log(`New block #${header.number}: ${header.hash}`);

    for (const account of accountsToMonitor) {
      const accountInfo = await api.query.system.account(account);
  
      // Bypass TypeScript type checking by asserting to 'any'
      const freeBalance = (accountInfo as any).data.free.toBn().toNumber();
  
      // Update the Prometheus gauge with the free funds of the account
      fundsGauge.set({ address: account }, freeBalance);
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
