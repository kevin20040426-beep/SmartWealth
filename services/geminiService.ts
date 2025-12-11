import { GoogleGenAI } from "@google/genai";
import { StockPosition, Transaction } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize specific client only when needed to handle potential missing key gracefully in UI
const getClient = () => {
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const getFinancialAdvice = async (
  transactions: Transaction[], 
  stocks: StockPosition[]
): Promise<string> => {
  const client = getClient();
  if (!client) return "請配置 API Key 以啟用 AI 財務顧問功能。";

  try {
    // Simplify data to reduce token usage
    const recentTx = transactions.slice(0, 50).map(t => `${t.date}: ${t.type} $${t.amount} (${t.category})`);
    const portfolio = stocks.map(s => `${s.symbol}: ${s.shares}股, 成本 ${s.averageCost}`);

    const prompt = `
      作為一位專業的財務顧問，請根據以下使用者的財務數據提供簡短的建議和洞察（約 150 字）。
      使用繁體中文回答。
      
      近期交易紀錄 (最近 50 筆):
      ${JSON.stringify(recentTx)}

      股票投資組合:
      ${JSON.stringify(portfolio)}

      請分析消費習慣與投資狀況，並給出建議。
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "目前無法生成建議。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 服務暫時無法使用，請稍後再試。";
  }
};

export const simulateStockMarketUpdate = async (stocks: StockPosition[]): Promise<StockPosition[]> => {
  const client = getClient();
  if (!client) {
    // Fallback Mock update if no API key
    return stocks.map(stock => ({
      ...stock,
      currentPrice: stock.currentPrice * (1 + (Math.random() * 0.1 - 0.05))
    }));
  }

  try {
    const symbols = stocks.map(s => s.symbol).join(', ');
    const prompt = `
      為以下股票代碼生成模擬的"當前市場價格"。
      這是一個模擬演示，請根據真實世界的大致股價範圍給出一個合理的數值。
      
      股票: ${symbols}

      請嚴格返回 JSON 格式，不要包含 Markdown 標記。
      格式如下:
      [
        { "symbol": "2330.TW", "price": 580 },
        { "symbol": "AAPL", "price": 175 }
      ]
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const priceData: { symbol: string, price: number }[] = JSON.parse(response.text || '[]');
    
    return stocks.map(stock => {
      const newData = priceData.find(p => p.symbol === stock.symbol);
      return newData ? { ...stock, currentPrice: newData.price } : stock;
    });

  } catch (error) {
    console.error("Stock Update Error:", error);
     // Fallback Mock update on error
     return stocks.map(stock => ({
      ...stock,
      currentPrice: stock.currentPrice * (1 + (Math.random() * 0.06 - 0.03))
    }));
  }
};