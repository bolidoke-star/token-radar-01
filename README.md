# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/bolidoke-star/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/bolidoke-star/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Multi-Factor Token Launch Radar and Valuation Board engineered by bolidoke-star.

## Architecture

- **Engine**: TypeScript / Node.js 22 (zero third-party dependencies)
- **Scoring Pipeline**: Evaluates TVL, 7-day momentum, historical protocol age, and category risk factors.
- **Frontend**: Clean, dependency-free dashboard with real-time responsive filtering and detailed protocol farm guides.
- **Output Artifacts**: Standardized `board.json`, `data.js`, and `dossier.json`.

## Usage

```sh
node main.ts --input /input/snapshot.json --output /output
```

---

<sub>Built for the [make.fun](https://make.fun/bounty/token-radar-01) Token Launch Radar Bounty.</sub>
