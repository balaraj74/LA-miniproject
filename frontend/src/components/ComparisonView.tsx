'use client';

import React from 'react';
import { Download, FileText, ArrowRight } from 'lucide-react';

interface ComparisonViewProps {
  originalUrl: string;
  compressedBase64: string;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  mse: number;
  psnr: number;
  k: number;
  format: string;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  originalUrl,
  compressedBase64,
  originalSize,
  compressedSize,
  ratio,
  mse,
  psnr,
  k,
  format
}) => {
  const compressedUrl = `data:image/${format.toLowerCase()};base64,${compressedBase64}`;

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Original Image */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">Original</h3>
            <span className="bg-gray-200 px-3 py-1 rounded-full text-sm text-gray-700">
              {formatSize(originalSize)}
            </span>
          </div>
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
            <img src={originalUrl} alt="Original" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Compressed Image */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">Compressed (k={k})</h3>
            <span className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-700 font-semibold">
              {formatSize(compressedSize)}
            </span>
          </div>
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
            <img src={compressedUrl} alt="Compressed" className="w-full h-full object-contain" />
          </div>
          <div className="flex justify-end mt-2">
            <a
              href={compressedUrl}
              download={`compressed_k${k}.${format.toLowerCase()}`}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download Compressed
            </a>
          </div>
        </div>
      </div>

      {/* Metrics Card */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-blue-500" />
          Compression Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-1">
            <span className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Ratio</span>
            <span className="text-2xl font-black text-blue-600">{ratio}:1</span>
            <p className="text-xs text-gray-400 mt-1 italic">Theoretically storage savings</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Reduction</span>
            <span className="text-2xl font-black text-green-600">
              {Math.max(0, Math.round((1 - compressedSize / originalSize) * 100))}%
            </span>
            <p className="text-xs text-gray-400 mt-1 italic">Actual file size reduction</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-gray-500 text-sm uppercase tracking-wider font-semibold">PSNR</span>
            <span className="text-2xl font-black text-purple-600">{psnr} dB</span>
            <p className="text-xs text-gray-400 mt-1 italic">Higher is better quality</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-gray-500 text-sm uppercase tracking-wider font-semibold">MSE</span>
            <span className="text-2xl font-black text-orange-600">{mse}</span>
            <p className="text-xs text-gray-400 mt-1 italic">Mean Squared Error</p>
          </div>
        </div>
      </div>
    </div>
  );
};
