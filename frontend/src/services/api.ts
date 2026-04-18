import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface MetricsData {
  entropy_original: number;
  entropy_encrypted: number;
  npcr: number;
  uaci: number;
  correlation_original: {
    horizontal: number;
    vertical: number;
    diagonal: number;
  };
  correlation_encrypted: {
    horizontal: number;
    vertical: number;
    diagonal: number;
  };
  // Note: Add histograms if needed, but since we are computing histogram on frontend 
  // or backend, let's just use what's returned here
}

export interface EncryptedResponse {
  image_base64: string;
  m_pad_h: number;
  m_pad_w: number;
  a_orig_h: number;
  a_orig_w: number;
  metrics: MetricsData;
}

export interface DecryptedResponse {
  image_base64: string;
}

export const encryptImage = async (
  file: File, 
  k1: number, 
  k2: number, 
  secretKey: string,
  matrixKey: number[][],
  arnoldIterations: number
): Promise<EncryptedResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('k1', k1.toString());
  formData.append('k2', k2.toString());
  formData.append('secret_key', secretKey);
  formData.append('matrix_key', JSON.stringify(matrixKey));
  formData.append('arnold_iterations', arnoldIterations.toString());

  const response = await axios.post(`${API_URL}/encrypt`, formData);
  return response.data;
};

export const decryptImage = async (
  file: File, 
  k1: number, 
  k2: number, 
  secretKey: string,
  matrixKey: number[][],
  arnoldIterations: number,
  m_pad_h: number,
  m_pad_w: number,
  a_orig_h: number,
  a_orig_w: number
): Promise<DecryptedResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('k1', k1.toString());
  formData.append('k2', k2.toString());
  formData.append('secret_key', secretKey);
  formData.append('matrix_key', JSON.stringify(matrixKey));
  formData.append('arnold_iterations', arnoldIterations.toString());
  formData.append('m_pad_h', m_pad_h.toString());
  formData.append('m_pad_w', m_pad_w.toString());
  formData.append('a_orig_h', a_orig_h.toString());
  formData.append('a_orig_w', a_orig_w.toString());

  const response = await axios.post(`${API_URL}/decrypt`, formData);
  return response.data;
};

export interface CompressionResult {
  compressed_image: string;
  original_size: number;
  compressed_size: number;
  compression_ratio: number;
  mse: number;
  psnr: number;
  k_used: number;
  max_k?: number;
}

export const compressImageAPI = async (file: File, k: number): Promise<CompressionResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('k', k.toString());
  const response = await axios.post(`${API_URL}/compress`, formData);
  return response.data;
};

