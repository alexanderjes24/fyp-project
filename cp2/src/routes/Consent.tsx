import React, { useState, useEffect } from "react";
import axios from "axios";

interface ConsentRecord {
  userId: string;
  date: string;
  txHash: string;
}

export default function ConsentDemo() {
  const [total, setTotal] = useState(0);
  const [txHash, setTxHash] = useState("");
  const [records, setRecords] = useState<ConsentRecord[]>([]);

  // Load total number of consents
  const loadTotal = async () => {
    try {
      const res = await axios.get("http://localhost:3000/consent/total");
      setTotal(res.data.total);
    } catch (err) {
      console.error("Failed to load total:", err);
    }
  };

  // Load all consent records from blockchain
  const loadAllRecords = async () => {
    try {
      const res = await axios.get("http://localhost:3000/consent/all");
      setRecords(res.data.records || []);
    } catch (err) {
      console.error("Failed to load consent records:", err);
    }
  };

  // Agree consent and record to blockchain
  const agreeConsent = async () => {
    try {
      const userId = "user123"; // normally from auth
      const res = await axios.post("http://localhost:3000/consent/agree", {
        userId,
      });

      const newTxHash = res.data.txHash;
      if (newTxHash) setTxHash(newTxHash);

      // Refresh total and records after new consent
      await loadTotal();
      await loadAllRecords();
    } catch (err) {
      console.error("Failed to agree consent:", err);
    }
  };

  useEffect(() => {
    loadTotal();
    loadAllRecords();
  }, []);

  return (
    <div className="p-5 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Consent Form</h1>

      <p className="mb-3">
        Total consents recorded on blockchain: <b>{total}</b>
      </p>

      <button
        onClick={agreeConsent}
        className="bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 mb-4"
      >
        I Agree
      </button>

      {txHash && (
        <p className="mt-2 text-sm text-blue-700">
          Consent successfully recorded on blockchain! <br />
          Tx Hash: <code>{txHash}</code>
        </p>
      )}

      <h2 className="text-xl font-semibold mt-6 mb-2">All Consent Records</h2>
      {records.length === 0 ? (
        <p>No consent records yet.</p>
      ) : (
        <ul className="space-y-2">
          {records.map((rec, idx) => (
            <li
              key={idx}
              className="p-2 border rounded bg-gray-50 hover:bg-gray-100"
            >
              <p><b>User ID:</b> {rec.userId}</p>
              <p><b>Date:</b> {new Date(rec.date).toLocaleString()}</p>
              <p><b>Tx Hash:</b> <code>{rec.txHash}</code></p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
