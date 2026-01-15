
import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface PassportScannerProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

const PassportScanner: React.FC<PassportScannerProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Unable to access camera. Please ensure permissions are granted.");
      console.error(err);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        onCapture(dataUrl);
        setIsCapturing(true);
        setTimeout(() => onClose(), 1500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        <div className="p-4 flex justify-between items-center bg-gray-800 text-white">
          <div className="flex items-center space-x-2">
            <Camera size={20} className="text-orange-500" />
            <h3 className="font-bold">Passport Scanner</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="relative aspect-[4/3] bg-black flex items-center justify-center">
          {error ? (
            <div className="text-center p-8">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <p className="text-white text-sm">{error}</p>
            </div>
          ) : isCapturing ? (
            <div className="text-center animate-pulse">
              <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
              <p className="text-white font-bold">Passport Captured!</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              {/* Scan Overlay */}
              <div className="absolute inset-0 border-2 border-orange-500/50 m-12 rounded-lg">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500"></div>
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-orange-500/30 animate-scan"></div>
              </div>
            </>
          )}
        </div>

        <div className="p-6 bg-gray-800 flex justify-center space-x-4">
          {!error && !isCapturing && (
            <button 
              onClick={captureImage}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-2xl flex items-center space-x-2 shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
            >
              <Camera size={20} />
              <span>Capture Document</span>
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 font-bold px-6 py-3 hover:text-white transition-colors">
            Cancel
          </button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-100px); }
          50% { transform: translateY(100px); }
        }
        .animate-scan { animation: scan 3s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default PassportScanner;
