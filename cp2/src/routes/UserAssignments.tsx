import { useEffect, useState } from "react";
import { auth } from "../firebaseClient";
import type { Assignment } from "../types/data";
import MentalAssignment from "../components/MentalAssignment";
import { getAssignments, updateAssignmentComplete, generateDefaultAssignments } from "../services/assignmentService";

export default function UserAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const userId = auth.currentUser?.uid;

  // Load assignments from Firestore
  const loadAssignments = async () => {
    if (!userId) return;

    let data = await getAssignments(userId);

    // Generate default assignments if empty
    if (data.length === 0) {
      await generateDefaultAssignments(userId);
      data = await getAssignments(userId);
    }

    setAssignments(data);
  };

  useEffect(() => {
    loadAssignments();
  }, [userId]);

  // Toggle complete/incomplete
  const handleToggleComplete = async (assignmentId: string) => {
    if (!userId) return;
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    await updateAssignmentComplete(userId, assignmentId, !assignment.complete);

    setAssignments(prev =>
      prev.map(a =>
        a.id === assignmentId ? { ...a, complete: !a.complete } : a
      )
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-6 pt-20">
      <h1 className="text-3xl font-bold mb-6">Your Assignments</h1>
      <MentalAssignment assignments={assignments} onToggleComplete={handleToggleComplete} />
    </div>
  );
}
