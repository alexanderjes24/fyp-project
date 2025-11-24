// frontend/src/pages/UserAssignments.tsx

import React, { useEffect, useState } from "react";
import { auth } from "../firebaseClient";
import type { Assignment } from "../types/data";
import MentalAssignment from "../components/MentalAssignment";
import { getAssignments, toggleAssignmentComplete } from "../services/assignmentService";

export default function UserAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const loadAssignments = async () => {
    if (!auth.currentUser) return;
    const data = await getAssignments(auth.currentUser.uid);
    setAssignments(data);
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleToggleComplete = async (assignmentId: string) => {
    if (!auth.currentUser) return;
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return;

    await toggleAssignmentComplete(auth.currentUser.uid, assignmentId, !assignment.complete);

    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId ? { ...a, complete: !a.complete } : a
      )
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <MentalAssignment
        assignments={assignments}
        onToggleComplete={handleToggleComplete}
      />
    </div>
  );
}
