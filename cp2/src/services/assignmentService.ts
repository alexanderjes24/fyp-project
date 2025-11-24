import {
  doc,
  setDoc,
  getDocs,
  collection,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebaseClient";
import type { Assignment } from "../types/data";

// Create assignment for user
export async function createAssignment(
  userId: string,
  data: Omit<Assignment, "id">
) {
  const id = crypto.randomUUID();

  await setDoc(doc(db, "assignments", userId, "items", id), {
    ...data,
    createdAt: Timestamp.now(),
    complete: false,
  });

  return id;
}

// Get all assignments for a user
export async function getAssignments(
  userId: string
): Promise<Assignment[]> {
  const snap = await getDocs(collection(db, "assignments", userId, "items"));
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Assignment, "id">),
  }));
}

// Mark assignment as complete (always true)
export async function completeAssignment(
  userId: string,
  assignmentId: string
) {
  await updateDoc(doc(db, "assignments", userId, "items", assignmentId), {
    complete: true,
  });
}

// Toggle assignment complete (true/false)
export async function toggleAssignmentComplete(
  userId: string,
  assignmentId: string,
  newValue: boolean
) {
  await updateDoc(doc(db, "assignments", userId, "items", assignmentId), {
    complete: newValue,
  });
}
