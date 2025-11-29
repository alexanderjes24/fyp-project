import { CheckCircle } from "lucide-react";
import { X } from "lucide-react";
import type { Assignment } from "../types/data";

interface Props {
  assignments: Assignment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleComplete: (id: string) => void;
  role: "user" | "therapist";
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onAdd?: () => void; // Added onAdd prop
}

export default function MentalAssignment({
  assignments,
  selectedId,
  onSelect,
  onToggleComplete,
  role,
  onDelete,
  onEdit,
  onAdd,
}: Props) {
  return (
    <div className="space-y-4">
      {assignments.map((a) => (
        <div
          key={a.id}
          className={`p-4 rounded-xl shadow cursor-pointer ${
            a.complete
              ? "bg-green-50"
              : selectedId === a.id
              ? "bg-indigo-50"
              : "bg-white hover:shadow-lg"
          }`}
          onClick={() => onSelect(a.id)}
        >
          <div className="flex justify-between items-center">
            <div>
              <h2
                className={`font-semibold ${
                  a.complete ? "line-through text-gray-500" : ""
                }`}
              >
                {a.title}
              </h2>
              <p className="text-gray-600 text-sm">{a.description}</p>
            </div>

            <div className="flex items-center gap-2">
              {role === "user" && (
                a.complete ? (
                  <X
                    className="text-red-500 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(a.id);
                    }}
                  />
                ) : (
                  <CheckCircle
                    className="text-indigo-600 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(a.id);
                    }}
                  />
                )
              )}

              {role === "therapist" && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(a.id);
                    }}
                    className="text-blue-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(a.id);
                    }}
                    className="text-red-500"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {role === "therapist" && onAdd && (
        <button
          onClick={onAdd}
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
        >
          Add Assignment
        </button>
      )}
    </div>
  );
}
