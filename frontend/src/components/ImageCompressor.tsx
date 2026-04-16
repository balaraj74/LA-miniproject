"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ArrowRight, Download, RefreshCw, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImageAPI, CompressionResult } from '../services/api';

export default function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [k, setK] = useState<number>(50);
  const [maxK, setMaxK] = useState<number>(100);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setResult(null); // Reset result when a new file is uploaded
      setError(null);
      
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      
      // Determine max k
      const img = new window.Image();
      img.onload = () => {
        const calculatedMaxK = Math.min(img.width, img.height);
        // Cap max K logic exactly as python does for overly large images
        const scaleMaxK = img.width > 1500 || img.height > 1500 
           ? Math.min(1500, calculatedMaxK) 
           : calculatedMaxK;

        setMaxK(scaleMaxK);
        setK(Math.max(1, Math.floor(scaleMaxK * 0.1))); // default to 10% k
      };
      img.src = objectUrl;
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1
  });

  const handleCompress = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await compressImageAPI(file, k);
      setResult(res);
      // Ensure slider max is synced with returned max_k if backend resized
      if (res.max_k && res.max_k !== maxK) {
          setMaxK(res.max_k);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to compress the image. Please try again or use a smaller image.");
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const handleDownload = () => {
    if (result?.compressed_image) {
      const a = document.createElement("a");
      a.href = result.compressed_image;
      a.download = `compressed-k${result.k_used}-${file?.name || 'image.jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white/5 backdrop-blur-lg rounded-2xl shadow-xl border border-white/10">
      
      {!file ? (
        <div 
          {...getRootProps()} 
          className={`w-full aspect-video md:aspect-[2.5/1] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all cursor-pointer overflow-hidden relative group
            ${isDragActive ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-600 hover:border-indigo-500 hover:bg-slate-800/40 bg-slate-800/20'}`}
        >
          <input {...getInputProps()} />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center text-center space-y-4"
          >
            <div className="p-4 bg-indigo-500/20 rounded-full text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/30 transition-all duration-300">
              <Upload className="w-10 h-10" />
            </div>
            <div>
              <p className="text-xl font-medium text-slate-200">Drag & drop your image here</p>
              <p className="text-sm text-slate-400 mt-2">or click to browse files (JPEG, PNG, WebP)</p>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="flex flex-col space-y-8">
          
          {/* Controls Section */}
          <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700 backdrop-blur-sm relative overflow-hidden">
             {/* Decorative gradient */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

             <div className="flex flex-col md:flex-row gap-6 items-center z-10 relative">
               
               {/* Selected File Chip */}
               <div className="flex items-center space-x-3 bg-slate-900/50 p-3 rounded-lg flex-1 min-w-0 w-full border border-slate-700/50">
                 <div className="p-2 bg-indigo-500/20 rounded-md shrink-0">
                   <ImageIcon className="w-5 h-5 text-indigo-400" />
                 </div>
                 <div className="flex-1 min-w-0 pr-4">
                   <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                   <p className="text-xs text-slate-400 inline-block truncate">{formatBytes(file.size)}</p>
                 </div>
                 <button 
                   onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewUrl(null); setResult(null); }}
                   className="text-xs font-semibold px-3 py-1.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors shrink-0"
                 >
                   Clear
                 </button>
               </div>

               {/* Compression Slider */}
               <div className="flex-[2] w-full flex flex-col justify-center space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <label className="text-slate-300 font-medium">Singular Values (k): <span className="text-indigo-400 font-bold">{k}</span></label>
                    <span className="text-slate-500 text-xs">Max: {maxK}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input 
                      type="range" 
                      min={1} 
                      max={maxK} 
                      value={k} 
                      onChange={(e) => setK(Number(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                  <p className="text-xs text-slate-400 italic">
                    Lower 'k' = smaller file size, lower quality. 
                    Higher 'k' = closer to original.
                  </p>
               </div>

               {/* Action Button */}
               <motion.button 
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={handleCompress}
                 disabled={loading}
                 className="w-full md:w-auto px-8 py-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shrink-0 transition-all"
               >
                 {loading ? (
                   <>
                     <RefreshCw className="w-5 h-5 animate-spin" />
                     <span>Compressing...</span>
                   </>
                 ) : (
                   <>
                     <span>Apply SVD</span>
                     <ArrowRight className="w-4 h-4" />
                   </>
                 )}
               </motion.button>
             </div>
             
             {error && (
               <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center space-x-3 text-rose-400">
                 <AlertCircle className="w-5 h-5 shrink-0" />
                 <p className="text-sm">{error}</p>
               </motion.div>
             )}
          </div>

          {/* Viewer Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Original Image */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Original Image
                </h3>
              </div>
              <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl aspect-square md:aspect-[4/3] flex items-center justify-center relative group">
                {previewUrl && (
                  <img src={previewUrl} alt="Original" className="w-full h-full object-contain" />
                )}
                <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 shadow-lg flex flex-col items-end">
                    <span className="text-xs text-slate-400">Size</span>
                    <span className="text-sm font-medium text-slate-200">{formatBytes(file.size)}</span>
                </div>
              </div>
            </div>

            {/* Compressed Image */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-indigo-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  Compressed Result
                </h3>
                {result && (
                  <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
              </div>
              
              <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl aspect-square md:aspect-[4/3] flex items-center justify-center relative">
                {loading ? (
                    <div className="flex flex-col items-center space-y-4 text-indigo-400">
                      <RefreshCw className="w-10 h-10 animate-spin" />
                      <p className="text-sm animate-pulse">Processing SVD algorithms...</p>
                    </div>
                ) : result?.compressed_image ? (
                   <>
                     <img src={result.compressed_image} alt="Compressed" className="w-full h-full object-contain" />
                     <div className="absolute bottom-4 right-4 bg-indigo-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-indigo-700/50 shadow-lg flex flex-col items-end">
                         <span className="text-xs text-indigo-300">Size</span>
                         <span className="text-sm font-medium text-white">{formatBytes(result.compressed_size)}</span>
                     </div>
                   </>
                ) : (
                  <div className="text-slate-600 flex flex-col items-center p-6 text-center">
                    <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm">Run compression to see the result here.</p>
                  </div>
                )}
              </div>
            </div>
            
          </div>

          {/* Metrics Section */}
          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {[
                  { label: "Compression Ratio", value: `${result.compression_ratio}x`, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                  { label: "Storage Saved", value: `${Math.round((1 - result.compressed_size / result.original_size) * 100)}%`, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                  { label: "MSE (Error)", value: result.mse, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                  { label: "PSNR (Quality)", value: `${result.psnr} dB`, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                ].map((metric, i) => (
                  <div key={i} className={`p-5 rounded-xl border backdrop-blur-sm ${metric.bg} ${metric.border} flex flex-col items-center justify-center text-center`}>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{metric.label}</p>
                    <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}
    </div>
  );
}
