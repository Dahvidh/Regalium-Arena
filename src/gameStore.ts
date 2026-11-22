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

async function discoverInjectedWallet(): Promise<any> {
  const win = window as any
  const injected = win.ethereum
  if (injected?.providers?.length) {
    const providers = injected.providers
    return providers.find((p: any) => p.isMetaMask) || providers.find((p: any) => p.isCoinbaseWallet) || providers[0]
  }
  if (injected) return injected

  const announcements = new Map<string, any>()
  const onAnnounce = (event: any) => {
    const detail = event.detail
    if (detail?.info?.uuid && detail.provider) announcements.set(detail.info.uuid, detail)
  }
  window.addEventListener('eip6963:announceProvider', onAnnounce as EventListener)
  window.dispatchEvent(new Event('eip6963:requestProvider'))
  await new Promise(resolve => window.setTimeout(resolve, 300))
  window.removeEventListener('eip6963:announceProvider', onAnnounce as EventListener)
  const choices = [...announcements.values()]
  if (choices.length) {
    const selected = choices.find((item: any) => /metamask/i.test(item.info?.name || item.info?.rdns || '')) || choices[0]
    return selected.provider
  }
  throw new Error('No browser wallet detected. On mobile, open this page inside your wallet app browser. On desktop, install or unlock MetaMask, Coinbase Wallet, or another EVM wallet.')
}

export async function connectWallet() {
  const eth = await discoverInjectedWallet()
  const accounts = await eth.request({ method: 'eth_requestAccounts' })
  if (!accounts?.[0]) throw new Error('No wallet account returned.')
  let chainId = Number(await eth.request({ method: 'eth_chainId' }))
  if (chainId !== CHAIN_ID) {
    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x13882' }] })
    } catch (e: any) {
      if (e.code !== 4902) throw e
      await eth.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0x13882', chainName: 'Polygon Amoy', nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 }, rpcUrls: ['https://rpc-amoy.polygon.technology/'], blockExplorerUrls: ['https://amoy.polygonscan.com/'] }] })
    }
    chainId = Number(await eth.request({ method: 'eth_chainId' }))
  }
  if (chainId !== CHAIN_ID) throw new Error('Please switch your wallet to Polygon Amoy (chain ID 80002).')
  const provider = new BrowserProvider(eth)
  return { provider, signer: await provider.getSigner(), address: accounts[0] }
}

export function storeContract(connection: any) {
  if (!GAMESTORE_ADDRESS) throw new Error('Set VITE_GAMESTORE_ADDRESS to your deployed GameStore proxy address.')
  return new Contract(GAMESTORE_ADDRESS, ABI, connection)
}
export const fromUnits = (n: bigint) => Number(formatUnits(n, 18)).toLocaleString(undefined, { maximumFractionDigits: 4 })
export const toUnits = (n: string) => parseUnits(n, 18)
