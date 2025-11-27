import { StockCandle, StockQuote, TimeRange, TradeRecord, Asset } from '../types';
import { generateMockCandles, MOCK_ANALYSIS } from '../constants';
import { GoogleGenAI } from "@google/genai";

// 簡單的事件發射器，用於全域狀態通知
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
  }

  emit(event: string, data?: any) {
    if (this.events[event]) this.events[event].forEach(l => l(data));
  }
}

export const appEvents = new EventEmitter();

// --- 環境變數處理 ---
// 注意：在 Vite 環境中，通常使用 import.meta.env，但為了兼容性，我們先嘗試 process.env (如果透過 define 注入) 或直接存取
const getEnv = (key: string) => {
    // @ts-ignore
    return (typeof process !== 'undefined' && process.env?.[key]) || (import.meta as any).env?.[key] || '';
};

const FINNHUB_KEY = getEnv('VITE_FINNHUB_API_KEY');
const GEMINI_KEY = getEnv('API_KEY'); // As per Gemini instructions
const FIREBASE_CONFIG_STR = getEnv('VITE_FIREBASE_CONFIG_STRING');

export const hasRealConfig = {
  finnhub: !!FINNHUB_KEY && FINNHUB_KEY.length > 5,
  gemini: !!GEMINI_KEY && GEMINI_KEY.length > 5,
  firebase: !!FIREBASE_CONFIG_STR && FIREBASE_CONFIG_STR.length > 10
};

// --- Firebase Mocking Wrapper ---
// 由於無法在此環境動態安裝 Firebase SDK，我們建立一個抽象層
// 如果是真實環境且有 config，理論上這裡會引入真實 SDK。
// 為了本程式碼產出的獨立性，我們在此處模擬 Firebase 的介面，
// 若使用者要接真實 Firebase，需在此處替換真實 import。

let db: any = null;

const initFirebase = () => {
  if (hasRealConfig.firebase) {
    try {
      // 這裡僅為示意，真實專案需 npm install firebase 並 import
      console.log("嘗試連接真實 Firebase (本預覽環境未安裝 SDK，將自動降級為模擬模式)");
      // const app = initializeApp(JSON.parse(FIREBASE_CONFIG_STR));
      // db = getFirestore(app);
      return false; // 強制失敗因為環境沒有 SDK
    } catch (e) {
      console.error("Firebase init failed:", e);
      return false;
    }
  }
  return false;
};

// --- Service Class ---

class DataService {
  private isMock: boolean = true;

  constructor() {
    // 預設為 Mock，若有 Key 則允許切換，但本範例為了穩定性，預設會檢查
    // 實際上由 App.tsx 控制 isMock 狀態
  }

  setMockMode(mock: boolean) {
    this.isMock = mock;
  }

  get isMockMode() {
    return this.isMock;
  }

  // --- Stock Data ---

  async getQuote(symbol: string): Promise<StockQuote> {
    if (this.isMock || !hasRealConfig.finnhub) {
      await new Promise(r => setTimeout(r, 500)); // Simulate delay
      const basePrice = Math.random() * 100 + 100;
      return {
        c: parseFloat(basePrice.toFixed(2)),
        d: parseFloat((Math.random() * 10 - 5).toFixed(2)),
        dp: parseFloat((Math.random() * 5 - 2.5).toFixed(2)),
        h: parseFloat((basePrice + 5).toFixed(2)),
        l: parseFloat((basePrice - 5).toFixed(2)),
        o: parseFloat(basePrice.toFixed(2)),
        pc: parseFloat((basePrice - 2).toFixed(2))
      };
    }

    try {
      const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
      if (!response.ok) throw new Error("API Error");
      return await response.json();
    } catch (e) {
      console.error("Finnhub Quote Error, falling back to mock", e);
      return this.getQuote(symbol); // Fallback logic
    }
  }

  async getCandles(symbol: string, range: TimeRange): Promise<StockCandle[]> {
    if (this.isMock || !hasRealConfig.finnhub) {
      await new Promise(r => setTimeout(r, 800));
      const count = range === TimeRange.Day ? 24 : range === TimeRange.Month ? 30 : 250;
      return generateMockCandles(count, 150);
    }

    try {
      // Mapping TimeRange to Finnhub resolution
      let resolution = 'D';
      let from = Math.floor(Date.now() / 1000) - 86400 * 30; // Default 1M
      const to = Math.floor(Date.now() / 1000);

      if (range === TimeRange.Day) {
        resolution = '60'; // Hourly
        from = to - 86400;
      } else if (range === TimeRange.Year) {
        resolution = 'W';
        from = to - 86400 * 365;
      }

      const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.s === 'ok') {
        return data.t.map((t: number, i: number) => ({
          t: t * 1000,
          o: data.o[i],
          h: data.h[i],
          l: data.l[i],
          c: data.c[i],
          v: data.v[i]
        }));
      } else {
        throw new Error("No data");
      }
    } catch (e) {
      console.error("Finnhub Candle Error", e);
      return generateMockCandles(30, 150);
    }
  }

  // --- Gemini AI Analysis ---

  async getAnalysis(symbol: string, quote: StockQuote): Promise<string> {
    if (this.isMock || !hasRealConfig.gemini) {
      await new Promise(r => setTimeout(r, 1500));
      return MOCK_ANALYSIS.replace('該股票', symbol);
    }

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
      // Prompt construction
      const prompt = `
        Please analyze the stock ${symbol}.
        Current Price: ${quote.c}, Change: ${quote.dp}%.
        Provide a concise summary of the stock's recent performance and investment advice.
        Strictly follow these rules:
        1. Answer in Traditional Chinese (繁體中文).
        2. Do NOT use Markdown formatting (no bold, no italics, no bullet points symbols like *, -).
        3. Use plain numbered lists like 1. 2. 3. if needed.
        4. Keep it professional but accessible.
        5. Limit to 150 words.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text || "無法取得分析結果。";
    } catch (e) {
      console.error("Gemini Error", e);
      return "AI 服務暫時無法使用，請稍後再試 (或切換至模擬模式)。";
    }
  }

  // --- Asset / Trade Management (Mock Database) ---
  // In a real app, these would call Firestore

  async saveTrade(trade: TradeRecord): Promise<void> {
    console.log("Saving Trade:", trade);
    // In Mock mode, we just log it.
    // In Real mode, this would be: await addDoc(collection(db, "trades"), trade);
    return new Promise(resolve => setTimeout(resolve, 500));
  }

  async getAssets(): Promise<Asset[]> {
     // In Real mode: Fetch from Firestore, aggregate trades
     return new Promise(resolve => setTimeout(() => resolve([]), 500));
  }
}

export const api = new DataService();