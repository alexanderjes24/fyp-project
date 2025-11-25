import { CheckCircle } from "lucide-react";
import type { Assignment } from "../types/data";

interface MentalAssignmentProps {
  assignments: Assignment[];
  onToggleComplete: (assignmentId: string) => void;
}

const MentalAssignment = ({ assignments, onToggleComplete }: MentalAssignmentProps) => {
  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <div
          key={assignment.id}
          className={`flex items-center p-4 rounded-lg shadow-md transition duration-300 ${
            assignment.complete
              ? "bg-green-50 border-l-4 border-green-500"
              : "bg-white border-l-4 border-blue-500 hover:shadow-lg"
          }`}
        >
          {/* Clickable title opens assignment link */}
          <div className="flex-1">
            <h3
              className={`font-semibold text-lg cursor-pointer ${
                assignment.complete ? "line-through text-gray-500" : "text-gray-800"
              }`}
              onClick={() => window.open(assignment.link, "_blank")}
            >
              {assignment.title}
            </h3>
            <p className="text-sm text-gray-600">{assignment.description}</p>
            <p className="text-xs text-gray-400">Type: {assignment.type}</p>
          </div>

          {/* Toggle complete/incomplete */}
          <button
            onClick={() => onToggleComplete(assignment.id)}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition 
              ${assignment.complete ? "bg-green-500 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
          >
            <CheckCircle className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default MentalAssignment;
