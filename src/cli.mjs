#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { evaluateToken, scanMarket } from "./radar.mjs";

const args = process.argv.slice(2);
const command = args[0] || "scan";

function parseInput() {
  const fileIdx = args.indexOf("--file");
  if (fileIdx !== -1 && args[fileIdx + 1]) {
    return JSON.parse(readFileSync(args[fileIdx + 1], "utf8"));
  }
  return [
    { symbol: "BNKR", liquidityUSD: 2500000, volume24hUSD: 8500000, top10HoldingPercent: 18, smartMoneyBuys24h: 45, smartMoneySells24h: 5 },
    { symbol: "PEPE", liquidityUSD: 800000, volume24hUSD: 1200000, top10HoldingPercent: 35, smartMoneyBuys24h: 20, smartMoneySells24h: 15 },
    { symbol: "RUG", liquidityUSD: 12000, volume24hUSD: 4000, top10HoldingPercent: 92, smartMoneyBuys24h: 0, smartMoneySells24h: 30 }
  ];
}

const data = parseInput();
if (command === "eval") {
  const item = Array.isArray(data) ? data[0] : data;
  console.log(JSON.stringify(evaluateToken(item), null, 2));
} else {
  const items = Array.isArray(data) ? data : [data];
  console.log(JSON.stringify(scanMarket(items), null, 2));
}
