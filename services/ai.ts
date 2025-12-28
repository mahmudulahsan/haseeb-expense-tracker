import * as jose from "jose";

export async function generateZhipuToken(apiKey: string) {
    const [id, secret] = apiKey.split(".");
    const timestamp = Date.now();
    const payload = {
        api_key: id,
        exp: timestamp + 3600000, // 1 hour
        timestamp: timestamp,
    };
    const secretKey = new TextEncoder().encode(secret);
    const token = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: "HS256", sign_type: "SIGN" })
        .sign(secretKey);
    return token;
}

export async function parseTransactionWithAI(text: string, categories: any[], accounts: any[]) {
    const apiKey = process.env.ZHIPU_AI_API_KEY;
    if (!apiKey) throw new Error("ZHIPU_AI_API_KEY is not set");

    const token = await generateZhipuToken(apiKey);

    const categoryNames = categories.map(c => c.name).join(", ");
    const accountNames = accounts.map(a => a.name).join(", ");

    const systemPrompt = `You are a financial assistant for an app called Haseeb. Your goal is to extract transaction details from user voice transcripts. 
Extract the following fields in JSON format:
- amount: (number)
- category: (string, match one of these if possible: ${categoryNames})
- account: (string, match one of these if possible: ${accountNames})
- type: (string, either 'expense' or 'income')
- description: (string, brief summary)
- date: (string, YYYY-MM-DD, defaults to today ${new Date().toISOString().split('T')[0]} if not mentioned)

IMPORTANT: Output ONLY the raw JSON object. Do not include markdown code blocks or any other text.`;

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            model: "glm-4.7",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            temperature: 0.1
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Zhipu AI Error Details:", errorText);
        throw new Error(`AI Service Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
        // Strip markdown code blocks if present
        const cleanedJSON = content.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanedJSON);
    } catch (err) {
        console.error("AI Response Parsing Error:", content);
        throw new Error("AI returned invalid data format. Please try again.");
    }
}

export async function getSmartInsights(expenses: any[], categories: any[], currencySymbol: string = "$") {
    const apiKey = process.env.ZHIPU_AI_API_KEY;
    if (!apiKey) throw new Error("ZHIPU_AI_API_KEY is not set");

    const token = await generateZhipuToken(apiKey);

    // Prepare data summary for AI
    const categorySummary = expenses.reduce((acc: any, curr: any) => {
        if (curr.type === 'expense') {
            const catName = curr.categories?.name || 'Uncategorized';
            acc[catName] = (acc[catName] || 0) + Number(curr.amount);
        }
        return acc;
    }, {});

    const totalSpent = Object.values(categorySummary).reduce((a: any, b: any) => a + Number(b), 0);

    // Get a subset of transactions for context
    const recentTransactions = expenses.slice(0, 15).map(tx => ({
        amount: tx.amount,
        category: tx.categories?.name,
        description: tx.description,
        date: tx.date,
        type: tx.type
    }));

    const systemPrompt = `You are "Haseeb AI", a brilliant and empathetic financial advisor. Your mission is to analyze spending patterns and provide high-value, personalized insights.

Guidelines:
1. FOCUS ON POSITIVE REINFORCEMENT: If the user spends on Charity, Health, Education, or Savings, celebrate it enthusiastically.
2. IDENTIFY TRENDS: Notice if spending in a certain category is high or increasing.
3. BE ACTIONABLE: Provide 1-2 practical tips to save money based on the data.
4. TONE: Warm, encouraging, and sophisticated.
5. NO PLACEHOLDERS: Use the actual data provided.
6. CURRENCY: Use ${currencySymbol} for all monetary references.

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
Current Date: ${new Date().toISOString().split('T')[0]}`;

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            model: "glm-4.7",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7
        })
    });

    if (!response.ok) {
        throw new Error("AI Service temporary unavailable");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
        const cleanedJSON = content.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanedJSON);
    } catch (err) {
        console.error("AI Insights Parsing Error:", content);
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
