import { useEffect, useState } from "react";
import { auth } from "../firebaseClient";
import type { Assignment } from "../types/data";
import MentalAssignment from "../components/MentalAssignment";
import {
  getAssignments,
  updateAssignmentComplete,
} from "../services/assignmentService";
import { addAssignment, editAssignment, deleteAssignment } from "../services/therapistService";
import AssignmentModal from "../components/AssignmentModal";

export default function UserAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [role, setRole] = useState<"user" | "therapist">("user");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const userId = auth.currentUser?.uid;

  // Fetch role from backend
  const fetchRole = async () => {
    if (!userId) return;
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch("http://localhost:3000/auth/get-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (data.role) setRole(data.role);
  };

  // Load assignments
  const loadAssignments = async () => {
    if (!userId) return;
    const data = await getAssignments(userId);
    setAssignments(data);
  };

  useEffect(() => {
    fetchRole();
    loadAssignments();
  }, [userId]);

  // Toggle complete for normal users
  const handleToggleComplete = async (id: string) => {
    if (!userId) return;
    const a = assignments.find((x) => x.id === id);
    if (!a) return;

    await updateAssignmentComplete(userId, id, !a.complete);
    setAssignments((prev) =>
      prev.map((x) => (x.id === id ? { ...x, complete: !x.complete } : x))
    );
  };

  // Therapist handlers
  const handleDelete = async (assignmentId: string) => {
    if (!userId) return;
    await deleteAssignment(userId, assignmentId);
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
  };

  const handleEdit = (assignmentId: string) => {
    const a = assignments.find((x) => x.id === assignmentId);
    if (!a) return;
    setEditingAssignment(a);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingAssignment(null);
    setModalOpen(true);
  };

  const handleSave = async (data: Omit<Assignment, "id">) => {
    if (!userId) return;

    if (editingAssignment) {
      // Edit existing assignment
      await editAssignment(userId, editingAssignment.id, data);
      setAssignments((prev) =>
        prev.map((a) => (a.id === editingAssignment.id ? { ...a, ...data } : a))
      );
    } else {
      // Add new assignment
      const res = await addAssignment(userId, data);
      setAssignments((prev) => [...prev, { id: res.id, ...data }]);
    }
    setModalOpen(false);
  };

  const selectedAssignment = assignments.find((a) => a.id === selected);

  return (
    <div className="max-w-4xl mx-auto p-6 pt-24 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* LEFT — LIST */}
      <div>
        <h1 className="text-2xl font-bold mb-4">Your Assignments</h1>
        <MentalAssignment
          assignments={assignments}
          selectedId={selected}
          onSelect={setSelected}
          onToggleComplete={handleToggleComplete}
          role={role}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onAdd={handleAdd}
        />
      </div>

      {/* RIGHT — CONTENT */}
      <div className="bg-white shadow p-4 rounded-xl h-fit">
        {selectedAssignment ? (
          <>
            <h2 className="text-xl font-bold mb-2">{selectedAssignment.title}</h2>
            <p className="text-gray-600 mb-4">{selectedAssignment.description}</p>
            {selectedAssignment.youtubeId && (
              <iframe
                src={`https://www.youtube.com/embed/${selectedAssignment.youtubeId}`}
                className="w-full h-64 md:h-80 rounded-xl"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </>
        ) : (
          <p className="text-gray-500">Select an assignment to view content.</p>
        )}
      </div>

      {/* Modal for Add/Edit */}
      <AssignmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editingAssignment || undefined}
        onSave={handleSave}
      />
    </div>
  );
}
