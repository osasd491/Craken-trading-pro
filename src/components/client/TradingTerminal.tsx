import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Activity,
  Layers,
  BarChart2,
  Clock,
  ShieldAlert,
  Zap,
  CheckCircle2,
  XCircle,
  Percent,
  AlertCircle
} from 'lucide-react';
import { ClientUser, MarketAsset, TradeOrder } from '../../types';
import { generateCandles, generateOrderBook, CandleData, OrderBookEntry } from '../../services/marketData';
import { StoreService } from '../../services/store';
import { formatCurrency, translations } from '../../services/translations';

interface TradingTerminalProps {
  user: ClientUser;
  markets: MarketAsset[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  currentCurrency: string;
  currentLanguage: string;
}

export const TradingTerminal: React.FC<TradingTerminalProps> = ({
  user,
  markets,
  selectedSymbol,
  onSelectSymbol,
  currentCurrency,
  currentLanguage
}) => {
  const currentAsset = markets.find((m) => m.symbol === selectedSymbol) || markets[0];
  const t = translations[currentLanguage] || translations.en;

  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1D'>('5m');
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [orderBook, setOrderBook] = useState<{ bids: OrderBookEntry[]; asks: OrderBookEntry[] }>({
    bids: [],
    asks: []
  });
  const [recentTrades, setRecentTrades] = useState<Array<{ price: number; amount: number; time: string; type: 'buy' | 'sell' }>>([]);

  // Order Placement State
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [leverage, setLeverage] = useState<number>(10);
  const [orderAmount, setOrderAmount] = useState<string>('500');
  const [limitPrice, setLimitPrice] = useState<string>(currentAsset.price.toString());
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [activeTrades, setActiveTrades] = useState<TradeOrder[]>([]);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);
  const [orderErrorMsg, setOrderErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize candles & order book
  useEffect(() => {
    const initialCandles = generateCandles(currentAsset.price, 36);
    setCandles(initialCandles);
    setOrderBook(generateOrderBook(currentAsset.price));

    // Seed recent trades
    const trades = [];
    for (let i = 0; i < 8; i++) {
      const isBuy = Math.random() > 0.48;
      trades.push({
        price: currentAsset.price + (Math.random() - 0.5) * (currentAsset.price * 0.001),
        amount: Number((Math.random() * 0.8 + 0.05).toFixed(3)),
        time: new Date(Date.now() - i * 4000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: isBuy ? 'buy' : 'sell'
      });
    }
    setRecentTrades(trades);
    setLimitPrice(currentAsset.price.toFixed(currentAsset.price > 10 ? 2 : 4));
  }, [selectedSymbol]);

  // Live order book & trades dynamic fluctuation tick
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderBook(generateOrderBook(currentAsset.price));

      // Append trade
      const isBuy = Math.random() > 0.46;
      const newTrade = {
        price: currentAsset.price + (Math.random() - 0.5) * (currentAsset.price * 0.0005),
        amount: Number((Math.random() * 0.5 + 0.02).toFixed(3)),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: isBuy ? ('buy' as const) : ('sell' as const)
      };
      setRecentTrades((prev) => [newTrade, ...prev.slice(0, 11)]);
    }, 1800);

    return () => clearInterval(interval);
  }, [currentAsset.price]);

  // Sync user active open trades
  useEffect(() => {
    const unsubscribe = StoreService.subscribe((state) => {
      const userTrades = state.trades.filter((t) => t.userId === user.id && t.status === 'OPEN');
      setActiveTrades(userTrades);
    });
    return unsubscribe;
  }, [user.id]);

  // Render Candlestick Chart via HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const width = canvas.parentElement?.clientWidth || 700;
    const height = 360;
    canvas.width = width * 2;
    canvas.height = height * 2;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(2, 2);

    ctx.clearRect(0, 0, width, height);

    if (candles.length === 0) return;

    // Find min & max
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    candles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    });

    const padding = (maxPrice - minPrice) * 0.1 || 10;
    minPrice -= padding;
    maxPrice += padding;

    // Background grid lines
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = (height - 35) * (i / gridLines) + 15;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width - 65, y);
      ctx.stroke();

      const priceVal = maxPrice - (i / gridLines) * (maxPrice - minPrice);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        priceVal > 10 ? priceVal.toFixed(2) : priceVal.toFixed(4),
        width - 60,
        y + 3
      );
    }

    // Candle layout
    const chartWidth = width - 70;
    const candleWidth = Math.max(4, Math.floor(chartWidth / candles.length) - 3);

    candles.forEach((candle, idx) => {
      const x = idx * (chartWidth / candles.length) + 15;
      const isBullish = candle.close >= candle.open;

      const yHigh = 15 + ((maxPrice - candle.high) / (maxPrice - minPrice)) * (height - 50);
      const yLow = 15 + ((maxPrice - candle.low) / (maxPrice - minPrice)) * (height - 50);
      const yOpen = 15 + ((maxPrice - candle.open) / (maxPrice - minPrice)) * (height - 50);
      const yClose = 15 + ((maxPrice - candle.close) / (maxPrice - minPrice)) * (height - 50);

      const topY = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

      // Wick
      ctx.strokeStyle = isBullish ? '#10b981' : '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, yHigh);
      ctx.lineTo(x + candleWidth / 2, yLow);
      ctx.stroke();

      // Candle body
      ctx.fillStyle = isBullish ? '#10b981' : '#f43f5e';
      ctx.fillRect(x, topY, candleWidth, bodyHeight);

      // Volume bar at bottom
      const maxVol = 70000;
      const volHeight = Math.min(30, (candle.volume / maxVol) * 30);
      ctx.fillStyle = isBullish ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)';
      ctx.fillRect(x, height - 20 - volHeight, candleWidth, volHeight);
    });

    // Current price dashed line
    const curY = 15 + ((maxPrice - currentAsset.price) / (maxPrice - minPrice)) * (height - 50);
    ctx.strokeStyle = currentAsset.change24h >= 0 ? '#10b981' : '#f43f5e';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, curY);
    ctx.lineTo(width - 65, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Price badge
    ctx.fillStyle = currentAsset.change24h >= 0 ? '#10b981' : '#f43f5e';
    ctx.fillRect(width - 64, curY - 10, 60, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      currentAsset.price > 10 ? currentAsset.price.toFixed(2) : currentAsset.price.toFixed(4),
      width - 34,
      curY + 3
    );
  }, [candles, currentAsset.price, currentAsset.change24h]);

  const handleExecuteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderErrorMsg(null);
    setOrderSuccessMsg(null);
    const parsedAmount = parseFloat(orderAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setOrderErrorMsg('Please enter a valid margin amount');
      return;
    }

    if (parsedAmount > user.balance) {
      setOrderErrorMsg('Insufficient account balance. Please make a deposit or reduce position size.');
      return;
    }

    const execPrice = orderType === 'MARKET' ? currentAsset.price : parseFloat(limitPrice) || currentAsset.price;

    StoreService.openTrade({
      userId: user.id,
      symbol: currentAsset.symbol,
      type: orderSide,
      orderType,
      amount: parsedAmount,
      leverage,
      entryPrice: execPrice,
      currentPrice: execPrice,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined
    });

    setOrderSuccessMsg(`Successfully opened ${leverage}x ${orderSide} position for ${currentAsset.symbol}`);
    setTimeout(() => setOrderSuccessMsg(null), 4000);
  };

  const handleClosePosition = (tradeId: string) => {
    StoreService.closeTrade(tradeId, currentAsset.price);
  };

  const isUp = currentAsset.change24h >= 0;

  return (
    <div className="space-y-4">
      {/* Top Asset Header Bar */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              id="symbol-selector"
              value={selectedSymbol}
              onChange={(e) => onSelectSymbol(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white font-bold text-base rounded-xl px-4 py-2 pr-8 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {markets.map((m) => (
                <option key={m.symbol} value={m.symbol}>
                  {m.name} ({m.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400">Live Index Price</div>
            <div
              className={`text-2xl font-black font-mono tracking-tight flex items-center gap-2 ${
                isUp ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              <span>
                ${currentAsset.price > 10 ? currentAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : currentAsset.price.toFixed(4)}
              </span>
              {isUp ? (
                <span className="flex items-center text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  <ArrowUp className="w-3.5 h-3.5 mr-0.5" /> +{currentAsset.change24h.toFixed(2)}%
                </span>
              ) : (
                <span className="flex items-center text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                  <ArrowDown className="w-3.5 h-3.5 mr-0.5" /> {currentAsset.change24h.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 24h Stats */}
        <div className="hidden lg:flex items-center gap-6 text-xs font-mono">
          <div>
            <div className="text-slate-400 uppercase text-[10px]">24h High</div>
            <div className="text-white font-semibold">${currentAsset.high24h.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-slate-400 uppercase text-[10px]">24h Low</div>
            <div className="text-white font-semibold">${currentAsset.low24h.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-slate-400 uppercase text-[10px]">24h Volume (USD)</div>
            <div className="text-white font-semibold">${(currentAsset.volume24h / 1e9).toFixed(2)}B</div>
          </div>
          <div>
            <div className="text-slate-400 uppercase text-[10px]">Tier-1 Liquidity</div>
            <div className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Ultra-Deep
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="text-slate-400 uppercase text-[10px]">Match Engine</div>
            <div className="text-cyan-400 font-mono font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              v8.3 Pro (&lt;0.2ms)
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart + Order Book + Order Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (8 cols): Candlestick Chart */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
            {/* Chart Toolbar */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/60 flex-wrap gap-2">
              <div className="flex items-center gap-1">
                {(['1m', '5m', '15m', '1h', '1D'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      timeframe === tf
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Bullish Green
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Bearish Red
                </span>
              </div>
            </div>

            {/* Canvas Chart */}
            <div className="w-full relative h-[360px] bg-slate-950/80 rounded-xl overflow-hidden border border-slate-800/40">
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>
          </div>

          {/* Active Positions Table */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>{t.openPositions} ({activeTrades.length})</span>
              </div>
              <div className="text-xs text-slate-400">Calculated in real-time with zero latency</div>
            </div>

            {activeTrades.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-950/50 rounded-xl border border-slate-800/40">
                No active open trades. Place an order on the right panel to begin trading.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800/80 uppercase text-[10px] tracking-wider">
                      <th className="pb-2">Market</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Leverage</th>
                      <th className="pb-2">Margin Amount</th>
                      <th className="pb-2">Entry Price</th>
                      <th className="pb-2">Current Price</th>
                      <th className="pb-2">Unrealized P&L</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {activeTrades.map((trade) => {
                      const diff =
                        trade.type === 'BUY'
                          ? (currentAsset.price - trade.entryPrice) / trade.entryPrice
                          : (trade.entryPrice - currentAsset.price) / trade.entryPrice;
                      const livePnl = Number((trade.amount * trade.leverage * diff).toFixed(2));
                      const livePnlPct = Number((diff * trade.leverage * 100).toFixed(2));
                      const isProfit = livePnl >= 0;

                      return (
                        <tr key={trade.id} className="text-slate-200">
                          <td className="py-3 font-semibold text-white">{trade.symbol}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                trade.type === 'BUY'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {trade.type}
                            </span>
                          </td>
                          <td className="py-3 font-mono font-bold text-amber-400">{trade.leverage}x</td>
                          <td className="py-3 font-mono">${trade.amount.toLocaleString()}</td>
                          <td className="py-3 font-mono">${trade.entryPrice.toLocaleString()}</td>
                          <td className="py-3 font-mono">${currentAsset.price.toLocaleString()}</td>
                          <td className="py-3">
                            <div className={`font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isProfit ? '+' : ''}${livePnl.toFixed(2)} ({isProfit ? '+' : ''}{livePnlPct.toFixed(2)}%)
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleClosePosition(trade.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-600/80 text-white text-[11px] font-semibold transition-colors"
                            >
                              {t.closePosition}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Live Order Book + Buy/Sell Execution */}
        <div className="lg:col-span-4 space-y-4">
          {/* Order Placement Form */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
            {/* Long / Short Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl mb-4 border border-slate-800">
              <button
                type="button"
                id="btn-order-buy"
                onClick={() => setOrderSide('BUY')}
                className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  orderSide === 'BUY'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUp className="w-3.5 h-3.5" />
                {t.buyLong}
              </button>
              <button
                type="button"
                id="btn-order-sell"
                onClick={() => setOrderSide('SELL')}
                className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  orderSide === 'SELL'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDown className="w-3.5 h-3.5" />
                {t.sellShort}
              </button>
            </div>

            {/* Order Type (Market / Limit) */}
            <div className="flex items-center justify-between text-xs mb-3 text-slate-400">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('MARKET')}
                  className={`px-2 py-1 rounded font-semibold ${
                    orderType === 'MARKET' ? 'bg-slate-800 text-white' : 'hover:text-slate-200'
                  }`}
                >
                  {t.marketOrder}
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('LIMIT')}
                  className={`px-2 py-1 rounded font-semibold ${
                    orderType === 'LIMIT' ? 'bg-slate-800 text-white' : 'hover:text-slate-200'
                  }`}
                >
                  {t.limitOrder}
                </button>
              </div>

              <div className="text-[11px] text-slate-400">
                Avail: <span className="font-mono text-white font-semibold">${user.balance.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleExecuteOrder} className="space-y-3">
              {/* Limit Price Input if Limit */}
              {orderType === 'LIMIT' && (
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold mb-1 block">Limit Price (USD)</label>
                  <input
                    type="number"
                    step="any"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Leverage Selector */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
                  <span>Leverage Multiplier</span>
                  <span className="font-bold text-amber-400 font-mono">{leverage}x</span>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {[1, 5, 10, 25, 50, 100].map((lev) => (
                    <button
                      key={lev}
                      type="button"
                      onClick={() => setLeverage(lev)}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                        leverage === lev
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Margin Amount */}
              <div>
                <label className="text-[11px] text-slate-400 font-semibold mb-1 block">
                  Margin Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">$</span>
                  <input
                    id="order-amount-input"
                    type="number"
                    min="10"
                    step="10"
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Quick % buttons */}
                <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                  {[0.25, 0.5, 0.75, 1.0].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        const calculated = Math.floor(user.balance * pct);
                        setOrderAmount(calculated.toString());
                      }}
                      className="py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-300"
                    >
                      {pct * 100}%
                    </button>
                  ))}
                </div>
              </div>

              {/* TP / SL Row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Take Profit (USD)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Optional"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Stop Loss (USD)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Optional"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Position Summary */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Nominal Value:</span>
                  <span className="text-white font-semibold">
                    ${((parseFloat(orderAmount) || 0) * leverage).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Execution Fee:</span>
                  <span className="text-emerald-400 font-semibold">0.00% (Zero-Fee VIP)</span>
                </div>
              </div>

              {/* Order Confirmation Banner */}
              {orderSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{orderSuccessMsg}</span>
                </div>
              )}

              {orderErrorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{orderErrorMsg}</span>
                </div>
              )}

              {/* Submit Execution Button */}
              <button
                type="submit"
                id="execute-trade-button"
                className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all shadow-xl flex items-center justify-center gap-2 ${
                  orderSide === 'BUY'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-500/20'
                }`}
              >
                <Zap className="w-4 h-4" />
                {orderSide === 'BUY' ? `${t.buyLong} ${currentAsset.symbol}` : `${t.sellShort} ${currentAsset.symbol}`}
              </button>
            </form>
          </div>

          {/* Live Order Book & Real-Time Trades */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Order Book (L2 Depth)
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Spread: 0.04%</div>
            </div>

            {/* Asks (Red / Sell orders) */}
            <div className="space-y-1 text-xs font-mono mb-2">
              {orderBook.asks.slice(0, 4).reverse().map((ask, idx) => (
                <div key={idx} className="flex justify-between items-center text-rose-400 px-1 py-0.5 rounded bg-rose-500/5">
                  <span>${ask.price.toFixed(2)}</span>
                  <span className="text-slate-400">{ask.size}</span>
                  <span className="text-slate-500">{ask.total}</span>
                </div>
              ))}
            </div>

            {/* Mid Price Spread Bar */}
            <div className="py-1 px-2 rounded-lg bg-slate-950 border border-slate-800 text-center font-mono font-black text-sm my-1 flex items-center justify-center gap-2">
              <span className={isUp ? 'text-emerald-400' : 'text-rose-400'}>
                ${currentAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Mark Price</span>
            </div>

            {/* Bids (Green / Buy orders) */}
            <div className="space-y-1 text-xs font-mono mt-2">
              {orderBook.bids.slice(0, 4).map((bid, idx) => (
                <div key={idx} className="flex justify-between items-center text-emerald-400 px-1 py-0.5 rounded bg-emerald-500/5">
                  <span>${bid.price.toFixed(2)}</span>
                  <span className="text-slate-400">{bid.size}</span>
                  <span className="text-slate-500">{bid.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
