import { MarketAsset } from '../types';

export const INITIAL_MARKETS: MarketAsset[] = [
  {
    symbol: 'BTC/USD',
    baseAsset: 'BTC',
    quoteAsset: 'USD',
    name: 'Bitcoin',
    price: 94820.50,
    previousPrice: 94650.00,
    change24h: 3.42,
    high24h: 96150.00,
    low24h: 93400.00,
    volume24h: 38421000000,
    trend: 'up',
    history: [93400, 93800, 94200, 94000, 94600, 94450, 94820.50]
  },
  {
    symbol: 'ETH/USD',
    baseAsset: 'ETH',
    quoteAsset: 'USD',
    name: 'Ethereum',
    price: 3415.80,
    previousPrice: 3380.20,
    change24h: 2.15,
    high24h: 3490.00,
    low24h: 3320.00,
    volume24h: 19800000000,
    trend: 'up',
    history: [3320, 3350, 3390, 3370, 3405, 3395, 3415.80]
  },
  {
    symbol: 'SOL/USD',
    baseAsset: 'SOL',
    quoteAsset: 'USD',
    name: 'Solana',
    price: 218.45,
    previousPrice: 221.10,
    change24h: -1.20,
    high24h: 226.50,
    low24h: 214.00,
    volume24h: 8400000000,
    trend: 'down',
    history: [214, 219, 224, 222, 225, 220, 218.45]
  },
  {
    symbol: 'XRP/USD',
    baseAsset: 'XRP',
    quoteAsset: 'USD',
    name: 'Ripple',
    price: 2.4850,
    previousPrice: 2.3920,
    change24h: 4.88,
    high24h: 2.5600,
    low24h: 2.3400,
    volume24h: 6720000000,
    trend: 'up',
    history: [2.34, 2.38, 2.42, 2.40, 2.46, 2.45, 2.4850]
  },
  {
    symbol: 'BNB/USD',
    baseAsset: 'BNB',
    quoteAsset: 'USD',
    name: 'BNB Chain',
    price: 684.20,
    previousPrice: 682.00,
    change24h: 0.85,
    high24h: 692.00,
    low24h: 675.00,
    volume24h: 2150000000,
    trend: 'up',
    history: [675, 679, 683, 680, 685, 682, 684.20]
  },
  {
    symbol: 'DOGE/USD',
    baseAsset: 'DOGE',
    quoteAsset: 'USD',
    name: 'Dogecoin',
    price: 0.2845,
    previousPrice: 0.2890,
    change24h: -1.55,
    high24h: 0.2980,
    low24h: 0.2780,
    volume24h: 3100000000,
    trend: 'down',
    history: [0.278, 0.283, 0.291, 0.287, 0.294, 0.288, 0.2845]
  }
];

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function generateCandles(currentPrice: number, count = 40): CandleData[] {
  const candles: CandleData[] = [];
  let prevClose = currentPrice * 0.96;
  const now = Date.now();
  const stepMs = 60 * 1000; // 1 min

  for (let i = count; i >= 0; i--) {
    const timestamp = new Date(now - i * stepMs);
    const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const volatility = prevClose * 0.0035;
    const delta = (Math.random() - 0.48) * volatility;
    const open = prevClose;
    const close = i === 0 ? currentPrice : Math.max(open + delta, 0.001);
    const high = Math.max(open, close) + Math.random() * (volatility * 0.7);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.7);
    const volume = Math.floor(Math.random() * 50 + 10) * 1000;

    candles.push({
      time: timeStr,
      open,
      high,
      low,
      close,
      volume
    });
    prevClose = close;
  }
  return candles;
}

export interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

export function generateOrderBook(midPrice: number): { bids: OrderBookEntry[]; asks: OrderBookEntry[] } {
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  const spread = midPrice * 0.0004;

  let bidTotal = 0;
  for (let i = 1; i <= 7; i++) {
    const p = midPrice - spread * i - (Math.random() * midPrice * 0.0002);
    const sz = Number((Math.random() * 1.5 + 0.1).toFixed(3));
    bidTotal += sz;
    bids.push({ price: p, size: sz, total: Number(bidTotal.toFixed(3)) });
  }

  let askTotal = 0;
  for (let i = 1; i <= 7; i++) {
    const p = midPrice + spread * i + (Math.random() * midPrice * 0.0002);
    const sz = Number((Math.random() * 1.5 + 0.1).toFixed(3));
    askTotal += sz;
    asks.push({ price: p, size: sz, total: Number(askTotal.toFixed(3)) });
  }

  return { bids, asks };
}

export function tickMarketPrices(markets: MarketAsset[]): MarketAsset[] {
  return markets.map((asset) => {
    // Small realistic micro fluctuation (-0.2% to +0.2%)
    const deltaPercent = (Math.random() - 0.49) * 0.003;
    const newPrice = Number((asset.price * (1 + deltaPercent)).toFixed(asset.price < 10 ? 4 : 2));
    const isUp = newPrice >= asset.price;
    const updatedHistory = [...asset.history.slice(1), newPrice];

    return {
      ...asset,
      previousPrice: asset.price,
      price: newPrice,
      trend: isUp ? 'up' : 'down',
      high24h: Math.max(asset.high24h, newPrice),
      low24h: Math.min(asset.low24h, newPrice),
      history: updatedHistory
    };
  });
}
