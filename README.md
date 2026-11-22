# Regalium Arena

A browser-based 3D combat prototype, kept separate from the Regalium token website. Its first purpose is to exercise the Regalium GameStore reward-assignment and withdrawal flow on Polygon Amoy.

## Current prototype

- Three.js-powered arena with a five-drone survival mission
- Keyboard movement (WASD / arrow keys) and click-to-fire combat
- MetaMask connection and Polygon Amoy network switching
- Reads the connected player's `rewards(address)` balance and the GameStore owner
- Player withdrawal through `withdraw()`
- Owner-only test reward assignment through `rewardUser()` after a mission is completed
- GitHub Actions build check on pushes and pull requests

## Setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `VITE_GAMESTORE_ADDRESS` to the deployed GameStore **proxy** address on Polygon Amoy.
5. Keep `VITE_RGLM_DECIMALS=18` unless the token uses different decimals.
6. Run `npm run dev`.

## GameStore test flow

1. Fund the GameStore contract with RGLM so its balance can cover new assignments and existing outstanding liabilities.
2. Set the daily player/global reward caps on the contract.
3. Connect the player wallet and complete the arena mission.
4. Connect the contract owner wallet. The owner panel appears only when the connected wallet matches `owner()`.
5. Assign a small test reward. The transaction calls `rewardUser(player, amount)` directly from the owner wallet; the contract remains responsible for owner checks, cap enforcement and reserve checks.
6. Connect as the player and withdraw with `withdraw()`.

The owner private key is never placed in the browser. This prototype uses the connected owner wallet for testnet assignments; it does not provide automated production reward issuance.

## Important notes

- This is a testnet prototype, not a production anti-cheat or competitive game.
- A client-side score is not cryptographic proof of gameplay. Do not use this prototype to issue valuable mainnet rewards.
- Do not commit `.env.local` or private keys.
- The contract address must be the deployed proxy address, not the implementation address.
