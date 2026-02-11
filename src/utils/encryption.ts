import { Location } from '../types';

/**
 * Encrypts location data using AES-GCM with a key derived from the game code.
 * This ensures that even if Firestore is compromised, location data remains protected.
 */

// Convert string to ArrayBuffer
function stringToBuffer(str: string): ArrayBuffer {
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(str);
    return uint8Array.buffer as ArrayBuffer;
}

// Convert ArrayBuffer to base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Convert base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Derive an encryption key from the game code using PBKDF2
async function deriveKey(gameCode: string, salt: ArrayBuffer): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        stringToBuffer(gameCode),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

export interface EncryptedLocation {
    encrypted: string; // Base64 encoded encrypted data
    iv: string;        // Base64 encoded initialization vector
    salt: string;      // Base64 encoded salt for key derivation
}

/**
 * Encrypts a location object using the game code as the encryption key source.
 * @param location - The location to encrypt
 * @param gameCode - The game code used to derive the encryption key
 * @returns Encrypted location data
 */
export async function encryptLocation(
    location: Location,
    gameCode: string
): Promise<EncryptedLocation> {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive key from game code
    const key = await deriveKey(gameCode, salt.buffer);

    // Encrypt the location data
    const locationString = JSON.stringify(location);
    const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        stringToBuffer(locationString)
    );

    return {
        encrypted: arrayBufferToBase64(encryptedData),
        iv: arrayBufferToBase64(iv.buffer),
        salt: arrayBufferToBase64(salt.buffer),
    };
}

/**
 * Decrypts an encrypted location object using the game code.
 * @param encryptedLocation - The encrypted location data
 * @param gameCode - The game code used to derive the decryption key
 * @returns The decrypted location
 */
export async function decryptLocation(
    encryptedLocation: EncryptedLocation,
    gameCode: string
): Promise<Location> {
    const salt = base64ToArrayBuffer(encryptedLocation.salt);
    const iv = base64ToArrayBuffer(encryptedLocation.iv);
    const encryptedData = base64ToArrayBuffer(encryptedLocation.encrypted);

    // Derive key from game code
    const key = await deriveKey(gameCode, salt);

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
    );

    const locationString = new TextDecoder().decode(decryptedData);
    return JSON.parse(locationString) as Location;
}

/**
 * Checks if a location object is encrypted
 */
export function isEncryptedLocation(loc: unknown): loc is EncryptedLocation {
    return (
        typeof loc === 'object' &&
        loc !== null &&
        'encrypted' in loc &&
        'iv' in loc &&
        'salt' in loc
    );
}
