import { useEffect, useState } from "react";

interface CallInterfaceProps {
  onEndCall: () => void;
}

export default function CallInterface({ onEndCall }: CallInterfaceProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-4xl h-3/4 bg-gray-800 rounded-2xl overflow-hidden relative shadow-2xl border border-gray-700 flex flex-col items-center justify-center">
        {/* Fake Video Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="text-center space-y-4">
            <div className="w-32 h-32 bg-gray-600 rounded-full mx-auto flex items-center justify-center animate-pulse">
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-wide">
              Patient is Online
            </h2>
            <p className="text-green-400 font-mono text-xl">
              {formatTime(seconds)}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 flex gap-6">
          <button className="p-4 rounded-full bg-gray-600 hover:bg-gray-500 transition">
            🎤
          </button>
          <button className="p-4 rounded-full bg-gray-600 hover:bg-gray-500 transition">
            📷
          </button>
          <button
            onClick={onEndCall}
            className="px-8 py-4 rounded-full bg-red-600 hover:bg-red-700 font-bold text-lg shadow-lg transform hover:scale-105 transition"
          >
            End Session
          </button>
        </div>

        {/* Self View (Fake) */}
        <div className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-lg border-2 border-gray-700 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Therapist View</span>
        </div>
      </div>
    </div>
  );
}