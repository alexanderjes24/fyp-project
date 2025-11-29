import { useState, useEffect } from "react";
import type { Assignment } from "../types/data";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Assignment, "id">) => void;
  initialData?: Partial<Assignment>;
}

export default function AssignmentModal({ open, onClose, onSave, initialData }: Props) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [youtubeId, setYoutubeId] = useState(initialData?.youtubeId || "");

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setYoutubeId(initialData.youtubeId || "");
    }
  }, [initialData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-96">
        <h2 className="text-xl font-bold mb-4">{initialData ? "Edit Assignment" : "Add Assignment"}</h2>

        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 rounded"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="YouTube ID"
            value={youtubeId}
            onChange={(e) => setYoutubeId(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({ title, description, youtubeId, type: "Watch", complete: false });
              onClose();
            }}
            className="px-4 py-2 rounded bg-green-500 text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
