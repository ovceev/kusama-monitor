# kusama-monitor
## How to run

```
git clone https://github.com/ovceev/kusama-monitor.git
cd kusama-monitor

yarn
yarn build
yarn start
```

## Deploy to k8s using helmfile
```
git clone https://github.com/ovceev/kusama-monitor.git
cd kusama-monitor/helmfile

helmfile diff
helmfile apply
```