import { useState } from "react";

export interface MedicalRecordData {
  diagnosis: string;
  prescription: string;
  notes: string;
}

interface MedicalRecordModalProps {
  onSubmit: (data: MedicalRecordData) => void;
  isSubmitting: boolean;
}

export default function MedicalRecord({
  onSubmit,
  isSubmitting,
}: MedicalRecordModalProps) {
  const [formData, setFormData] = useState<MedicalRecordData>({
    diagnosis: "",
    prescription: "",
    notes: "",
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-indigo-600 p-6">
          <h3 className="text-white text-xl font-bold">
            Session Conclusion & Records
          </h3>
          <p className="text-indigo-100 text-sm mt-1">
            This data will be hashed and secured on the blockchain.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clinical Diagnosis
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Mild Anxiety Disorder"
              value={formData.diagnosis}
              onChange={(e) =>
                setFormData({ ...formData, diagnosis: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Notes (Private)
            </label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-lg h-24 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Patient showed signs of improvement..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prescription / Recommendation
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Daily Meditation, 10mg X..."
              value={formData.prescription}
              onChange={(e) =>
                setFormData({ ...formData, prescription: e.target.value })
              }
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t mt-4">
            <button
              disabled={isSubmitting}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2
                                ${
                                  isSubmitting
                                    ? "bg-indigo-400 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg"
                                }
                            `}
              onClick={() => onSubmit(formData)}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                  Hashing & Storing on Chain...
                </>
              ) : (
                <>🔒 Sign & Save to Blockchain</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}