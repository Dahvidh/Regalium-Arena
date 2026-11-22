import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers'

export const CHAIN_ID = 80002
export const GAMESTORE_ADDRESS = import.meta.env.VITE_GAMESTORE_ADDRESS || ''
export const ABI = [
  'function owner() view returns (address)',
  'function rewards(address) view returns (uint256)',
  'function totalOutstandingRewards() view returns (uint256)',
  'function dailyPlayerRewardCap() view returns (uint256)',
  'function dailyGlobalRewardCap() view returns (uint256)',
  'function rewardUser(address user,uint256 amount)',
  'function withdraw()'
]

export async function connectWallet() {
  const eth = (window as any).ethereum
  if (!eth) throw new Error('Install MetaMask to connect a wallet.')
  const provider = new BrowserProvider(eth)
  const accounts = await provider.send('eth_requestAccounts', [])
  if (!accounts[0]) throw new Error('No wallet account returned.')
  const network = await provider.getNetwork()
  if (Number(network.chainId) !== CHAIN_ID) {
    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x13882' }] })
    } catch (e: any) {
      if (e.code !== 4902) throw e
      await eth.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0x13882', chainName: 'Polygon Amoy', nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 }, rpcUrls: ['https://rpc-amoy.polygon.technology/'], blockExplorerUrls: ['https://amoy.polygonscan.com/'] }] })
    }
  }
  return { provider, signer: await provider.getSigner(), address: accounts[0] }
}

export function storeContract(connection: any) {
  if (!GAMESTORE_ADDRESS) throw new Error('Set VITE_GAMESTORE_ADDRESS to your deployed GameStore proxy address.')
  return new Contract(GAMESTORE_ADDRESS, ABI, connection)
}
export const fromUnits = (n: bigint) => Number(formatUnits(n, 18)).toLocaleString(undefined, { maximumFractionDigits: 4 })
export const toUnits = (n: string) => parseUnits(n, 18)
