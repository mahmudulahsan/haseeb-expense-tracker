import crypto from "crypto";

// Use a fallback for development; in production, this should be a 32-character string
const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || "haseeb-expense-tracker-secret-key-32";
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

/**
 * Encrypts a string or number using AES-256-CBC.
 * Returns a string in the format "iv:ciphertext"
 */
export function encrypt(data: string | number): string {
    if (data === undefined || data === null || data === "") return "";
    const text = data.toString();

    try {
        // Ensure key is 32 bytes
        const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        return iv.toString("hex") + ":" + encrypted.toString("hex");
    } catch (error) {
        console.error("Encryption error:", error);
        return data.toString(); // Fallback to plaintext string if error
    }
}

/**
 * Decrypts a string in the "iv:ciphertext" format.
 */
export function decrypt(text: string): string {
    if (!text || !text.includes(":")) return text;

    try {
        const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
        const parts = text.split(":");
        const iv = Buffer.from(parts.shift() || "", "hex");
        const encryptedText = Buffer.from(parts.join(":"), "hex");

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch (error) {
        // If decryption fails, it might be plaintext already
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
