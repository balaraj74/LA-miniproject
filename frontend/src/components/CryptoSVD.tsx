"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, RefreshCw, AlertCircle, Play, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { encryptImage, decryptImage } from '../services/api';

export default function CryptoSVD() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [encryptedUrl, setEncryptedUrl] = useState<string | null>(null);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  
  // Keys
  const [svdKey, setSvdKey] = useState<number>(0.5);
  const [m1, setM1] = useState<number>(93);
  const [m2, setM2] = useState<number>(201);
  const [m3, setM3] = useState<number>(144);
  const [m4, setM4] = useState<number>(57);
  
  // Pad tracking internal state
  const [padding, setPadding] = useState<{ padH: number, padW: number }>({ padH: 0, padW: 0 });

  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<'encrypt' | 'decrypt' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [importKeyString, setImportKeyString] = useState<string>('');

  // Clear typed import string whenever matrix directly changes
  useEffect(() => {
    setImportKeyString('');
  }, [m1, m2, m3, m4]);

  const getExportKey = () => {
    const pad = (num: number) => String(num).padStart(4, '0');
    return `${pad(m1)}${pad(m2)}${pad(m3)}${pad(m4)}`;
  };

  const handleImportKey = (str: string) => {
    setImportKeyString(str);
    const cleanStr = str.replace(/\D/g, ''); // Extract only digits
    if (cleanStr.length === 16) {
      const val1 = parseInt(cleanStr.substring(0, 4), 10);
      const val2 = parseInt(cleanStr.substring(4, 8), 10);
      const val3 = parseInt(cleanStr.substring(8, 12), 10);
      const val4 = parseInt(cleanStr.substring(12, 16), 10);
      
      setM1(val1);
      setM2(val2);
      setM3(val3);
      setM4(val4);
      setError(null);
    }
  };

  const onDropOriginal = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setOriginalUrl(URL.createObjectURL(selectedFile));
      setEncryptedUrl(null);
      setDecryptedUrl(null);
      setError(null);
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
      setPadding({ padH: 0, padW: 0 }); // Fallback padding
    }
  }, []);

  const { getRootProps: getRootPropsOrig, getInputProps: getInputPropsOrig, isDragActive: isDragActiveOrig } = useDropzone({ 
    onDrop: onDropOriginal,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1
  });

  const { getRootProps: getRootPropsEnc, getInputProps: getInputPropsEnc, isDragActive: isDragActiveEnc } = useDropzone({ 
    onDrop: onDropEncrypted,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1
  });

  const handleEncrypt = async () => {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }
    
    setLoading(true);
    setLoadingStage('encrypt');
    setError(null);
    
    try {
      const res = await encryptImage(file, svdKey, [m1, m2, m3, m4]);
      setEncryptedUrl(res.image_base64);
      setPadding({ padH: res.pad_h, padW: res.pad_w });
      setDecryptedUrl(null); // Reset decryption step
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
    
    setLoading(true);
    setLoadingStage('decrypt');
    setError(null);
    
    try {
      // Create a File from the base64 encrypted image to send back for decryption
      const resBlob = await fetch(encryptedUrl).then(r => r.blob());
      const encFile = new File([resBlob], "encrypted.png", { type: "image/png" });
      
      const res = await decryptImage(encFile, svdKey, [m1, m2, m3, m4], padding.padH, padding.padW);
      setDecryptedUrl(res.image_base64);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || "Decryption failed. Ensure matrix keys match exactly.");
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

  // Convert blob to file utility is inside handleDecrypt

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 bg-black/40 backdrop-blur-xl border border-emerald-500/20 rounded-3xl shadow-[0_8px_32px_0_rgba(16,185,129,0.15)] relative overflow-hidden font-mono z-10">
      {/* Glitch Overlay effect */}
      <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(16,185,129,0.03)_2px,rgba(16,185,129,0.03)_4px)] z-0 mix-blend-color-dodge"></div>
      
      {/* Upload Section */}
      {(!originalUrl && !encryptedUrl) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div 
            {...getRootPropsOrig()} 
            className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all cursor-pointer relative group
              ${isDragActiveOrig ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 bg-black/40 backdrop-blur-md'}`}
          >
            <input {...getInputPropsOrig()} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-emerald-950 rounded-full border border-emerald-500/30 text-emerald-500 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all">
                <Upload className="w-10 h-10" />
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-400 tracking-widest uppercase">SYS.UPLOAD_ORIGINAL</p>
                <p className="text-sm text-emerald-700 mt-2">Initialize Encryption Sequence</p>
              </div>
            </motion.div>
          </div>

          <div 
            {...getRootPropsEnc()} 
            className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all cursor-pointer relative group
              ${isDragActiveEnc ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 bg-black/40 backdrop-blur-md'}`}
          >
            <input {...getInputPropsEnc()} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-emerald-950 rounded-full border border-emerald-500/30 text-emerald-500 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all">
                <Upload className="w-10 h-10" />
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-400 tracking-widest uppercase">SYS.UPLOAD_CIPHER</p>
                <p className="text-sm text-emerald-700 mt-2">Bypass to Decryption Protocol</p>
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 relative z-10">
          
          {/* Controls Panel */}
          <div className="bg-emerald-950/30 rounded-2xl p-6 border border-emerald-500/30 backdrop-blur-xl shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]">
            <div className="flex items-center justify-between mb-6 border-b border-emerald-500/20 pb-4">
               <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 animate-pulse"></span> Cryptographic Keys</h3>
               <button onClick={() => { setFile(null); setOriginalUrl(null); setEncryptedUrl(null); setDecryptedUrl(null); }} className="text-xs bg-black text-emerald-500 border border-emerald-500/50 px-3 py-1.5 rounded hover:bg-emerald-900/40 hover:shadow-[0_0_10px_rgba(16,185,129,0.3)] transition uppercase font-bold tracking-wider">Abort & Reset</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              {/* SVD Key */}
              <div className="space-y-3">
                 <label className="text-sm font-bold text-emerald-600 uppercase tracking-widest">SVD Scalar Key</label>
                 <input 
                   type="number" 
                   step="0.1"
                   value={svdKey}
                   onChange={(e) => setSvdKey(parseFloat(e.target.value))}
                   className="w-full bg-black/50 backdrop-blur-sm border border-emerald-500/40 text-emerald-400 rounded px-4 py-3 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] outline-none transition"
                 />
                 <p className="text-xs text-emerald-800">Multiplies the Singular Values (S) matrix.</p>
              </div>

              {/* Matrix Key */}
              <div className="space-y-3">
                 <label className="text-sm font-bold text-emerald-600 uppercase tracking-widest">2x2 Matrix Key (Mod 256)</label>
                 <div className="grid grid-cols-2 gap-4">
                   <input type="number" value={m1} onChange={(e) => setM1(parseInt(e.target.value) || 0)} className="bg-black/50 backdrop-blur-sm border border-emerald-500/40 text-emerald-400 rounded px-4 py-3 text-center focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] outline-none transition" />
                   <input type="number" value={m2} onChange={(e) => setM2(parseInt(e.target.value) || 0)} className="bg-black/50 backdrop-blur-sm border border-emerald-500/40 text-emerald-400 rounded px-4 py-3 text-center focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] outline-none transition" />
                   <input type="number" value={m3} onChange={(e) => setM3(parseInt(e.target.value) || 0)} className="bg-black/50 backdrop-blur-sm border border-emerald-500/40 text-emerald-400 rounded px-4 py-3 text-center focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] outline-none transition" />
                   <input type="number" value={m4} onChange={(e) => setM4(parseInt(e.target.value) || 0)} className="bg-black/50 backdrop-blur-sm border border-emerald-500/40 text-emerald-400 rounded px-4 py-3 text-center focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] outline-none transition" />
                 </div>
                 <p className="text-xs text-emerald-800">Must be invertible modulo 256 (Determinant must be odd).</p>
              </div>

              {/* Secret Key Import/Export */}
              <div className="space-y-3 md:col-span-2 pt-4 border-t border-emerald-500/20">
                <label className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Master Key String</label>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={importKeyString || getExportKey()}
                    onChange={(e) => handleImportKey(e.target.value)}
                    placeholder="Paste a key string here to import..."
                    className="flex-1 bg-black/50 backdrop-blur-sm border border-emerald-500/40 text-emerald-400 font-mono text-sm rounded px-4 py-3 focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] outline-none transition"
                  />
                  <button 
                    onClick={() => navigator.clipboard.writeText(getExportKey())}
                    className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-400 rounded transition text-sm font-bold uppercase tracking-wider relative overflow-hidden group"
                  >
                    <span className="relative z-10">Copy Key</span>
                    <div className="absolute inset-0 bg-emerald-400/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                  </button>
                </div>
                <p className="text-xs text-emerald-800">This 16-digit key represents your 4 Matrix keys (e.g. 0093020101440057 for 93, 201, 144, 57). Paste a 16-digit key here to instantly apply it.</p>
              </div>

            </div>

             {error && (
               <div className="mt-6 p-4 bg-red-950/30 border border-red-500/30 rounded flex items-center space-x-3 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                 <AlertCircle className="w-5 h-5 shrink-0" />
                 <p className="text-sm font-bold uppercase tracking-wider">{error}</p>
               </div>
             )}
          </div>

          {/* Image Showcase Grid */}
          <div className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                
                {/* Original */}
                <div className="flex flex-col relative group">
                  <div className="flex items-center justify-between mb-3 px-1">
                     <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-widest">[ TARGET ]</h4>
                  </div>
                  <div className="bg-black/40 backdrop-blur-sm aspect-square rounded border border-emerald-500/30 p-2 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)] flex items-center justify-center overflow-hidden relative">
                     <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1),transparent)] pointer-events-none"></div>
                     {originalUrl ? (
                         <img src={originalUrl} className="w-full h-full object-contain relative z-10" />
                     ) : (
                         <div className="text-emerald-900 flex flex-col items-center">
                            <span className="text-sm font-bold uppercase tracking-widest block font-mono">NULL_TARGET</span>
                         </div>
                     )}
                  </div>
                  <button 
                     onClick={handleEncrypt}
                     disabled={loading || !originalUrl}
                     className="mt-4 py-3 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-400 rounded shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:shadow-none"
                  >
                     {loading && loadingStage === 'encrypt' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-emerald-400" />}
                     EXECUTE_ENCRYPT
                  </button>
                </div>

                {/* Encrypted */}
                <div className="flex flex-col relative group">
                   <div className="flex items-center justify-between mb-3 px-1">
                     <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest shadow-emerald-400/50 drop-shadow-md">[ CIPHER_STREAM ]</h4>
                     {encryptedUrl && (
                        <button onClick={() => handleDownload(encryptedUrl, 'encrypted.png')} className="text-xs text-emerald-500 hover:text-emerald-300 flex items-center gap-1 font-bold">
                           <Download className="w-3 h-3" /> EXPORT
                        </button>
                     )}
                   </div>
                   <div className="bg-black/40 backdrop-blur-sm aspect-square rounded border border-emerald-500/50 p-2 shadow-[inset_0_0_30px_rgba(16,185,129,0.2)] flex items-center justify-center overflow-hidden relative">
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500/50 animate-[scan_3s_linear_infinite] pointer-events-none"></div>
                      {encryptedUrl ? (
                         <img src={encryptedUrl} className="w-full h-full object-contain relative z-10 filter contrast-125" />
                      ) : (
                         <div className="text-emerald-900 flex flex-col items-center">
                            <span className="text-sm font-bold uppercase tracking-widest block font-mono">AWAITING_DATA</span>
                         </div>
                      )}
                   </div>
                   <button 
                     onClick={handleDecrypt}
                     disabled={loading || !encryptedUrl}
                     className="mt-4 py-3 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-400 rounded shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:shadow-none"
                  >
                     {loading && loadingStage === 'decrypt' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                     EXECUTE_DECRYPT
                  </button>
                </div>

                {/* Decrypted */}
                <div className="flex flex-col relative group">
                   <div className="flex items-center justify-between mb-3 px-1">
                     <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-widest">[ RESTORED ]</h4>
                     {decryptedUrl && (
                        <button onClick={() => handleDownload(decryptedUrl, 'decrypted.png')} className="text-xs text-emerald-500 hover:text-emerald-300 flex items-center gap-1 font-bold">
                           <Download className="w-3 h-3" /> EXPORT
                        </button>
                     )}
                   </div>
                   <div className="bg-black/40 backdrop-blur-sm aspect-square rounded border border-emerald-500/30 p-2 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)] flex items-center justify-center overflow-hidden relative">
                      {decryptedUrl ? (
                         <img src={decryptedUrl} className="w-full h-full object-contain relative z-10" />
                      ) : (
                         <div className="text-emerald-900 flex flex-col items-center">
                            <span className="text-sm font-bold uppercase tracking-widest block font-mono">NULL_OUTPUT</span>
                         </div>
                      )}
                   </div>
                   <div className="mt-4 py-3 h-12"></div> {/* Spacer to align grid rows */}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
