import { useEffect, useState } from "react";
import axios from "axios";

export default function Counter() {
  const [value, setValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCounter = async () => {
    try {
      const res = await axios.get("http://localhost:3000/blockchain/counter");
      setValue(Number(res.data.value));
    } catch (err) {
      console.error("Failed to load counter", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCounter();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-sm w-full text-center">
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Blockchain Counter</h1>

        {loading ? (
          <p className="text-gray-500 animate-pulse">Loading counter...</p>
        ) : (
          <p className="text-5xl font-semibold text-indigo-600 mb-6">
            {value}
          </p>
        )}

        <button
          className="
            bg-indigo-600 
            hover:bg-indigo-700 
            text-white 
            font-medium 
            py-3 
            px-6 
            rounded-xl 
            shadow 
            transition-all 
            duration-200 
            w-full
          "
          onClick={async () => {
            try {
              const tx = await axios.post(
                "http://localhost:3000/blockchain/counter/add"
              );
              console.log("TX:", tx.data);
              setTimeout(loadCounter, 1000);
            } catch (err) {
              console.error(err);
            }
          }}
        >
          Increment Counter
        </button>
      </div>
    </div>
  );
}
