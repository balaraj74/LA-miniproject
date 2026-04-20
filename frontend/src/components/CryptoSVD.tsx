"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, RefreshCw, AlertCircle, Play, ArrowRight, Dices, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { encryptImage, decryptImage, MetricsData } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

export default function CryptoSVD() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [encryptedUrl, setEncryptedUrl] = useState<string | null>(null);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  
  // Advanced Keys
  const [k1, setK1] = useState<number>(1.5);
  const [k2, setK2] = useState<number>(100);
  const [secretKey, setSecretKey] = useState<string>('992837482');
  const [arnoldIterations, setArnoldIterations] = useState<number>(3);
  const [matrixSize, setMatrixSize] = useState<4 | 8>(4);
  
  // Matrix (we default to 4x4 identity-ish or some valid invertible mod 256)
  const defaultMatrix = [
    [84, 8, 20, 31],
    [42, 45, 187, 239],
    [76, 44, 183, 63],
    [147, 150, 248, 176]
  ];
  
  // Convert standard defaults to string for easy textarea editing
  const [matrixStr, setMatrixStr] = useState<string>(JSON.stringify(defaultMatrix, null, 2));
  
  // Internal tracking
  const [paddingConfig, setPaddingConfig] = useState({ mPadH: 0, mPadW: 0, aOrigH: 0, aOrigW: 0 });
  const [metrics, setMetrics] = useState<MetricsData | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<'encrypt' | 'decrypt' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX_DIM = 512;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height *= MAX_DIM / width));
            width = MAX_DIM;
          } else {
            width = Math.round((width *= MAX_DIM / height));
            height = MAX_DIM;
          }
        } else {
          resolve(file);
          URL.revokeObjectURL(url);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); 
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], file.name, { type: 'image/png' });
            resolve(newFile);
          } else {
            resolve(file);
          }
          URL.revokeObjectURL(url);
        }, 'image/png');
      };
      img.onerror = () => resolve(file);
      img.src = url;
    });
  };

  const onDropOriginal = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      const resizedFile = await resizeImage(selectedFile);
      setFile(resizedFile);
      setOriginalUrl(URL.createObjectURL(resizedFile));
      setEncryptedUrl(null);
      setDecryptedUrl(null);
      setError(null);
      setMetrics(null);
    }
  }, []);

  const onDropEncrypted = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(null);
      setOriginalUrl(null);
      setEncryptedUrl(URL.createObjectURL(selectedFile));
      setDecryptedUrl(null);
      setError(null);
      setMetrics(null);
    }
  }, []);

  const { getRootProps: getRootPropsOrig, getInputProps: getInputPropsOrig, isDragActive: isDragActiveOrig } = useDropzone({ 
    onDrop: onDropOriginal,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp'] },
    maxFiles: 1
  });

  const { getRootProps: getRootPropsEnc, getInputProps: getInputPropsEnc, isDragActive: isDragActiveEnc } = useDropzone({ 
    onDrop: onDropEncrypted,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp'] },
    maxFiles: 1
  });
  
  const handleGenerateRandomMatrix = () => {
     try {
       // Create an NXN matrix that we are somewhat confident is invertible mod 256.
       // Odd determinant requires the diagonal elements to be odd, and off-diagonals to be small bounds.
       const newMat = Array.from({length: matrixSize}, (_, i) => 
         Array.from({length: matrixSize}, (_, j) => {
           if (i === j) {
             // Diagonal: odd number
             return Math.floor(Math.random() * 128) * 2 + 1;
           }
           // Off-diagonal: random
           return Math.floor(Math.random() * 256);
         })
       );
       setMatrixStr(JSON.stringify(newMat, null, 2));
     } catch (e) {}
  };

  const handleEncrypt = async () => {
    if (!file) {
        setError("Please upload an image first."); return;
    }
    
    let matrixArr;
    try {
        matrixArr = JSON.parse(matrixStr);
        if (!Array.isArray(matrixArr) || !Array.isArray(matrixArr[0])) {
            throw new Error("Matrix must be a 2D array.");
        }
    } catch(err) {
        setError("Invalid JSON format for Matrix Key."); return;
    }
    
    setLoading(true);
    setLoadingStage('encrypt');
    setError(null);
    
    try {
      const res = await encryptImage(file, k1, k2, secretKey, matrixArr, arnoldIterations);
      setEncryptedUrl(res.image_base64);
      setPaddingConfig({
          mPadH: res.m_pad_h, mPadW: res.m_pad_w,
          aOrigH: res.a_orig_h, aOrigW: res.a_orig_w
      });
      setMetrics(res.metrics);
      setDecryptedUrl(null); 
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || "Encryption failed. Ensure matrix determinant is odd.");
    } finally {
      setLoading(false);
      setLoadingStage(null);
    }
  };

  const handleDecrypt = async () => {
    if (!encryptedUrl) {
      setError("Please encrypt the image first.");
      return;
    }
    
    let matrixArr;
    try {
        matrixArr = JSON.parse(matrixStr);
    } catch(err) {
        setError("Invalid JSON format for Matrix Key."); return;
    }
    
    setLoading(true);
    setLoadingStage('decrypt');
    setError(null);
    
    try {
      const resBlob = await fetch(encryptedUrl).then(r => r.blob());
      const encFile = new File([resBlob], "encrypted.png", { type: "image/png" });
      
      const res = await decryptImage(encFile, k1, k2, secretKey, matrixArr, arnoldIterations, paddingConfig.mPadH, paddingConfig.mPadW, paddingConfig.aOrigH, paddingConfig.aOrigW);
      setDecryptedUrl(res.image_base64);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || "Decryption failed.");
    } finally {
      setLoading(false);
      setLoadingStage(null);
    }
  };

  const handleDownload = (imgUrl: string, name: string) => {
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderMetrics = () => {
    if (!metrics) return null;
    
    const corrData = [
      { name: 'Horizontal', orig: metrics.correlation_original.horizontal, enc: metrics.correlation_encrypted.horizontal },
      { name: 'Vertical', orig: metrics.correlation_original.vertical, enc: metrics.correlation_encrypted.vertical },
      { name: 'Diagonal', orig: metrics.correlation_original.diagonal, enc: metrics.correlation_encrypted.diagonal },
    ];
    
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-emerald-950/40 border border-emerald-500/20 p-4 rounded-xl backdrop-blur">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Shannon Entropy</h4>
                  <div className="text-2xl font-black text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">{metrics.entropy_encrypted.toFixed(4)}</div>
                  <p className="text-[10px] text-emerald-700 mt-1 uppercase">Target: ~7.99 (Ideal)</p>
               </div>
               
               <div className="bg-emerald-950/40 border border-emerald-500/20 p-4 rounded-xl backdrop-blur">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">NPCR</h4>
                  <div className="text-2xl font-black text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">{metrics.npcr.toFixed(2)}%</div>
                  <p className="text-[10px] text-emerald-700 mt-1 uppercase">Target: ~99.6% (Ideal)</p>
               </div>
               
               <div className="bg-emerald-950/40 border border-emerald-500/20 p-4 rounded-xl backdrop-blur">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">UACI</h4>
                  <div className="text-2xl font-black text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">{metrics.uaci.toFixed(2)}%</div>
                  <p className="text-[10px] text-emerald-700 mt-1 uppercase">Target: ~33.4% (Ideal)</p>
               </div>
               
               <div className="bg-emerald-950/40 border border-emerald-500/20 p-4 rounded-xl backdrop-blur">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Orig Entropy</h4>
                  <div className="text-2xl font-black text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">{metrics.entropy_original.toFixed(4)}</div>
                  <p className="text-[10px] text-emerald-700 mt-1 uppercase">Baseline Comparison</p>
               </div>
            </div>
            
            {/* Correlation Chart */}
            <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl backdrop-blur h-48">
               <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 border-b border-emerald-900/50 pb-2">Pixel Correlation</h4>
               <ResponsiveContainer width="100%" height="80%">
                  <BarChart data={corrData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" vertical={false} />
                    <XAxis dataKey="name" stroke="#059669" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#059669" fontSize={10} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#022c22', borderColor: '#059669', color: '#10b981', fontSize: '12px' }} itemStyle={{ color: '#34d399' }} />
                    <Bar dataKey="orig" name="Original" fill="#047857" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="enc" name="Encrypted" fill="#34d399" radius={[2, 2, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
            
        </motion.div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 bg-black/40 backdrop-blur-xl border border-emerald-500/20 rounded-3xl shadow-[0_8px_32px_0_rgba(16,185,129,0.15)] relative overflow-hidden font-mono z-10 mt-6">
      <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(16,185,129,0.03)_2px,rgba(16,185,129,0.03)_4px)] z-0 mix-blend-color-dodge"></div>
      
      {(!originalUrl && !encryptedUrl) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div {...getRootPropsOrig()} className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all cursor-pointer group ${isDragActiveOrig ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 bg-black/40 backdrop-blur-md'}`}>
            <input {...getInputPropsOrig()} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-emerald-950 rounded-full border border-emerald-500/30 text-emerald-500 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all"><Upload className="w-10 h-10" /></div>
              <div>
                <p className="text-xl font-bold text-emerald-400 uppercase tracking-widest">SYS.UPLOAD_TARGET</p>
                <p className="text-xs text-emerald-700 mt-2 uppercase">Input source visual data</p>
              </div>
            </motion.div>
          </div>

          <div {...getRootPropsEnc()} className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all cursor-pointer group ${isDragActiveEnc ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 bg-black/40 backdrop-blur-md'}`}>
            <input {...getInputPropsEnc()} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-emerald-950 rounded-full border border-emerald-500/30 text-emerald-500 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all"><Lock className="w-10 h-10" /></div>
              <div>
                <p className="text-xl font-bold text-emerald-400 uppercase tracking-widest">SYS.UPLOAD_CIPHER</p>
                <p className="text-xs text-emerald-700 mt-2 uppercase">Input AES/SVD encrypted data</p>
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 relative z-10">
          
          {/* Advanced Configurations */}
          <div className="bg-[#03150d] rounded-2xl p-6 border border-emerald-500/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]">
            <div className="flex items-center justify-between mb-6 border-b border-emerald-500/20 pb-4">
               <h3 className="text-lg md:text-xl font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 animate-pulse"></span> Triple-Layer Vector Keys</h3>
               <button onClick={() => { setFile(null); setOriginalUrl(null); setEncryptedUrl(null); setDecryptedUrl(null); setMetrics(null); }} className="text-xs bg-black text-emerald-500 border border-emerald-500/50 px-3 py-1.5 rounded hover:bg-emerald-900/40 hover:shadow-[0_0_10px_rgba(16,185,129,0.3)] transition uppercase font-bold tracking-wider">Abort & Reset</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* L1: SVD / L3: Arnold */}
              <div className="md:col-span-5 space-y-6">
                <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                    <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3 border-b border-emerald-900 pb-1">Layer 1: SVD Noise Params</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] text-emerald-700 uppercase">K1 (Scale)</label>
                            <input type="number" step="0.1" value={k1} onChange={e => setK1(parseFloat(e.target.value))} className="w-full bg-black border border-emerald-500/30 text-emerald-400 rounded px-2 py-1 text-sm focus:border-emerald-400 outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] text-emerald-700 uppercase">K2 (Shift)</label>
                            <input type="number" step="1" value={k2} onChange={e => setK2(parseFloat(e.target.value))} className="w-full bg-black border border-emerald-500/30 text-emerald-400 rounded px-2 py-1 text-sm focus:border-emerald-400 outline-none" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] text-emerald-700 uppercase">PRNG Secret Seed</label>
                            <input type="text" value={secretKey} onChange={e => setSecretKey(e.target.value)} className="w-full bg-black border border-emerald-500/30 text-emerald-400 rounded px-2 py-1 text-sm focus:border-emerald-400 outline-none font-mono" />
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                    <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3 border-b border-emerald-900 pb-1">Layer 3: Chaos Permutations</h4>
                    <label className="text-[10px] text-emerald-700 uppercase">Arnold Cat Map Iterations</label>
                    <input type="range" min="1" max="25" value={arnoldIterations} onChange={e => setArnoldIterations(parseInt(e.target.value))} className="w-full mt-2 accent-emerald-500" />
                    <div className="text-right text-emerald-400 text-sm font-bold">{arnoldIterations} Loops</div>
                </div>
              </div>

              {/* L2: Matrix */}
              <div className="md:col-span-7 space-y-3">
                 <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Layer 2: Modulo Block Matrix</h4>
                    <div className="flex gap-2">
                        <select value={matrixSize} onChange={e => setMatrixSize(parseInt(e.target.value) as 4 | 8)} className="bg-black text-emerald-500 border border-emerald-500/30 rounded px-2 py-1 text-[10px] uppercase cursor-pointer">
                            <option value={4}>4x4 Blocks</option>
                            <option value={8}>8x8 Blocks</option>
                        </select>
                        <button onClick={handleGenerateRandomMatrix} className="flex items-center gap-1 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-400 text-[10px] px-2 py-1 uppercase rounded border border-emerald-500/30 transition">
                            <Dices className="w-3 h-3" /> Gen Random
                        </button>
                    </div>
                 </div>
                 <textarea 
                   rows={6}
                   value={matrixStr}
                   onChange={(e) => setMatrixStr(e.target.value)}
                   className="w-full bg-black/50 backdrop-blur-sm border border-emerald-500/40 text-emerald-400 font-mono text-sm rounded p-3 focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] outline-none resize-none"
                   spellCheck={false}
                 />
                 <p className="text-[10px] text-emerald-700 uppercase">Must be a square array structure. Determinant Mod 256 MUST be invertible (odd numbers preferred on diagonal).</p>
              </div>

            </div>

             {error && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 bg-red-950/30 border border-red-500/30 rounded flex items-center space-x-3 text-red-500">
                 <AlertCircle className="w-5 h-5 shrink-0" />
                 <p className="text-sm font-bold uppercase tracking-wider">{error}</p>
               </motion.div>
             )}
          </div>

          {/* Visual Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-8">
            
            {/* Original */}
            <div className="flex flex-col">
              <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">[ TARGET ]</h4>
              <div className="bg-black/60 aspect-square rounded-xl border border-emerald-500/30 p-1 flex items-center justify-center overflow-hidden">
                  {originalUrl ? <img src={originalUrl} className="w-full h-full object-contain" /> : <div className="text-emerald-900 font-mono text-xs uppercase">NULL_TARGET</div>}
              </div>
              <button onClick={handleEncrypt} disabled={loading || !originalUrl} className="mt-4 py-3 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-400 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.2)] font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:shadow-none">
                  {loading && loadingStage === 'encrypt' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-emerald-400" />} EXECUTE_ENCRYPT
              </button>
            </div>

            {/* Encrypted */}
            <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">[ CIPHER ]</h4>
                    {encryptedUrl && <button onClick={() => handleDownload(encryptedUrl, 'encrypted.png')} className="text-[10px] text-emerald-500 hover:text-emerald-300 flex items-center gap-1 font-bold"><Download className="w-3 h-3" /> EXPORT</button>}
                </div>
                <div className="bg-black/80 aspect-square rounded-xl border border-emerald-400 p-1 shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center overflow-hidden relative group">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:4px_4px] mix-blend-overlay pointer-events-none opacity-50"></div>
                    {encryptedUrl ? <img src={encryptedUrl} className="w-full h-full object-contain relative z-10" /> : <div className="text-emerald-900 font-mono text-xs uppercase">AWAITING_DATA</div>}
                </div>
                <button onClick={handleDecrypt} disabled={loading || !encryptedUrl} className="mt-4 py-3 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-400 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.2)] font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:shadow-none">
                  {loading && loadingStage === 'decrypt' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} EXECUTE_DECRYPT
                </button>
            </div>

            {/* Decrypted */}
            <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">[ RESTORED ]</h4>
                    {decryptedUrl && <button onClick={() => handleDownload(decryptedUrl, 'decrypted.png')} className="text-[10px] text-emerald-500 hover:text-emerald-300 flex items-center gap-1 font-bold"><Download className="w-3 h-3" /> EXPORT</button>}
                </div>
                <div className="bg-black/60 aspect-square rounded-xl border border-emerald-500/30 p-1 flex items-center justify-center overflow-hidden">
                    {decryptedUrl ? <img src={decryptedUrl} className="w-full h-full object-contain" /> : <div className="text-emerald-900 font-mono text-xs uppercase">NULL_OUTPUT</div>}
                </div>
            </div>
            
          </div>

          <AnimatePresence>
            {metrics && renderMetrics()}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
