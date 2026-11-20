import * as jose from "jose";

export async function generateZhipuToken(apiKey: string) {
    const [id, secret] = apiKey.split(".");
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = {
        api_key: id,
        exp: timestamp + 3600, // 1 hour
        timestamp: timestamp,
    };
    const secretKey = new TextEncoder().encode(secret);
    const token = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: "HS256", sign_type: "SIGN" })
        .sign(secretKey);
    return token;
}

const CANDIDATE_MODELS = ["glm-4.5-flash", "glm-4.7-flash"];

interface ChatOptions {
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
}

function extractJson(content: string) {
    const cleaned = content.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        // Fallback: search for outermost { ... } or [ ... ]
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            try {
                return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
            } catch {}
        }

        const firstBracket = cleaned.indexOf("[");
        const lastBracket = cleaned.lastIndexOf("]");
        if (firstBracket !== -1 && lastBracket > firstBracket) {
            try {
                return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
            } catch {}
        }

        throw new Error("AI returned invalid JSON format. Please try again.");
    }
}

async function callZhipuChat(options: ChatOptions): Promise<string> {
    const apiKey = process.env.ZHIPU_AI_API_KEY;
    if (!apiKey) throw new Error("ZHIPU_AI_API_KEY is not set");

    const token = await generateZhipuToken(apiKey);
    let lastError: any = null;

    for (const model of CANDIDATE_MODELS) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        model,
                        messages: options.messages,
                        temperature: options.temperature ?? 0.1,
                        thinking: { type: "disabled" }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content;
                    if (content) {
                        return content;
                    }
                } else {
                    const errorText = await response.text();
                    console.warn(`Zhipu AI (${model}) attempt ${attempt + 1} status ${response.status}:`, errorText);
                    lastError = new Error(`AI Service Error (${response.status}): ${errorText}`);

                    // High traffic/rate limit (429 / code 1305) or server error: delay briefly before retry or switch to fallback
                    if (response.status === 429 || response.status >= 500) {
                        await new Promise((r) => setTimeout(r, 600));
                        continue;
                    }
                    break;
                }
            } catch (err: any) {
                console.warn(`Zhipu AI (${model}) network error:`, err);
                lastError = err;
                await new Promise((r) => setTimeout(r, 500));
            }
        }
    }

    throw lastError || new Error("AI service is currently busy. Please try again in a moment.");
}

export async function parseTransactionWithAI(text: string, categories: any[], accounts: any[], localDate?: string) {
    const today = localDate || new Date().toISOString().split("T")[0];

    const categoryNames = categories.map((c) => c.name).join(", ");
    const accountNames = accounts.map((a) => a.name).join(", ");

    const systemPrompt = `You are a financial assistant for an app called Haseeb. Your goal is to extract transaction details from user voice transcripts. 
Extract the following fields in JSON format:
- amount: (number)
- category: (string, match one of these if possible: ${categoryNames}. Ignore for transfers)
- account: (string, match one of these if possible: ${accountNames}. For transfers, this is the SOURCE account)
- toAccount: (string, ONLY for transfers, match one of these: ${accountNames}. This is the DESTINATION account)
- type: (string, either 'expense', 'income', or 'transfer')
- description: (string, brief summary)
- date: (string, YYYY-MM-DD, defaults to today ${today} if not mentioned)
- isZakat: (boolean, set to true ONLY if the user explicitly mentions "zakat" or implies this is a zakat payment)

A 'transfer' is when money moves between two accounts. Example: "Transfer 100 from Wallet to Savings" should result in type: "transfer", account: "Wallet", toAccount: "Savings", amount: 100.
Example: "I paid 500 for zakat" -> type: "expense", category: "Zakat", isZakat: true.

IMPORTANT: Output ONLY the raw JSON object. Do not include markdown code blocks or any other text.`;

    const content = await callZhipuChat({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text }
        ],
        temperature: 0.1
    });

    return extractJson(content);
}

export async function getSmartInsights(expenses: any[], categories: any[], currencySymbol: string = "$", localDate?: string, extraContext?: { zakat?: any; liabilities?: any }) {
    const today = localDate || new Date().toISOString().split("T")[0];

    // Prepare data summary for AI
    const categorySummary = expenses.reduce((acc: any, curr: any) => {
        if (curr.type === "expense") {
            const catName = curr.categories?.name || "Uncategorized";
            acc[catName] = (acc[catName] || 0) + Number(curr.amount);
        }
        return acc;
    }, {});

    const totalSpent = Object.values(categorySummary).reduce((a: any, b: any) => a + Number(b), 0);

    // Get a subset of transactions for context
    const recentTransactions = expenses.slice(0, 15).map((tx) => ({
        amount: tx.amount,
        category: tx.categories?.name,
        description: tx.description,
        date: tx.date,
        type: tx.type,
        necessity: tx.necessity_level
    }));

    const systemPrompt = `You are "Haseeb AI", a brilliant and empathetic financial advisor. Your mission is to analyze spending patterns and provide high-value, personalized insights.

Guidelines:
1. FOCUS ON POSITIVE REINFORCEMENT: If the user spends on Charity, Health, Education, or Savings, celebrate it enthusiastically.
2. IDENTIFY TRENDS: Notice if spending in a certain category is high or increasing.
3. BE ACTIONABLE: Provide 1-2 practical tips to save money based on the data.
4. TONE: Warm, encouraging, and sophisticated.
5. NO PLACEHOLDERS: Use the actual data provided.
6. CURRENCY: Use ${currencySymbol} for all monetary references.
7. PRIORITIZE OBLIGATIONS: If the user has outstanding Zakat or Liabilities (debts), and you see "unnecessary" spending, create an insight advising them to cut down on those expenses to fulfill their obligations sooner.

Output MUST be a JSON array of exactly 3 insight objects.
Each object must have:
- "title": (string) Short, punchy title.
- "insight": (string) 1-2 sentences of analysis and advice.
- "type": (string) "positive" (celebratory), "warning" (overspending/concern), or "info" (general tip).
- "icon": (string) MUST be one of these Lucide icon names: "Heart", "Zap", "TrendingDown", "Lightbulb", "Target", "Star", "Shield", "Wallet".

Output ONLY the raw JSON array. No markdown.`;

    const userPrompt = `Data for analysis:
Total Expenses: ${totalSpent}
Spending by Category: ${JSON.stringify(categorySummary)}
Recent Activity: ${JSON.stringify(recentTransactions)}
Current Date: ${today}
${extraContext?.zakat ? `Zakat Status: ${JSON.stringify(extraContext.zakat)}` : ""}
${extraContext?.liabilities ? `Liabilities Info: ${JSON.stringify(extraContext.liabilities)}` : ""}`;

    try {
        const content = await callZhipuChat({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7
        });

        return extractJson(content);
    } catch (err) {
        console.error("AI Insights Error:", err);
        return [
            {
                title: "Keep Tracking!",
                insight: "Continue logging your expenses to unlock personalized AI insights and optimize your financial health.",
                type: "info",
                icon: "Zap"
            }
        ];
    }
}
