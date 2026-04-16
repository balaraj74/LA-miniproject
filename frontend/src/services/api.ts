import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface EncryptedResponse {
  image_base64: string;
  pad_h: number;
  pad_w: number;
}

export interface DecryptedResponse {
  image_base64: string;
}

export const encryptImage = async (file: File, svdKey: number, m: [number, number, number, number]): Promise<EncryptedResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('svd_key', svdKey.toString());
  formData.append('m1', m[0].toString());
  formData.append('m2', m[1].toString());
  formData.append('m3', m[2].toString());
  formData.append('m4', m[3].toString());

  const response = await axios.post(`${API_URL}/encrypt`, formData);
  return response.data;
};

export const decryptImage = async (file: File, svdKey: number, m: [number, number, number, number], padH: number, padW: number): Promise<DecryptedResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('svd_key', svdKey.toString());
  formData.append('m1', m[0].toString());
  formData.append('m2', m[1].toString());
  formData.append('m3', m[2].toString());
  formData.append('m4', m[3].toString());
  formData.append('pad_h', padH.toString());
  formData.append('pad_w', padW.toString());

  const response = await axios.post(`${API_URL}/decrypt`, formData);
  return response.data;
};
