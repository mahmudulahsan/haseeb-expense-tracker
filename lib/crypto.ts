import crypto from "crypto";

// Use a fallback for development; in production, this should be a 32-character string
const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || "haseeb-expense-tracker-secret-key-32";
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

/**
 * Encrypts a string or number using AES-256-CBC.
 * Returns a string in the format "v2:iv:ciphertext" (if userKey provided) or "iv:ciphertext" (legacy)
 */
export function encrypt(data: string | number, userKey?: string): string {
    if (data === undefined || data === null || data === "") return "";
    const text = data.toString();

    try {
        // Use v2 if userKey is provided, otherwise legacy
        const baseKey = userKey ? ENCRYPTION_KEY + userKey : ENCRYPTION_KEY;
        const key = crypto.createHash("sha256").update(baseKey).digest();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        const result = iv.toString("hex") + ":" + encrypted.toString("hex");
        return userKey ? `v2:${result}` : result;
    } catch (error) {
        console.error("Encryption error:", error);
        return data.toString(); // Fallback to plaintext string if error
    }
}

/**
 * Decrypts a string in the "iv:ciphertext" or "v2:iv:ciphertext" format.
 */
export function decrypt(text: string, userKey?: string): string {
    if (!text || !text.includes(":")) return text;

    try {
        let isV2 = false;
        let dataToDecrypt = text;

        if (text.startsWith("v2:")) {
            isV2 = true;
            dataToDecrypt = text.substring(3);
        }

        // Use userKey only if it's V2 and userKey is provided
        // If it's V2 but no userKey (e.g. session expired or legacy call), it will likely fail
        const baseKey = (isV2 && userKey) ? ENCRYPTION_KEY + userKey : ENCRYPTION_KEY;

        const key = crypto.createHash("sha256").update(baseKey).digest();
        const parts = dataToDecrypt.split(":");
        const iv = Buffer.from(parts.shift() || "", "hex");
        const encryptedText = Buffer.from(parts.join(":"), "hex");

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch (error) {
        // If decryption fails, it might be plaintext already or wrong key
        return text;
    }
}

/**
 * End-to-End Encryption (E2EE) helper to handle transaction sensitive fields.
 */
export function encryptTransactionDetails(description: string, amount: number) {
    return {
        encryptedDescription: encrypt(description),
        encryptedAmount: encrypt(amount),
    };
}
