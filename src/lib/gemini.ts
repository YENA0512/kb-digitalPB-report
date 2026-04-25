import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  return process.env.GEMINI_API_KEY || null;
};

export const generateInvestmentRecommendations = async (profile: any, assets: any[]) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }

  const client = new GoogleGenAI({
    apiKey: apiKey
  });

  const prompt = `
    You are a professional Digital PB at KB Kookmin Bank. 
    Based on the following user profile (including risk appetite) and current assets, 
    provide 3-5 specific investment recommendations (stocks or funds) using real-time market trends via Google Search.
    
    [User Profile]
    Risk Appetite: ${profile.risk_appetite}
    Membership Tier: ${profile.membership_tier}
    
    [Current Assets]
    ${JSON.stringify(assets, null, 2)}

    Recommendations must strictly align with the user's risk appetite: ${profile.risk_appetite}.
    - Conservative: Focus on stability, indices, and low-risk bonds.
    - Balanced: Mix of growth and stability.
    - Aggressive: Focus on high-growth stocks, tech, and innovative funds.

    Return the response as a JSON array of objects with these fields:
    - name: Product name (e.g., Apple, KB Star US S&P500)
    - chip: Category tag (e.g., Blue-chip, Tech, Bond, Index)
    - reason: A short reason why this is recommended right NOW based on real-time market data (1 sentence)
    - score: AI confidence score (0-100)
    
    Format: JSON array of objects.
  `;

  try {
    const result = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              chip: { type: Type.STRING },
              reason: { type: Type.STRING },
              score: { type: Type.NUMBER }
            },
            required: ["name", "chip", "reason", "score"]
          }
        }
      }
    });

    const text = result.text || "[]";
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini Recommendations Error:", error);
    throw error;
  }
};

export const getMarketTrends = async () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }

  const client = new GoogleGenAI({
    apiKey: apiKey
  });

  const prompt = `
    You are a professional Financial Analyst at KB Kookmin Bank. 
    Fetch the current performance of the following sectors and major indices using Google Search:
    Sectors: Semi-conductor, Energy, Banking, Tech, Bio, EV, Consumer Goods.
    Indices: KOSPI, KOSDAQ, S&P 500, NASDAQ.

    For each sector, provide:
    - name: Sector name
    - change: Percentage change from previous close (numerical value, e.g. 1.2 or -0.5)
    - sentiment: Short sentiment summary (e.g. "Bullish due to NVDA", "Fear of rate hikes")
    
    For each index, provide:
    - name: Index name (KOSPI, KOSDAQ, S&P 500, NASDAQ)
    - values: An array of 7 numerical values representing the trend over the last 7 days/weeks.

    Return the response as a JSON object:
    {
      "sectors": [{ "name": "Semi-conductor", "change": 1.2, "sentiment": "..." }, ...],
      "indices": [{ "name": "KOSPI", "values": [2500, 2510, ...] }, ...]
    }
    Format: Strict JSON.
  `;

  try {
    const result = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sectors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  change: { type: Type.NUMBER },
                  sentiment: { type: Type.STRING }
                },
                required: ["name", "change", "sentiment"]
              }
            },
            indices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  values: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER }
                  }
                },
                required: ["name", "values"]
              }
            }
          }
        }
      }
    });

    const text = result.text || "{}";
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini Market Trends Error:", error);
    throw error;
  }
};

export const generateFinancialBriefing = async (assets: any[]) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }

  const client = new GoogleGenAI({
    apiKey: apiKey
  });

  const prompt = `
    당신은 KB국민은행의 전문 디지털 PB(Private Banker)입니다. 
    아래의 고객 자산 현황과 Google 검색을 통해 파악한 "실시간 시장 상황(주요 지수, 금리, 경제 뉴스)"을 바탕으로 고객에게 최적화된 3단계 금융 처방전(과거 복기, 현재 진단, 향후 전망)을 작성해주세요.
    
    [자산 현황]
    ${JSON.stringify(assets, null, 2)}

    응답은 반드시 아래 JSON 형식으로만 해주세요:
    {
      "past": "과거 시장 상황과 포트폴리오의 연결고리 (1문장)",
      "present": "현재 가장 주목해야 할 리스크 또는 기회 (실시간 시장 데이터 반영, 1문장)",
      "future": "구체적인 행동 지침 (1문장)",
      "sentiment": "Greed" | "Fear" | "Neutral",
      "insights": [
        { "title": "통찰 제목 (7자 이내)", "content": "짧은 분석 내용 (1문장)", "type": "tip" | "warning" }
      ]
    }

    insights는 최소 1개, 최대 2개 제공해주세요. 'type'은 긍정적이거나 추천이면 'tip', 주의나 경고면 'warning'으로 설정하세요.
    반드시 실시간 시장 상황을 검색하여 답변에 반영하고, 어떤 데이터를 참고했는지 자연스럽게 녹여내세요.
  `;

  try {
    const result = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });

    const text = result.text || "{}";
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("JSON Parsing Error:", parseError, "Raw text:", text);
      throw new Error(`AI 응답 파싱 실패 (200자): ${text.substring(0, 200)}...`);
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
