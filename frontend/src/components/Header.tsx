import { useState } from 'react';
import { Flame, ShieldCheck, Cpu, ExternalLink, ChevronDown, Check, Copy, Wallet, Activity, Zap, X } from 'lucide-react';
import type { WalletProfile } from '../types';
import { truncateAddress } from '../utils/formatters';

interface HeaderProps {
  activeTab: 'streams' | 'escrows' | 'inspector';
  setActiveTab: (tab: 'streams' | 'escrows' | 'inspector') => void;
  wallets: WalletProfile[];
  activeWallet: WalletProfile;
  setActiveWallet: (wallet: WalletProfile) => void;
  blockHeight: number;
  onClaimFaucet: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  wallets,
  activeWallet,
  setActiveWallet,
  blockHeight,
  onClaimFaucet,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [faucetModalOpen, setFaucetModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(activeWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInstantFaucet = () => {
    onClaimFaucet();
    setFaucetModalOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('streams')}>
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 p-[1px] shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Flame className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white font-mono">BLAZE<span className="text-emerald-400">VAULT</span></span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  BCH v0.14
                </span>
              </div>
              <p className="text-[11px] text-slate-400 tracking-wide font-sans">Payment Streams & Milestone Covenants</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
            <button
              onClick={() => setActiveTab('streams')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'streams'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Flame className="w-4 h-4 text-emerald-400" />
              <span>Payment Streams</span>
            </button>

            <button
              onClick={() => setActiveTab('escrows')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'escrows'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Milestone Escrows</span>
            </button>

            <button
              onClick={() => setActiveTab('inspector')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'inspector'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Covenant Inspector</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">Chipnet</span>
            </div>
            <div className="h-3 w-px bg-slate-800"></div>
            <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
              <Activity className="w-3 h-3 text-slate-500" />
              <span>#{blockHeight.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-amber-500/30 rounded-xl p-0.5 shadow-sm shadow-amber-500/10">
            <button
              onClick={onClaimFaucet}
              title="Mint +5.0 BCH directly into your wallet"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>+5 BCH Faucet</span>
            </button>
            <button
              onClick={() => setFaucetModalOpen(true)}
              title="View external Chipnet faucets and explorers"
              className="p-1.5 text-amber-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white">{activeWallet.name.split(' ')[0]}</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                    {activeWallet.role.split(' ')[0]}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-emerald-400 font-medium">
                  {activeWallet.balanceBch.toFixed(4)} BCH
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Wallet Profile</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-mono text-slate-300">{truncateAddress(activeWallet.address, 8)}</span>
                    <button
                      onClick={copyAddress}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                      title="Copy Address"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  {wallets.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => {
                        setActiveWallet(w);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                        activeWallet.id === w.id
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-white'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-medium text-white">{w.name}</div>
                        <div className="text-[10px] text-slate-400">{w.role}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono text-emerald-400 font-semibold">{w.balanceBch.toFixed(2)} BCH</div>
                        <div className="text-[10px] font-mono text-slate-400">${w.balancePusd} PUSD</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 p-2 bg-slate-950">
        <button
          onClick={() => setActiveTab('streams')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
            activeTab === 'streams' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-emerald-400" />
          <span>Streams</span>
        </button>
        <button
          onClick={() => setActiveTab('escrows')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
            activeTab === 'escrows' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Escrows</span>
        </button>
        <button
          onClick={() => setActiveTab('inspector')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
            activeTab === 'inspector' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>Covenants</span>
        </button>
      </div>

      {faucetModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 flex min-h-screen items-center justify-center animate-in fade-in">
          <div className="relative w-full max-w-md my-8 rounded-2xl glass-panel p-6 border border-amber-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Chipnet Testnet Faucets</h3>
                  <p className="text-xs text-slate-400">Fund your wallet with test Bitcoin Cash</p>
                </div>
              </div>
              <button onClick={() => setFaucetModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Instant Sandbox Faucet</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Instantly credit <span className="font-mono text-emerald-400 font-bold">+5.0000 BCH</span> to your active wallet ({activeWallet.name.split(' ')[0]}) without waiting for external network faucets.
                </p>
                <button
                  onClick={handleInstantFaucet}
                  className="w-full mt-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>Claim 5.00 BCH Instantly</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">Community Faucet (Live)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Community-funded multi-network faucet supporting Chipnet and Testnet4.
                </p>
                <a
                  href="https://tbch.googol.cash/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 pt-1"
                >
                  <span>Open tbch.googol.cash</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">Community Host (imaginary.cash)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 bg-amber-500/10">
                    Intermittent
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Occasionally undergoes upstream maintenance or 502 gateway resets.
                </p>
                <a
                  href="https://chipnet.imaginary.cash/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-300 pt-1"
                >
                  <span>chipnet.imaginary.cash</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
