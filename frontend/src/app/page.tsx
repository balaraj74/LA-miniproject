import CryptoSVD from '@/components/CryptoSVD';
import MatrixRain from '@/components/MatrixRain';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-emerald-500 overflow-hidden font-mono relative flex flex-col pt-12 pb-24 px-4">
      <MatrixRain />
      {/* Background decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-emerald-900/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:50px_50px] z-[-5]"></div>

      <div className="max-w-6xl mx-auto w-full mb-12 text-center space-y-4 relative z-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-700 pb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
          SYS.CRYPT_SVD
        </h1>
        <p className="text-emerald-600/80 text-lg max-w-3xl mx-auto leading-relaxed uppercase tracking-wider">
          <strong className="text-emerald-500">Matrix Transformations</strong> protocol initiated. Decryption algorithm utilizes <strong>SVD pseudo-inverses</strong> strictly to reconstruct targeted visual parameters without mathematical degradation.
        </p>
      </div>

      <CryptoSVD />
      
      <div className="max-w-4xl mx-auto mt-24 text-emerald-600/80 text-sm p-6 bg-black/40 rounded-xl border border-emerald-500/20 shadow-[0_8px_32px_0_rgba(16,185,129,0.1)] backdrop-blur-xl relative z-10">
        <h3 className="font-bold text-emerald-500 mb-2 uppercase tracking-widest border-b border-emerald-900/50 pb-2">[ SYSTEM_ARCHITECTURE ]</h3>
        <ul className="list-disc pl-5 space-y-3 mt-4">
            <li><strong>Encryption:</strong> Generates a secure, non-singular square matrix key $K$ derived from variables. The image is shifted via $Encrypted = K \cdot Original$.</li>
            <li><strong>Constraint:</strong> Intensities undergo affine adjustments clamped safely away from hardware overflow.</li>
            <li><strong>Decryption:</strong> Regenerates $K$ locally calculating its pseudo-inverse using Singular Value Decomposition: $K^+ = V \cdot \Sigma^+ \cdot U^T$. Structural inversion flawlessly unpacks $Original = K^+ \cdot Encrypted$.</li>
        </ul>
      </div>
    </main>
  );
}
