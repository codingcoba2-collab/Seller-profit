// 3D Model & Buffer Validation Utility (GLB, GLTF, and Image format detector)

export interface ModelValidationResult {
  valid: boolean;
  buffer: ArrayBuffer;
  format?: 'glb' | 'gltf-json';
  isImage: boolean;
  imageFormat?: 'webp' | 'png' | 'jpeg' | 'image';
  error?: string;
}

/**
 * Inspects an ArrayBuffer to determine if it is a valid 3D model (GLB or glTF JSON),
 * an image (WebP, PNG, JPEG), or corrupt/unsupported data.
 * Prevents Three.js GLTFLoader from attempting JSON.parse on binary formats like WebP (RIFF header).
 */
export function inspect3DBuffer(rawBuffer: ArrayBuffer): ModelValidationResult {
  if (!rawBuffer || rawBuffer.byteLength < 4) {
    return { valid: false, buffer: rawBuffer || new ArrayBuffer(0), isImage: false, error: 'File kosong atau ukuran data terlalu kecil.' };
  }

  const bytes = new Uint8Array(rawBuffer);

  // 1. Check if binary GLB: magic header 'glTF' (0x46546C67 -> 103, 108, 84, 70)
  if (bytes.length >= 4 && bytes[0] === 103 && bytes[1] === 108 && bytes[2] === 84 && bytes[3] === 70) {
    return { valid: true, buffer: rawBuffer, isImage: false, format: 'glb' };
  }

  // 2. Check if RIFF format (WebP image or WAV/AVI)
  // 'R', 'I', 'F', 'F' = 82, 73, 70, 70
  if (bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70) {
    // Check if WEBP ('W', 'E', 'B', 'P' = 87, 69, 66, 80 at offset 8)
    if (bytes.length >= 12 && bytes[8] === 87 && bytes[9] === 69 && bytes[10] === 66 && bytes[11] === 80) {
      return {
        valid: false,
        buffer: rawBuffer,
        isImage: true,
        imageFormat: 'webp',
        error: 'File yang dipilih adalah format gambar WEBP (2D), bukan model 3D GLB.',
      };
    }
    return {
      valid: false,
      buffer: rawBuffer,
      isImage: false,
      error: 'File menggunakan format RIFF audio/video, bukan model 3D GLB.',
    };
  }

  // 3. Check if PNG: \x89PNG (137, 80, 78, 71)
  if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) {
    return {
      valid: false,
      buffer: rawBuffer,
      isImage: true,
      imageFormat: 'png',
      error: 'File yang dipilih adalah format gambar PNG (2D), bukan model 3D GLB.',
    };
  }

  // 4. Check if JPEG: 0xFF, 0xD8, 0xFF (255, 216, 255)
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    return {
      valid: false,
      buffer: rawBuffer,
      isImage: true,
      imageFormat: 'jpeg',
      error: 'File yang dipilih adalah format gambar JPG (2D), bukan model 3D GLB.',
    };
  }

  // 5. Check if Base64 encoded or Data URI text containing a GLB
  try {
    const textSnippet = new TextDecoder('utf-8').decode(bytes.slice(0, 500)).trim();

    // Data URI base64
    if (textSnippet.startsWith('data:') && textSnippet.includes('base64,')) {
      const fullText = new TextDecoder('utf-8').decode(bytes);
      const b64Data = fullText.substring(fullText.indexOf('base64,') + 7).trim();
      const binaryString = atob(b64Data);
      if (
        binaryString.charCodeAt(0) === 103 &&
        binaryString.charCodeAt(1) === 108 &&
        binaryString.charCodeAt(2) === 84 &&
        binaryString.charCodeAt(3) === 70
      ) {
        const len = binaryString.length;
        const out = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          out[i] = binaryString.charCodeAt(i);
        }
        return { valid: true, buffer: out.buffer, isImage: false, format: 'glb' };
      }
    }

    // Pure base64
    if (/^[A-Za-z0-9+/=]{20,}/.test(textSnippet)) {
      const fullText = new TextDecoder('utf-8').decode(bytes).trim();
      const binaryString = atob(fullText);
      if (
        binaryString.charCodeAt(0) === 103 &&
        binaryString.charCodeAt(1) === 108 &&
        binaryString.charCodeAt(2) === 84 &&
        binaryString.charCodeAt(3) === 70
      ) {
        const len = binaryString.length;
        const out = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          out[i] = binaryString.charCodeAt(i);
        }
        return { valid: true, buffer: out.buffer, isImage: false, format: 'glb' };
      }
    }

    // 6. Check if JSON glTF
    if (textSnippet.startsWith('{')) {
      const fullText = new TextDecoder('utf-8').decode(bytes);
      const parsed = JSON.parse(fullText);
      if (parsed && typeof parsed === 'object' && parsed.asset) {
        return { valid: true, buffer: rawBuffer, isImage: false, format: 'gltf-json' };
      }
    }
  } catch {}

  return {
    valid: false,
    buffer: rawBuffer,
    isImage: false,
    error: 'Format data tidak sesuai dengan spesifikasi 3D GLTF / GLB binary.',
  };
}
