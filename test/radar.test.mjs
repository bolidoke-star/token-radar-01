import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreLiquidity,
  scoreVolumeSurge,
  scoreHolders,
  scoreSmartMoney,
  evaluateToken,
  scanMarket,
} from '../src/radar.mjs';

test('scoreLiquidity: zero, negative or missing depth scores 0', () => {
  assert.strictEqual(scoreLiquidity({ liquidityUSD: 0 }), 0);
  assert.strictEqual(scoreLiquidity({ liquidityUSD: -5000 }), 0);
  assert.strictEqual(scoreLiquidity({}), 0);
  assert.strictEqual(scoreLiquidity({ liquidity: 0 }), 0);
});

test('scoreLiquidity: $1M or more scores 100', () => {
  assert.strictEqual(scoreLiquidity({ liquidityUSD: 1_000_000 }), 100);
  assert.strictEqual(scoreLiquidity({ liquidityUSD: 50_000_000 }), 100);
});

test('scoreLiquidity: linear between zero and $1M', () => {
  assert.strictEqual(scoreLiquidity({ liquidityUSD: 500_000 }), 50);
  assert.strictEqual(scoreLiquidity({ liquidityUSD: 250_000 }), 25);
  assert.ok(scoreLiquidity({ liquidityUSD: 600_000 }) > scoreLiquidity({ liquidityUSD: 300_000 }));
});

test('scoreVolumeSurge: 5x baseline or more scores 100', () => {
  assert.strictEqual(scoreVolumeSurge({ liquidityUSD: 1_000_000, volume24hUSD: 5_000_000 }), 100);
});

test('scoreVolumeSurge: half baseline or less scores 20', () => {
  assert.strictEqual(scoreVolumeSurge({ liquidityUSD: 1_000_000, volume24hUSD: 100_000 }), 20);
  assert.strictEqual(scoreVolumeSurge({ liquidityUSD: 1_000_000, volume24hUSD: 0 }), 20);
});

test('scoreVolumeSurge: default baseline is 20% of liquidity', () => {
  // ratio = 400_000 / (1_000_000 * 0.2) = 2 -> 20 + (1.5 / 4.5) * 80 = 46.67 -> 47
  assert.strictEqual(scoreVolumeSurge({ liquidityUSD: 1_000_000, volume24hUSD: 400_000 }), 47);
});

test('scoreVolumeSurge: an explicit volume baseline is honoured', () => {
  assert.strictEqual(scoreVolumeSurge({ volume24hUSD: 50_000, volumeBaselineUSD: 10_000 }), 100);
});

test('scoreHolders: concentration of 15% or less scores 100', () => {
  assert.strictEqual(scoreHolders({ top10HoldingPercent: 15 }), 100);
  assert.strictEqual(scoreHolders({ top10HoldingPercent: 5 }), 100);
});

test('scoreHolders: concentration of 80% or more scores 10', () => {
  assert.strictEqual(scoreHolders({ top10HoldingPercent: 80 }), 10);
  assert.strictEqual(scoreHolders({ top10HoldingPercent: 95 }), 10);
});

test('scoreHolders: falls between the bounds', () => {
  // 100 - ((50 - 15) / 65) * 90 = 51.54 -> 52
  assert.strictEqual(scoreHolders({ top10HoldingPercent: 50 }), 52);
  // 100 - ((40 - 15) / 65) * 90 = 65.38 -> 65
  assert.strictEqual(scoreHolders({ concentration: 40 }), 65);
});

test('scoreSmartMoney: no trades is neutral 50', () => {
  assert.strictEqual(scoreSmartMoney({}), 50);
  assert.strictEqual(scoreSmartMoney({ smartMoneyBuys24h: 0, smartMoneySells24h: 0 }), 50);
  assert.strictEqual(scoreSmartMoney({ smartBuys: 0, smartSells: 0 }), 50);
});

test('scoreSmartMoney: all buys scores 100, all sells scores 0', () => {
  assert.strictEqual(scoreSmartMoney({ smartMoneyBuys24h: 30, smartMoneySells24h: 0 }), 100);
  assert.strictEqual(scoreSmartMoney({ smartMoneyBuys24h: 0, smartMoneySells24h: 30 }), 0);
});

test('scoreSmartMoney: net ratio maps between zero and 100', () => {
  // buys 60, sells 40 -> netRatio 0.2 -> 50 + 10 = 60
  assert.strictEqual(scoreSmartMoney({ smartMoneyBuys24h: 60, smartMoneySells24h: 40 }), 60);
});

test('evaluateToken: blends factors and assigns BULLISH', () => {
  const result = evaluateToken({
    symbol: 'BNKR',
    liquidityUSD: 2_500_000,
    volume24hUSD: 8_500_000,
    top10HoldingPercent: 18,
    smartMoneyBuys24h: 45,
    smartMoneySells24h: 5,
  });
  assert.strictEqual(result.token, 'BNKR');
  assert.strictEqual(result.signal, 'BULLISH');
  assert.strictEqual(result.totalScore, 97);
  assert.deepStrictEqual(Object.keys(result.factors), ['liquidity', 'volumeSurge', 'holderConcentration', 'smartMoney']);
  assert.ok(Number.isFinite(result.timestamp));
});

test('evaluateToken: assigns BEARISH at or below 35 and NEUTRAL between', () => {
  const bearish = evaluateToken({
    symbol: 'RUG',
    liquidityUSD: 0,
    volume24hUSD: 0,
    top10HoldingPercent: 90,
    smartMoneyBuys24h: 0,
    smartMoneySells24h: 30,
  });
  assert.strictEqual(bearish.signal, 'BEARISH');
  assert.ok(bearish.totalScore <= 35);

  const neutral = evaluateToken({
    symbol: 'MEH',
    liquidityUSD: 500_000,
    volume24hUSD: 0,
    top10HoldingPercent: 50,
    smartMoneyBuys24h: 0,
    smartMoneySells24h: 0,
  });
  assert.strictEqual(neutral.signal, 'NEUTRAL');
  assert.ok(neutral.totalScore > 35 && neutral.totalScore < 75);
});

test('scanMarket: returns tokens sorted by score descending', () => {
  const tokens = [
    { symbol: 'A', liquidityUSD: 10_000 },
    { symbol: 'B', liquidityUSD: 2_000_000 },
    { symbol: 'C', liquidityUSD: 500_000 },
  ];
  const ranked = scanMarket(tokens);
  assert.deepStrictEqual(ranked.map((t) => t.token), ['B', 'C', 'A']);
  const scores = ranked.map((t) => t.totalScore);
  assert.deepStrictEqual(scores, [...scores].sort((a, b) => b - a));
});

test('scanMarket: empty input returns an empty array', () => {
  assert.deepStrictEqual(scanMarket(), []);
  assert.deepStrictEqual(scanMarket([]), []);
});

