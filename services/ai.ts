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
