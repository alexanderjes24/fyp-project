// src/components/MentalAssignment.tsx

import React from "react";
import { Music, Film, BookOpen, CheckCircle } from "lucide-react";
import type { Assignment } from "../types/data";

interface MentalAssignmentProps {
  assignments: Assignment[];
  onToggleComplete: (assignmentId: string) => void; // ✅ FIXED (string)
}

const MentalAssignment: React.FC<MentalAssignmentProps> = ({
  assignments,
  onToggleComplete,
}) => {
  return (
    <div className="p-6 bg-gray-50 rounded-xl shadow-inner">
      <h2 className="text-2xl font-bold text-blue-800 mb-6">
        Your Mental Assignments
      </h2>

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
            {/* Icon */}
            <div className="mr-4">
              {assignment.type === "Listen" && (
                <Music className="text-blue-600 w-6 h-6" />
              )}
              {assignment.type === "Watch" && (
                <Film className="text-purple-600 w-6 h-6" />
              )}
              {assignment.type === "Read" && (
                <BookOpen className="text-orange-600 w-6 h-6" />
              )}
            </div>

            {/* Title + Description */}
            <div className="flex-1">
              <h3
                className={`font-semibold text-lg ${
                  assignment.complete
                    ? "line-through text-gray-500"
                    : "text-gray-800"
                }`}
              >
                {assignment.title}
              </h3>
              <p className="text-sm text-gray-600">
                {assignment.description}
              </p>
            </div>

            {/* Complete Button */}
            <button
              onClick={() => onToggleComplete(assignment.id)} // ✅ string ID
              className={`w-10 h-10 flex items-center justify-center rounded-full transition duration-300 ${
                assignment.complete
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-green-100 hover:text-green-600"
              }`}
            >
              <CheckCircle className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MentalAssignment;
