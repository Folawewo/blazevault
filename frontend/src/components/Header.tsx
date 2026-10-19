import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronDown, Copy, Moon, Sun } from 'lucide-react';
import type { WalletProfile } from '../types';
import { truncateAddress } from '../utils/formatters';

type Tab = 'streams' | 'escrows' | 'inspector';
interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  wallets: WalletProfile[];
  activeWallet: WalletProfile;
  setActiveWallet: (wallet: WalletProfile) => void;
  blockHeight: number;
  onClaimFaucet: () => void;
}
const sections: { id: Tab; label: string; short: string; index: string }[] = [
  { id: 'streams', label: 'Payment streams', short: 'Streams', index: '01' },
  { id: 'escrows', label: 'Milestone escrows', short: 'Escrows', index: '02' },
  { id: 'inspector', label: 'Covenant inspector', short: 'Inspector', index: '03' },
];

export function Header({ activeTab, setActiveTab, wallets, activeWallet, setActiveWallet, blockHeight, onClaimFaucet }: HeaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const [walletOpen, setWalletOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const walletRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: PointerEvent) => { if (!walletRef.current?.contains(event.target as Node)) setWalletOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setWalletOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('blazevault-theme', next); } catch {}
    setTheme(next);
  };
  const copyAddress = async () => {
    try { await navigator.clipboard.writeText(activeWallet.address); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { setCopied(false); }
  };

  return <header className="app-header">
    <div className="app-header-inner">
      <button className="brand" onClick={() => setActiveTab('streams')} aria-label="BlazeVault home"><span className="brand-mark" aria-hidden="true">B<span>/</span></span><span><strong className="brand-name">BlazeVault</strong><span className="brand-subtitle">PAYMENT PROTOCOL / BCH</span></span></button>
      <div className="header-actions">
        <div className="network-indicator" title={`Simulated block height ${blockHeight.toLocaleString()}`}><span className="network-dot" /> CHIPNET <span className="network-demo">DEMO</span></div>
        <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
        <div className="relative" ref={walletRef}>
          <button className="wallet-trigger" aria-expanded={walletOpen} aria-haspopup="listbox" onClick={() => setWalletOpen(!walletOpen)}><span className="wallet-avatar">{activeWallet.name.slice(0, 1)}</span><span className="wallet-trigger-copy"><strong>{activeWallet.name.split(' ')[0]}</strong><small>{activeWallet.balanceBch.toFixed(2)} BCH · demo</small></span><ChevronDown size={15} aria-hidden="true" /></button>
          {walletOpen && <div className="wallet-menu" role="listbox" aria-label="Demo wallet profile">
            <div className="wallet-menu-caption">DEMO WALLETS · SIMULATED BALANCES</div>
            {wallets.map(wallet => <button key={wallet.id} className="wallet-option" role="option" aria-selected={activeWallet.id === wallet.id} onClick={() => { setActiveWallet(wallet); setWalletOpen(false); }}><span><strong>{wallet.name}</strong><small>{wallet.role}</small></span><span className="wallet-option-value">{wallet.balanceBch.toFixed(2)} BCH</span></button>)}
            <div className="wallet-menu-address"><code>{truncateAddress(activeWallet.address, 8)}</code><button onClick={copyAddress} aria-label="Copy wallet address"><Copy size={15} /> {copied ? 'Copied' : 'Copy'}</button></div>
            <button className="wallet-faucet" onClick={() => { onClaimFaucet(); setWalletOpen(false); }}>Add 5 demo BCH <ArrowUpRight size={16} aria-hidden="true" /></button>
          </div>}
        </div>
      </div>
    </div>
    <nav className="app-nav" aria-label="Primary">{sections.map(section => <button key={section.id} aria-current={activeTab === section.id ? 'page' : undefined} onClick={() => setActiveTab(section.id)}><span>{section.index}</span><strong className="nav-long">{section.label}</strong><strong className="nav-short">{section.short}</strong></button>)}</nav>
  </header>;
}
