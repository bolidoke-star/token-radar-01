export function scoreLiquidity(token) {
  const depth = Number(token?.liquidityUSD ?? token?.liquidity ?? 0);
  if (depth >= 1_000_000) return 100;
  if (depth <= 0) return 0;
  return Math.min(100, Math.round((depth / 1_000_000) * 100));
}

export function scoreVolumeSurge(token) {
  const vol24h = Number(token?.volume24hUSD ?? token?.volume24h ?? 0);
  const volBase = Number(token?.volumeBaselineUSD ?? (token?.liquidityUSD ? token.liquidityUSD * 0.2 : 10_000));
  if (volBase <= 0) return 50;
  const ratio = vol24h / volBase;
  if (ratio >= 5) return 100;
  if (ratio <= 0.5) return 20;
  return Math.min(100, Math.round(20 + ((ratio - 0.5) / 4.5) * 80));
}

export function scoreHolders(token) {
  const top10 = Number(token?.top10HoldingPercent ?? token?.concentration ?? 50);
  if (top10 <= 15) return 100;
  if (top10 >= 80) return 10;
  return Math.max(10, Math.round(100 - ((top10 - 15) / 65) * 90));
}

export function scoreSmartMoney(token) {
  const buys = Number(token?.smartMoneyBuys24h ?? token?.smartBuys ?? 0);
  const sells = Number(token?.smartMoneySells24h ?? token?.smartSells ?? 0);
  const total = buys + sells;
  if (total === 0) return 50;
  const netRatio = (buys - sells) / total;
  return Math.min(100, Math.max(0, Math.round(50 + netRatio * 50)));
}

export function evaluateToken(token) {
  const liq = scoreLiquidity(token);
  const vol = scoreVolumeSurge(token);
  const hol = scoreHolders(token);
  const smm = scoreSmartMoney(token);
  const totalScore = Math.round(liq * 0.3 + vol * 0.3 + hol * 0.2 + smm * 0.2);
  let signal = "NEUTRAL";
  if (totalScore >= 75) signal = "BULLISH";
  else if (totalScore <= 35) signal = "BEARISH";
  return {
    token: token?.symbol || token?.address || "UNKNOWN",
    totalScore,
    signal,
    factors: { liquidity: liq, volumeSurge: vol, holderConcentration: hol, smartMoney: smm },
    timestamp: Date.now()
  };
}

export function scanMarket(tokens = []) {
  return tokens.map(evaluateToken).sort((a, b) => b.totalScore - a.totalScore);
}
