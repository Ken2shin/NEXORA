export interface EncryptedPayload {
  ciphertext: string
  iv: string
}

export class CryptoService {
  private static readonly ALGORITHM = 'AES-GCM'
  private static readonly KEY_LENGTH = 256
  private static readonly IV_LENGTH = 12

  static async generateKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    )
  }

  static async exportKey(key: CryptoKey): Promise<string> {
    const raw = await window.crypto.subtle.exportKey('raw', key)
    return this.arrayBufferToBase64(raw)
  }

  static async importKey(base64Key: string): Promise<CryptoKey> {
    const raw = this.base64ToArrayBuffer(base64Key)
    return await window.crypto.subtle.importKey(
      'raw',
      raw,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    )
  }

  static async encryptText(plainText: string, key: CryptoKey): Promise<EncryptedPayload> {
    const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH))
    const encoder = new TextEncoder()
    const encoded = encoder.encode(plainText)

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv
      },
      key,
      encoded
    )

    return {
      ciphertext: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv.buffer as ArrayBuffer)
    }
  }

  static async decryptText(payload: EncryptedPayload, key: CryptoKey): Promise<string> {
    try {
      const iv = this.base64ToArrayBuffer(payload.iv)
      const data = this.base64ToArrayBuffer(payload.ciphertext)

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: new Uint8Array(iv)
        },
        key,
        data
      )

      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch {
      return '[Error de descifrado: clave no autorizada o datos corruptos]'
    }
  }

  static generateSecurePassword(length: number = 14): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const lower = 'abcdefghijkmnopqrstuvwxyz'
    const numbers = '23456789'
    const symbols = '!@#$%^&*-_+'
    const all = upper + lower + numbers + symbols

    const array = new Uint32Array(length)
    window.crypto.getRandomValues(array)

    let password = ''
    password += upper[array[0]! % upper.length]
    password += lower[array[1]! % lower.length]
    password += numbers[array[2]! % numbers.length]
    password += symbols[array[3]! % symbols.length]

    for (let i = 4; i < length; i++) {
      password += all[array[i]! % all.length]
    }

    return password
      .split('')
      .sort(() => (window.crypto.getRandomValues(new Uint8Array(1))[0]! > 128 ? 1 : -1))
      .join('')
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]!)
    }
    return window.btoa(binary)
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = window.atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }
}
