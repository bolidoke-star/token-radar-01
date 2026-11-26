import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const NODE = process.execPath;
const CLI = 'src/cli.mjs';

function runCli(...args) {
  return spawnSync(NODE, [CLI, ...args], { encoding: 'utf8' });
}

test('cli: default scan prints a ranked JSON array to stdout', () => {
  const res = runCli();
  assert.strictEqual(res.status, 0);
  const data = JSON.parse(res.stdout);
  assert.ok(Array.isArray(data));
  assert.strictEqual(data.length, 3);
  assert.deepStrictEqual(data.map((d) => d.token), ['BNKR', 'PEPE', 'RUG']);
  assert.strictEqual(data[0].totalScore, 97);
  assert.strictEqual(data[0].signal, 'BULLISH');
  assert.strictEqual(data[2].signal, 'BEARISH');
  const scores = data.map((d) => d.totalScore);
  assert.deepStrictEqual(scores, [...scores].sort((a, b) => b - a));
});

test('cli: scan --file ranks fixture tokens descending', () => {
  const res = runCli('scan', '--file', 'test/fixtures/tokens.json');
  assert.strictEqual(res.status, 0);
  const data = JSON.parse(res.stdout);
  assert.strictEqual(data.length, 6);
  assert.deepStrictEqual(data.map((d) => d.token), ['BLAZE', 'PEPE', 'DARK', 'MOON', 'MISSING', 'STUCK']);
  assert.ok(data.every((d) => ['BULLISH', 'NEUTRAL', 'BEARISH'].includes(d.signal)));
  assert.ok(data.every((d) => Number.isFinite(d.timestamp)));
});

test('cli: eval --file prints a single token evaluation', () => {
  const res = runCli('eval', '--file', 'test/fixtures/tokens.json');
  assert.strictEqual(res.status, 0);
  const data = JSON.parse(res.stdout);
  assert.strictEqual(data.token, 'PEPE');
  assert.strictEqual(data.signal, 'BULLISH');
  assert.strictEqual(data.totalScore, 87);
  assert.deepStrictEqual(Object.keys(data), ['token', 'totalScore', 'signal', 'factors', 'timestamp']);
});

test('cli: eval without args evaluates the first default token', () => {
  const res = runCli('eval');
  assert.strictEqual(res.status, 0);
  const data = JSON.parse(res.stdout);
  assert.strictEqual(data.token, 'BNKR');
  assert.strictEqual(data.signal, 'BULLISH');
});
