"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Tabs, TabKey } from "@/components/Tabs";
import { Section } from "@/components/Section";
import { shortAddr, formatNumber } from "@/lib/format";
import { loadStarkzap } from "@/lib/starkzapClient";

type Network = "sepolia" | "mainnet";
type Validator = { key: string; name: string; stakerAddress: string };

function useLocalStorage(key: string, initial: string) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    try {
      const v = localStorage.getItem(key);
      if (v) setValue(v);
    } catch {}
  }, [key]);
  useEffect(() => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  }, [key, value]);
  return [value, setValue] as const;
}

function pickMetrics(pool: any) {
  if (!pool) return { apr: "—", tvl: "—", stakers: "—", symbol: "—" };
  const aprCandidates = [pool.apr, pool.apy, pool.rewardApr, pool.stakingApr, pool.metrics?.apr, pool.metrics?.apy, pool.stats?.apr, pool.stats?.apy].find((v) => v !== undefined && v !== null);
  const tvlCandidates = [pool.tvl, pool.totalValueLocked, pool.metrics?.tvl, pool.stats?.tvl, pool.delegatedAmount, pool.amount].find((v) => v !== undefined && v !== null);
  const stakersCandidates = [pool.totalStakers, pool.stakers, pool.metrics?.stakers, pool.stats?.stakers].find((v) => v !== undefined && v !== null);
  return {
    apr: aprCandidates !== undefined ? `${formatNumber(aprCandidates, 2)}%` : "—",
    tvl: tvlCandidates !== undefined ? String(tvlCandidates) : "—",
    stakers: stakersCandidates !== undefined ? String(stakersCandidates) : "—",
    symbol: pool.token?.symbol ?? "—"
  };
}

async function tryGetTokenBalance(wallet: any, pool: any) {
  if (!wallet) return null;
  const token = pool?.token;
  const tokenAddr = token?.address || token?.contractAddress;
  const attempts: Array<() => Promise<any>> = [
    async () => wallet.getTokenBalance?.(tokenAddr),
    async () => wallet.getBalance?.(tokenAddr),
    async () => wallet.balanceOf?.(tokenAddr),
    async () => wallet.getBalance?.()
  ];
  for (const fn of attempts) {
    try {
      const res = await fn();
      if (res !== undefined && res !== null) return res;
    } catch {}
  }
  return null;
}

const wheelRewards = [0, 5, 10, 20, 0, 15, 25, 0];

type Trader = {
  id: string;
  name: string;
  handle: string;
  xUrl: string;
  avatar: string;
  style: string;
  bio: string;
  pnl: string;
  winRate: string;
  followers: string;
  volume: string;
  focus: string[];
  lastTrade: string;
  recent: { pair: string; side: "Long" | "Short" | "Stake" | "Rotate"; note: string; time: string }[];
  curve: number[];
};

const traders: Trader[] = [
  {
    id: "gainzy",
    name: "Gainzy",
    handle: "@gainzy222",
    xUrl: "https://x.com/gainzy222",
    avatar: "GZ",
    style: "Momentum",
    bio: "Fast-moving momentum trader with high-conviction BTC and Starknet rotations.",
    pnl: "+128.4%",
    winRate: "72%",
    followers: "61.8k",
    volume: "$4.1m",
    focus: ["BTC", "STRK", "ETH"],
    lastTrade: "Added to BTC continuation and rotated a sleeve into STRK strength",
    recent: [
      { pair: "BTC / USD", side: "Long", note: "Stayed with trend continuation after reclaim and added on strength.", time: "8m ago" },
      { pair: "STRK / USDC", side: "Long", note: "Leaned into Starknet beta as momentum expanded.", time: "46m ago" },
      { pair: "USDC Yield", side: "Rotate", note: "Parked a slice of realized gains into lower-vol yield.", time: "2h ago" }
    ],
    curve: [34, 42, 48, 58, 66, 78, 96, 112]
  },
  {
    id: "mayne",
    name: "Mayne",
    handle: "@Tradermayne",
    xUrl: "https://x.com/Tradermayne",
    avatar: "MY",
    style: "Swing",
    bio: "Clean swing trader focused on structure, patience, and major level reactions across BTC and ETH.",
    pnl: "+94.7%",
    winRate: "68%",
    followers: "92.4k",
    volume: "$3.2m",
    focus: ["BTC", "ETH", "USDC"],
    lastTrade: "Held BTC swing exposure and trimmed into resistance",
    recent: [
      { pair: "BTC / USD", side: "Long", note: "Maintained higher-timeframe long after support held on retest.", time: "15m ago" },
      { pair: "ETH / USD", side: "Rotate", note: "Shifted part of risk from ETH back into BTC leadership.", time: "1h ago" },
      { pair: "USDC Vault", side: "Stake", note: "Idle capital moved into yield while waiting for next setup.", time: "3h ago" }
    ],
    curve: [28, 34, 39, 47, 55, 60, 69, 79]
  },
  {
    id: "ninja",
    name: "Ninja",
    handle: "@Ninjascalp",
    xUrl: "https://x.com/Ninjascalp",
    avatar: "NJ",
    style: "Scalp",
    bio: "Low-timeframe execution, fast reactions, and short holding windows around high-volume sessions.",
    pnl: "+76.9%",
    winRate: "66%",
    followers: "38.2k",
    volume: "$2.7m",
    focus: ["STRK", "BTC", "ETH"],
    lastTrade: "Closed a fast intraday STRK scalp and reset into cash",
    recent: [
      { pair: "STRK / USDC", side: "Long", note: "Quick open-drive scalp into first liquidity pocket.", time: "5m ago" },
      { pair: "ETH / USD", side: "Short", note: "Faded local extension during midday chop.", time: "27m ago" },
      { pair: "BTC / USD", side: "Long", note: "Caught momentum burst after compression resolution.", time: "58m ago" }
    ],
    curve: [22, 31, 29, 38, 44, 49, 58, 67]
  },
  {
    id: "whitewhale",
    name: "The White Whale",
    handle: "@WhiteWhaleLabs",
    xUrl: "https://x.com/WhiteWhaleLabs",
    avatar: "WW",
    style: "Macro + Flow",
    bio: "Macro-led flow watcher blending BTC positioning, ecosystem narratives, and rotational strength.",
    pnl: "+163.2%",
    winRate: "79%",
    followers: "44.6k",
    volume: "$5.6m",
    focus: ["BTC", "ETH", "STRK"],
    lastTrade: "Rotated into Starknet theme leaders after broad-market strength",
    recent: [
      { pair: "BTC / USD", side: "Long", note: "Stayed with broad trend and added on session breakout.", time: "11m ago" },
      { pair: "STRK Basket", side: "Rotate", note: "Shifted attention toward Starknet names with relative strength.", time: "52m ago" },
      { pair: "ETH / USD", side: "Stake", note: "Moved inactive balance into a yield route while waiting on follow-through.", time: "2h ago" }
    ],
    curve: [36, 41, 54, 62, 74, 86, 101, 122]
  }
];

export default function Page() {
  const [tab, setTab] = useState<TabKey>("stake");
  const [network, setNetwork] = useState<Network>("sepolia");
  const [sdk, setSdk] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [validators, setValidators] = useState<Validator[]>([]);
  const [validatorKey, setValidatorKey] = useState("");
  const selectedValidator = useMemo(() => validators.find((v) => v.key === validatorKey), [validators, validatorKey]);
  const [pools, setPools] = useState<any[]>([]);
  const [poolAddr, setPoolAddr] = useState("");
  const selectedPool = useMemo(() => pools.find((p) => p.poolContract === poolAddr), [pools, poolAddr]);
  const [amount, setAmount] = useState("10");
  const [position, setPosition] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [demoUrl, setDemoUrl] = useLocalStorage("mushee_demo_url", "");
  const [repoUrl, setRepoUrl] = useLocalStorage("mushee_repo_url", "");
  const [wheelState, setWheelState] = useState({ spinning: false, rotation: 0, reward: 0 });
  const [cardName, setCardName] = useState("Happy Birthday, Satoshi");
  const [cardMessage, setCardMessage] = useState("Wishing you a Bitcoin-filled year ahead.");
  const [cardRecipient, setCardRecipient] = useState("Friend");
  const [cardAmount, setCardAmount] = useState("0.001 BTC");
  const [cardTheme, setCardTheme] = useState("orange");
  const [cardCreated, setCardCreated] = useState(false);
  const [connectMenuOpen, setConnectMenuOpen] = useState(false);
  const [walletMode, setWalletMode] = useState<"" | "cartridge" | "browser">("");
  const [walletLabel, setWalletLabel] = useState("Not connected");
  const [selectedTraderId, setSelectedTraderId] = useState(traders[0].id);

  useEffect(() => {
    let alive = true;
    ;(async () => {
      setError("");
      setStatus("Loading SDK…");
      try {
        const mod = await loadStarkzap();
        const { StarkZap, mainnetValidators, sepoliaValidators } = mod;
        const s = new StarkZap({ network });
        if (!alive) return;
        setSdk(s);
        const preset = network === "mainnet" ? mainnetValidators : sepoliaValidators;
        const list = Object.entries(preset).map(([key, val]: any) => ({ key, name: val.name, stakerAddress: val.stakerAddress })) as Validator[];
        setValidators(list);
        setValidatorKey(list[0]?.key ?? "");
        setPools([]);
        setPoolAddr("");
        setWallet(null);
        setPosition(null);
        setBalance(null);
        setStatus("");
      } catch (e: any) {
        setError(e?.message ?? "Failed to init Starkzap");
        setStatus("");
      }
    })();
    return () => {
      alive = false;
    };
  }, [network]);

  useEffect(() => {
    let alive = true;
    ;(async () => {
      if (!wallet || !selectedPool) return;
      setLoadingBalance(true);
      try {
        const b = await tryGetTokenBalance(wallet, selectedPool);
        if (alive) setBalance(b);
      } catch {
        if (alive) setBalance(null);
      } finally {
        if (alive) setLoadingBalance(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [wallet, selectedPool]);

  async function connectCartridge() {
    if (!sdk) return;
    setError("");
    setStatus("Connecting with Cartridge…");
    try {
      const mod = await loadStarkzap();
      const { OnboardStrategy } = mod;
      const onboard = await sdk.onboard({
        strategy: OnboardStrategy.Cartridge,
        deploy: "if_needed",
        cartridge: { policies: [] }
      });
      setWallet(onboard.wallet);
      setWalletMode("cartridge");
      setWalletLabel("Cartridge");
      setConnectMenuOpen(false);
      setStatus("Connected with Cartridge ✅");
    } catch (e: any) {
      setError(e?.message ?? "Failed to connect Cartridge");
      setStatus("");
    }
  }

  async function connectBrowserWallet() {
    setError("");
    setStatus("Checking for Starknet wallet…");
    try {
      const anyWindow = window as any;
      const starknet = anyWindow?.starknet ?? anyWindow?.starknet_braavos ?? anyWindow?.starknet_argentX;
      if (!starknet) {
        throw new Error("No injected Starknet wallet found. Install Argent X or Braavos, then try again.");
      }
      await starknet.enable?.({ starknetVersion: "v5" });
      const selectedAddress = starknet.selectedAddress || starknet.account?.address || starknet.address;
      setWallet({ address: selectedAddress, walletType: "browser", isInjected: true });
      setWalletMode("browser");
      setWalletLabel(starknet.name || "Browser wallet");
      setConnectMenuOpen(false);
      setStatus("Browser wallet connected ✅");
    } catch (e: any) {
      setError(e?.message ?? "Failed to connect browser wallet");
      setStatus("");
    }
  }

  async function loadPools() {
    if (!sdk || !selectedValidator) return;
    setError("");
    setStatus("Loading pools…");
    try {
      const ps = await sdk.getStakerPools(selectedValidator.stakerAddress);
      setPools(ps);
      const pick = ps.find((p: any) => p?.token?.symbol === "STRK") ?? ps[0];
      setPoolAddr(pick?.poolContract ?? "");
      setStatus("Pools ready ✅");
    } catch (e: any) {
      setError(e?.message ?? "Failed to load pools");
      setStatus("");
    }
  }

  async function refreshPosition() {
    if (!wallet || !poolAddr) return;
    setError("");
    setStatus("Refreshing…");
    try {
      const pos = await wallet.getPoolPosition(poolAddr);
      setPosition(pos ?? null);
      setStatus("Up to date ✅");
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch position");
      setStatus("");
    }
  }

  async function stake() {
    if (!selectedPool) return;
    if (!wallet?.stake) {
      setConnectMenuOpen(true);
      setError("Connect with Cartridge to use Starkzap staking actions.");
      return;
    }
    setError("");
    setStatus("Staking…");
    try {
      const mod = await loadStarkzap();
      const { Amount } = mod;
      const amt = Amount.parse(amount, selectedPool.token);
      const tx = await wallet.stake(selectedPool.poolContract, amt);
      await tx.wait?.();
      setStatus("Staked ✅");
      await refreshPosition();
      setTab("dashboard");
    } catch (e: any) {
      setError(e?.message ?? "Stake failed");
      setStatus("");
    }
  }

  async function claim() {
    if (!poolAddr) return;
    if (!wallet?.claimPoolRewards) {
      setConnectMenuOpen(true);
      setError("Connect with Cartridge to claim rewards.");
      return;
    }
    setError("");
    setStatus("Claiming…");
    try {
      const tx = await wallet.claimPoolRewards(poolAddr);
      await tx.wait?.();
      setStatus("Claimed ✅");
      await refreshPosition();
    } catch (e: any) {
      setError(e?.message ?? "Claim failed");
      setStatus("");
    }
  }

  async function exitIntent() {
    if (!selectedPool) return;
    if (!wallet?.exitPoolIntent) {
      setConnectMenuOpen(true);
      setError("Connect with Cartridge to submit exit intent.");
      return;
    }
    setError("");
    setStatus("Exit intent…");
    try {
      const mod = await loadStarkzap();
      const { Amount } = mod;
      const amt = Amount.parse(amount, selectedPool.token);
      const tx = await wallet.exitPoolIntent(selectedPool.poolContract, amt);
      await tx.wait?.();
      setStatus("Exit intent submitted ✅");
      await refreshPosition();
    } catch (e: any) {
      setError(e?.message ?? "Exit intent failed");
      setStatus("");
    }
  }

  function spinWheel() {
    if (wheelState.spinning) return;
    const reward = wheelRewards[Math.floor(Math.random() * wheelRewards.length)];
    const rotation = wheelState.rotation + 1440 + Math.floor(Math.random() * 360);
    setWheelState({ spinning: true, rotation, reward });
    window.setTimeout(() => {
      setWheelState((prev) => ({ ...prev, spinning: false }));
    }, 3200);
  }

  const address = wallet?.address ? String(wallet.address) : "";
  const metrics = pickMetrics(selectedPool);
  const selectedTrader = traders.find((t) => t.id === selectedTraderId) ?? traders[0];
  const cardThemeClass = cardTheme === "orange" ? "card-gradient" : cardTheme === "dark" ? "bg-black text-white border-black" : "bg-white";

  return (
    <main className="min-h-screen page-bg">
      <div className="container py-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="pill">Mushee</span>
              <span className="pill">UK incorporated</span>
              <span className="pill">Powered by Starkzap</span>
              <span className="pill">Testnet-ready</span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-black/60">
              <span className="kbd">⌘</span>
              <span className="kbd">K</span>
              <span>building the commons</span>
            </div>
          </div>

          <div className="card soft-grid overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-7 md:p-10">
              <div>
                <div className="badge mb-4">Mushee + Starknet build</div>
                <h1 className="hero-number">Mushee Yield</h1>
                <p className="text-black/60 mt-3 max-w-2xl">
                  Connect your wallet, load pools, stake on testnet, claim rewards, get test tokens, create a bitcoin birthday card, and explore a playful spin experience in one clean interface.
                </p>
                <p className="text-black/70 mt-3">Tagline: <span className="font-medium text-black">Make yield feel like a button.</span></p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button className={["btn", address ? "" : "btn-primary"].join(" ")} onClick={connectCartridge} disabled={!sdk}>
                    {address && walletMode === "cartridge" ? "Connected via Cartridge" : "Connect with Cartridge"}
                  </button>
                  <button className="btn" onClick={() => setConnectMenuOpen((v) => !v)}>Connect Wallet</button>
                  <button className="btn" onClick={() => setTab("faucet")}>Open Faucet</button>
                  <button className="btn" onClick={() => setTab("cards")}>Bitcoin Cards</button>
                  <button className="btn" onClick={() => setTab("spin")}>Spin the Wheel</button>
                </div>
                {connectMenuOpen ? (
                  <div className="mt-5 card p-4 max-w-xl">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">Connect Wallet</div>
                        <p className="text-xs text-black/60 mt-1">Choose Cartridge for the full Starkzap flow, or connect a browser wallet for realistic wallet-triggered demo actions.</p>
                      </div>
                      <button className="btn py-2 px-3" onClick={() => setConnectMenuOpen(false)}>Close</button>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button className="card p-4 text-left hover:border-orange-300 transition" onClick={connectCartridge}>
                        <div className="text-sm font-semibold">Cartridge</div>
                        <div className="text-xs text-black/60 mt-1">Best for full Starkzap staking, claiming, and pool actions.</div>
                      </button>
                      <button className="card p-4 text-left hover:border-orange-300 transition" onClick={connectBrowserWallet}>
                        <div className="text-sm font-semibold">Browser wallet</div>
                        <div className="text-xs text-black/60 mt-1">Connect Argent X or Braavos for wallet-gated demo flows.</div>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="card p-5 bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-black/60">Network</div>
                    <select className="input mt-2" value={network} onChange={(e) => setNetwork(e.target.value as Network)}>
                      <option value="sepolia">Sepolia</option>
                      <option value="mainnet">Mainnet</option>
                    </select>
                  </div>
                  <div className="text-right min-w-0">
                    <div className="text-xs text-black/60">Wallet</div>
                    <div className="mt-2 text-sm font-medium truncate">{address ? shortAddr(address) : "Not connected"}</div>
                    <div className="mt-2 text-[11px] text-black/50">{address ? `Connected via ${walletMode === "cartridge" ? "Cartridge" : walletLabel}` : "Choose Cartridge or browser wallet"}</div>
                  </div>
                </div>
                <div className="rule my-4" />
                <div className="grid grid-cols-2 gap-3">
                  <Mini label="Token" value={metrics.symbol} />
                  <Mini label="APR / APY" value={metrics.apr} />
                  <Mini label="TVL" value={metrics.tvl} />
                  <Mini label="Stakers" value={metrics.stakers} />
                </div>
                {(status || error) && (
                  <div className="mt-4 text-xs">
                    {status ? <div className="text-black/60">{status}</div> : null}
                    {error ? <div className="text-red-600">{error}</div> : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Tabs active={tab} onChange={setTab} />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={["lg:col-span-1 space-y-6", tab === "hub" ? "hidden" : ""].join(" ")}>
            <Section title="Validator" subtitle="Pick a validator preset, then load pools." right={<span className="pill">{network}</span>}>
              <div className="space-y-3">
                <select className="input" value={validatorKey} onChange={(e) => setValidatorKey(e.target.value)}>
                  {validators.map((v) => <option key={v.key} value={v.key}>{v.name}</option>)}
                </select>
                <button className="btn btn-primary w-full" onClick={loadPools} disabled={!sdk || !selectedValidator}>Load pools</button>
                <div className="text-xs text-black/60">{selectedValidator?.stakerAddress ? <>staker: <span className="font-medium">{shortAddr(selectedValidator.stakerAddress)}</span></> : "—"}</div>
              </div>
            </Section>

            <Section title="Stake" subtitle="Simple defaults for testnet play." right={<span className="badge">Balance: {loadingBalance ? "loading…" : balance !== null ? String(balance) : "—"}</span>}>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <input className="input col-span-2" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
                  <button className="btn" type="button" onClick={() => { const n = Number(balance); if (Number.isFinite(n) && n > 0) setAmount(String(n)); }} disabled={loadingBalance || balance === null}>Max</button>
                </div>
                <button className="btn btn-primary w-full" onClick={stake} disabled={!wallet || !selectedPool}>Stake</button>
                <div className="flex gap-2">
                  <button className="btn w-full" onClick={claim} disabled={!wallet || !poolAddr}>Claim</button>
                  <button className="btn w-full" onClick={exitIntent} disabled={!wallet || !selectedPool}>Exit intent</button>
                </div>
              </div>
            </Section>
          </div>

          <div className={tab === "hub" ? "lg:col-span-3" : "lg:col-span-2"}>
            {tab === "stake" && (
              <Section title="Pools" subtitle="Select a pool, view the key metrics, and stake." right={<button className="btn" onClick={refreshPosition} disabled={!wallet || !poolAddr}>Refresh</button>}>
                <div className="space-y-4">
                  <select className="input" value={poolAddr} onChange={(e) => setPoolAddr(e.target.value)} disabled={!pools.length}>
                    {!pools.length ? <option value="">Load pools first</option> : pools.map((p: any) => <option key={p.poolContract} value={p.poolContract}>{(p?.token?.symbol ?? "TOKEN") + " — " + shortAddr(p.poolContract)}</option>)}
                  </select>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Mini label="Token symbol" value={metrics.symbol} />
                    <Mini label="APR / APY" value={metrics.apr} />
                    <Mini label="Pool TVL" value={metrics.tvl} />
                    <Mini label="Total stakers" value={metrics.stakers} />
                  </div>
                  <div className="text-xs text-black/60">Metrics auto-detect from whatever the selected pool exposes. If a metric is unavailable, the card falls back to —.</div>
                </div>
              </Section>
            )}

            {tab === "dashboard" && (
              <Section title="Dashboard" subtitle="Wallet, pool, and position in one clean screen." right={<button className="btn" onClick={refreshPosition} disabled={!wallet || !poolAddr}>Refresh</button>}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Mini label="Wallet" value={address ? shortAddr(address) : "—"} />
                  <Mini label="Pool" value={poolAddr ? shortAddr(poolAddr) : "—"} />
                  <Mini label="Token" value={metrics.symbol} />
                </div>
                <div className="mt-5 card p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Position (raw)</div>
                    <span className="pill">MVP</span>
                  </div>
                  <pre className="mt-3 text-xs overflow-auto bg-black/[0.03] p-3 rounded-2xl">{JSON.stringify(position ?? { note: "Stake first, then refresh." }, null, 2)}</pre>
                </div>
              </Section>
            )}

            {tab === "faucet" && (
              <Section title="Faucet" subtitle="Use this section to fund your Starknet Sepolia wallet for testnet play.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card p-5">
                    <div className="text-sm font-semibold">Connected wallet</div>
                    <p className="text-sm text-black/60 mt-2">Copy your Starknet address, then open the faucet in a new tab.</p>
                    <div className="input mt-3">{address || "Connect wallet first"}</div>
                    <div className="mt-3 flex gap-2">
                      <button className="btn w-full" onClick={() => address && navigator.clipboard.writeText(address)} disabled={!address}>Copy address</button>
                      <a className="btn btn-primary w-full" href="https://starknet-faucet.vercel.app/" target="_blank" rel="noreferrer">Open faucet</a>
                    </div>
                    <p className="text-xs text-black/60 mt-3">After claiming testnet STRK, come back here and load pools.</p>
                  </div>
                  <div className="card p-5">
                    <div className="text-sm font-semibold">Testnet flow</div>
                    <ol className="mt-3 text-sm text-black/70 space-y-2 list-decimal pl-4">
                      <li>Connect with Cartridge or a browser wallet</li>
                      <li>Copy your wallet address</li>
                      <li>Open the Starknet Sepolia faucet</li>
                      <li>Claim tokens</li>
                      <li>Return and stake on testnet</li>
                    </ol>
                  </div>
                </div>
              </Section>
            )}

            {tab === "cards" && (
              <Section title="Bitcoin Birthday Cards" subtitle="A working prototype for creating shareable bitcoin gift cards inspired by the challenge idea and Ready Wallet-style payments." right={<span className="badge">Prototype</span>}>
                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-black/60">Card title</label>
                        <input className="input mt-2" value={cardName} onChange={(e) => setCardName(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-black/60">Recipient</label>
                        <input className="input mt-2" value={cardRecipient} onChange={(e) => setCardRecipient(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-black/60">Message</label>
                      <textarea className="textarea mt-2" value={cardMessage} onChange={(e) => setCardMessage(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-black/60">Gift amount</label>
                        <input className="input mt-2" value={cardAmount} onChange={(e) => setCardAmount(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-black/60">Card theme</label>
                        <select className="input mt-2" value={cardTheme} onChange={(e) => setCardTheme(e.target.value)}>
                          <option value="orange">Orange Glow</option>
                          <option value="dark">Midnight</option>
                          <option value="light">Classic White</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button className="btn btn-primary" onClick={() => setCardCreated(true)}>Generate card</button>
                      <button className="btn" onClick={() => navigator.clipboard.writeText(`${cardName}\nTo: ${cardRecipient}\n${cardMessage}\nGift: ${cardAmount}`)}>Copy card text</button>
                    </div>
                    <div className="text-xs text-black/60">This prototype is interactive and lets users generate a bitcoin gift card preview. It is a working demo surface, not a live payment rail.</div>
                  </div>
                  <div className={["card p-6 min-h-[340px] flex flex-col justify-between", cardThemeClass].join(" ")}>
                    <div>
                      <div className={cardTheme === "dark" ? "text-white/70 text-xs" : "text-black/60 text-xs"}>Mushee Bitcoin Card</div>
                      <div className="mt-6 text-2xl font-semibold tracking-tight">{cardName}</div>
                      <div className={["mt-3 text-sm", cardTheme === "dark" ? "text-white/80" : "text-black/70"].join(" ")}>To: {cardRecipient}</div>
                      <p className={["mt-5 text-sm leading-6", cardTheme === "dark" ? "text-white/85" : "text-black/75"].join(" ")}>{cardMessage}</p>
                    </div>
                    <div className="mt-8">
                      <div className={["text-xs", cardTheme === "dark" ? "text-white/60" : "text-black/60"].join(" ")}>Gift amount</div>
                      <div className="mt-1 text-3xl font-semibold">{cardAmount}</div>
                      <div className="mt-4 flex items-center justify-between text-xs">
                        <span className={cardTheme === "dark" ? "text-white/70" : "text-black/60"}>Network: {network}</span>
                        <span className={cardTheme === "dark" ? "text-white/70" : "text-black/60"}>{address ? shortAddr(address) : "Wallet optional"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {cardCreated && (
                  <div className="mt-5 card p-4 bg-orange-50 border-orange-200">
                    <div className="text-sm font-semibold">Card ready</div>
                    <p className="text-sm text-black/70 mt-1">Your bitcoin birthday card preview is generated. Next production step would be attaching a payment rail or gift funding flow.</p>
                  </div>
                )}
              </Section>
            )}

            {tab === "spin" && (
              <Section title="Spin the Wheel" subtitle="A playful reward surface for the demo. Connect wallet, spin, and see your reward result.">
                <div className="grid grid-cols-1 md:grid-cols-[340px,1fr] gap-6 items-start">
                  <div className="card p-6 flex flex-col items-center">
                    <div className="w-64 h-64 rounded-full border-[10px] border-orange-500 relative transition-transform duration-[3200ms] ease-out" style={{ transform: `rotate(${wheelState.rotation}deg)`, background: "conic-gradient(#fff7ed 0deg 45deg, #fdba74 45deg 90deg, #fff 90deg 135deg, #fb923c 135deg 180deg, #fff7ed 180deg 225deg, #fdba74 225deg 270deg, #fff 270deg 315deg, #fb923c 315deg 360deg)" }}>
                      <div className="absolute inset-8 rounded-full bg-white border border-black/10 flex items-center justify-center text-center px-6">
                        <div>
                          <div className="text-xs text-black/60">Reward</div>
                          <div className="text-3xl font-semibold mt-1">{wheelState.reward} STRK</div>
                        </div>
                      </div>
                    </div>
                    <button className="btn btn-primary mt-5 w-full" onClick={() => { if (!address) { setConnectMenuOpen(true); return; } spinWheel(); }} disabled={wheelState.spinning}>{!address ? "Connect wallet first" : wheelState.spinning ? "Spinning…" : "Spin now"}</button>
                  </div>
                  <div className="space-y-4">
                    <div className="card p-5">
                      <div className="text-sm font-semibold">Wallet reward panel</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        <Mini label="Wallet" value={address ? shortAddr(address) : "—"} />
                        <Mini label="Latest wheel result" value={`${wheelState.reward} STRK`} />
                      </div>
                      <p className="text-xs text-black/60 mt-4">This wheel is a high-fidelity reward demo surface. Sending rewards directly on-chain would need a funded distributor contract or backend reward service.</p>
                    </div>
                    <div className="card p-5">
                      <div className="text-sm font-semibold">Reward slices</div>
                      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-sm">
                        {wheelRewards.map((r, i) => <div key={i} className="rounded-2xl border border-black/10 p-3 bg-orange-50">{r} STRK</div>)}
                      </div>
                    </div>
                  </div>
                </div>
              </Section>
            )}

            {tab === "hub" && (
              <Section
                title="Trading Hub"
                subtitle="Follow curated trader profiles, inspect recent market actions, and route copy intent into wallet-connected demo flows without breaking the clean Mushee UI."
                right={<span className="badge">Wider layout</span>}
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Mini label="Tracked traders" value={String(traders.length)} />
                    <Mini label="Network focus" value="Starknet + BTC" />
                    <Mini label="Mode" value="Copy / Follow / Scan" />
                    <Mini label="Wallet status" value={address ? shortAddr(address) : "Connect to engage"} />
                  </div>

                  <div className="grid grid-cols-1 2xl:grid-cols-[1.45fr,0.95fr] gap-6 items-start">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                      {traders.map((trader) => {
                        const active = trader.id === selectedTrader.id;
                        return (
                          <button
                            key={trader.id}
                            onClick={() => setSelectedTraderId(trader.id)}
                            className={[
                              "card p-6 text-left transition h-full",
                              active ? "border-orange-300 shadow-[0_20px_44px_rgba(249,115,22,0.14)] ring-1 ring-orange-200/70" : "hover:border-orange-200"
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="h-14 w-14 shrink-0 rounded-3xl bg-orange-100 border border-orange-200 flex items-center justify-center text-base font-semibold text-orange-700">{trader.avatar}</div>
                                <div className="min-w-0">
                                  <div className="text-lg font-semibold truncate">{trader.name}</div>
                                  <div className="text-sm text-black/55 mt-1 truncate">{trader.handle} • {trader.style}</div>
                                </div>
                              </div>
                              <span className="badge shrink-0">{trader.pnl}</span>
                            </div>
                            <p className="mt-5 text-sm text-black/70 leading-7">{trader.bio}</p>
                            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                              <Mini label="Win rate" value={trader.winRate} />
                              <Mini label="Followers" value={trader.followers} />
                              <Mini label="Volume" value={trader.volume} />
                            </div>
                            <div className="mt-5 flex flex-wrap gap-2">
                              {trader.focus.map((asset) => <span key={asset} className="pill">{asset}</span>)}
                            </div>
                            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                              <a className="btn" href={trader.xUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>View X profile ↗</a>
                              <span className="text-black/55">Last move: {trader.lastTrade}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-5 2xl:sticky 2xl:top-6">
                      <div className="card p-7">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs text-black/50">Featured trader</div>
                            <div className="mt-1 text-3xl font-semibold tracking-tight">{selectedTrader.name}</div>
                            <div className="text-sm text-black/60 mt-1">{selectedTrader.handle} • {selectedTrader.style}</div>
                          </div>
                          <div className="h-16 w-16 rounded-[24px] bg-orange-100 border border-orange-200 flex items-center justify-center text-lg font-semibold text-orange-700">{selectedTrader.avatar}</div>
                        </div>
                        <div className="mt-6 chart-shell">
                          <div className="chart-line chart-line-lg">
                            {selectedTrader.curve.map((point, i) => (
                              <div key={i} className="chart-bar chart-bar-lg" style={{ height: `${point}px` }} />
                            ))}
                          </div>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                          <Mini label="PnL" value={selectedTrader.pnl} />
                          <Mini label="Focus" value={selectedTrader.focus.join(" • ")} />
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                          <Mini label="Win rate" value={selectedTrader.winRate} />
                          <Mini label="Followers" value={selectedTrader.followers} />
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                          <button className="btn btn-primary" onClick={() => { if (!address) { setConnectMenuOpen(true); return; } setStatus(`Copying ${selectedTrader.name} strategy route…`); }}>Copy strategy</button>
                          <a className="btn" href={selectedTrader.xUrl} target="_blank" rel="noreferrer">Follow on X ↗</a>
                        </div>
                        <div className="mt-4 text-sm text-black/58 leading-6">Copying here is a guided execution demo surface. Once connected, users can route from trader discovery into yield or trading-style actions without leaving the page.</div>
                      </div>

                      <div className="card p-7">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-base font-semibold">Recent trades</div>
                          <span className="pill">Live-style feed</span>
                        </div>
                        <div className="mt-5 space-y-3">
                          {selectedTrader.recent.map((trade, i) => (
                            <div key={i} className="rounded-[22px] border border-black/10 bg-white px-4 py-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="text-sm font-semibold">{trade.pair}</div>
                                  <div className="text-sm text-black/58 mt-1 leading-6">{trade.note}</div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xs font-semibold text-orange-700">{trade.side}</div>
                                  <div className="text-xs text-black/45 mt-1">{trade.time}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Section>
            )}

            {tab === "ready" && (
              <Section title="Ready Wallet" subtitle="Connect to Ready Wallet for future crypto payments and bitcoin gift card redemption.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card p-5">
                    <div className="text-sm font-semibold">Connect Ready Wallet</div>
                    <p className="text-sm text-black/60 mt-2">Enter a Ready Wallet address to simulate connection and preview how payments and card redemption will work in Mushee.</p>
                    <input className="input mt-4" placeholder="Paste Ready Wallet address" />
                    <button className="btn btn-primary mt-3 w-full">Connect Ready Wallet</button>
                    <div className="mt-3 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-2xl px-3 py-2">Demo connection only • Real integration coming soon</div>
                  </div>
                  <div className="card p-5">
                    <div className="text-sm font-semibold">What Ready Wallet will enable</div>
                    <ul className="mt-3 text-sm text-black/70 space-y-2 list-disc pl-5">
                      <li>Crypto payments directly from Mushee</li>
                      <li>Redeem bitcoin birthday cards</li>
                      <li>Spend crypto in real-world payments</li>
                      <li>Future integration with Ready payment rails</li>
                    </ul>
                    <div className="mt-4 text-xs text-black/60">This section demonstrates how Mushee will support Ready Wallet integrations for payments and card redemption.</div>
                  </div>
                </div>
              </Section>
            )}

            {tab === "links" && (
              <Section title="Links" subtitle="Paste your real demo + repo once deployed.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card p-4">
                    <div className="text-sm font-semibold">Mushee</div>
                    <p className="text-sm text-black/60 mt-1">Project site</p>
                    <a className="btn mt-3 w-full" href="https://mushee.xyz/" target="_blank" rel="noreferrer">Open mushee.xyz ↗</a>
                  </div>
                  <div className="card p-4">
                    <div className="text-sm font-semibold">Starkzap docs</div>
                    <p className="text-sm text-black/60 mt-1">Quick start + wallet integration</p>
                    <a className="btn mt-3 w-full" href="https://docs.starknet.io/build/starkzap/quick-start" target="_blank" rel="noreferrer">Open docs ↗</a>
                  </div>
                  <div className="card p-4">
                    <div className="text-sm font-semibold">Demo URL</div>
                    <input className="input mt-3" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://your-app.vercel.app" />
                    <button className="btn mt-3 w-full" onClick={() => demoUrl && window.open(demoUrl, "_blank")} disabled={!demoUrl}>Open demo ↗</button>
                  </div>
                  <div className="card p-4">
                    <div className="text-sm font-semibold">Repo URL</div>
                    <input className="input mt-3" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/you/mushee-yield" />
                    <button className="btn mt-3 w-full" onClick={() => repoUrl && window.open(repoUrl, "_blank")} disabled={!repoUrl}>Open repo ↗</button>
                  </div>
                </div>
              </Section>
            )}
          </div>
        </div>

        <footer className="mt-10 text-sm text-black/60">
          <div className="rule mb-5" />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div><span className="font-medium text-black">Mushee</span> — UK incorporated. <span className="text-black">Make yield feel like a button.</span></div>
            <div className="text-xs">Powered by Starkzap • Mushee + Starknet • Built on testnet</div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-black/60">{label}</div>
      <div className="mt-1 text-sm font-semibold break-words">{value}</div>
    </div>
  );
}
