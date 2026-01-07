import crypto from "crypto";

// Use a fallback for development; in production, this should be a 32-character string
const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || "haseeb-expense-tracker-secret-key-32";
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

/**
 * Encrypts a string or number using AES-256-CBC with Server Key only.
 * Returns a string in the format "iv:ciphertext"
 */
export function encrypt(data: string | number): string {
    if (data === undefined || data === null || data === "") return "";
    const text = data.toString();

    try {
        const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        return iv.toString("hex") + ":" + encrypted.toString("hex");
    } catch (error) {
        console.error("Encryption error:", error);
        return data.toString();
    }
}

/**
 * Decrypts a string in the "iv:ciphertext" format using Server Key only.
 */
export function decrypt(text: string): string {
    if (!text || !text.includes(":")) return text;

    // Treat v2 data as unreadable/legacy - return empty
    if (text.startsWith("v2:")) return "";

    try {
        const dataToDecrypt = text;

        const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
        const parts = dataToDecrypt.split(":");
        const iv = Buffer.from(parts.shift() || "", "hex");
        const encryptedText = Buffer.from(parts.join(":"), "hex");

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch (error) {
        return text;
    }
}

/**
 * Safely decrypts a value and returns it as a number.
 * Returns 0 if decryption or parsing fails.
 */
export function decryptNumber(text: string | number | undefined): number {
    if (text === undefined || text === null || text === "") return 0;
    if (typeof text === 'number') return text;

    const decrypted = decrypt(text.toString());
    const num = Number(decrypted);

    if (isNaN(num)) return 0;

    return num;
}

/**
 * Server-Side Encryption helper for transactions.
 */
export function encryptTransactionDetails(description: string, amount: number) {
    return {
        encryptedDescription: encrypt(description),
        encryptedAmount: encrypt(amount),
    };
}
