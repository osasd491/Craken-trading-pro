import React from 'react';
import { Bitcoin, Diamond, CircleDollarSign, Zap, Coins } from 'lucide-react';

interface CryptoIconProps {
  symbol: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const CryptoIcon: React.FC<CryptoIconProps> = ({
  symbol,
  size = 'md',
  className = ''
}) => {
  const cleanSymbol = symbol.toUpperCase().replace('/USD', '').replace('/USDT', '').trim();

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base'
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (cleanSymbol === 'BTC' || cleanSymbol === 'BITCOIN') {
    return (
      <div
        className={`rounded-full bg-[#F7931A] text-white flex items-center justify-center font-black shadow-md shadow-amber-500/30 shrink-0 ${sizeClasses[size]} ${className}`}
        title="Bitcoin (BTC)"
      >
        <Bitcoin className={`${iconSizes[size]} text-white`} />
      </div>
    );
  }

  if (cleanSymbol === 'ETH' || cleanSymbol === 'ETHEREUM') {
    return (
      <div
        className={`rounded-full bg-gradient-to-tr from-[#627EEA] to-[#8C9EFF] text-white flex items-center justify-center font-black shadow-md shadow-indigo-500/30 shrink-0 relative ${sizeClasses[size]} ${className}`}
        title="Ethereum (ETH)"
      >
        <Diamond className={`${iconSizes[size]} text-white fill-white/80`} />
      </div>
    );
  }

  if (cleanSymbol === 'USDT' || cleanSymbol === 'TETHER') {
    return (
      <div
        className={`rounded-full bg-[#26A17B] text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/30 shrink-0 ${sizeClasses[size]} ${className}`}
        title="Tether (USDT)"
      >
        <CircleDollarSign className={`${iconSizes[size]} text-white`} />
      </div>
    );
  }

  if (cleanSymbol === 'SOL' || cleanSymbol === 'SOLANA') {
    return (
      <div
        className={`rounded-full bg-gradient-to-tr from-[#9945FF] to-[#14F195] text-white flex items-center justify-center font-black shadow-md shadow-purple-500/30 shrink-0 ${sizeClasses[size]} ${className}`}
        title="Solana (SOL)"
      >
        <Zap className={`${iconSizes[size]} text-white fill-white/90`} />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-black shadow-sm shrink-0 ${sizeClasses[size]} ${className}`}
      title={symbol}
    >
      <Coins className={`${iconSizes[size]} text-slate-300`} />
    </div>
  );
};
