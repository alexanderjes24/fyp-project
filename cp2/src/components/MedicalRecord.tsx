import { useState } from "react";
import { getAuth } from "firebase/auth";

interface Props {
  userId: string;
}

export default function MedicalRecord({ userId }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const therapistId = auth.currentUser?.uid;

  const handleSave = async () => {
    if (!title || !description) return alert("Fill all fields");
    setLoading(true);

    // Create simple hash placeholder for blockchain
    const hash = btoa(title + description + userId + new Date().toISOString());

    try {
      const res = await fetch("http://localhost:3000/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          therapistId,
          title,
          description,
          blockchainHash: hash,
        }),
      });

      if (!res.ok) throw new Error("Failed to save record");

      alert("Medical record saved successfully!");
      setTitle("");
      setDescription("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-2xl mx-auto space-y-4">
      <h3 className="text-xl font-bold">Add Medical Record</h3>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        rows={5}
      />
      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full py-2 bg-blue-600 text-white rounded"
      >
        {loading ? "Saving..." : "Save Record"}
      </button>
    </div>
  );
}
