// src/services/assignmentService.ts
import {
  setDoc,
  getDocs,
  doc,
  collection,
  updateDoc,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebaseClient";
import type { Assignment } from "../types/data";

// CREATE SINGLE ASSIGNMENT
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

// GET ALL ASSIGNMENTS
export async function getAssignments(userId: string): Promise<Assignment[]> {
  const snap = await getDocs(collection(db, "assignments", userId, "items"));
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Assignment, "id">),
  }));
}

// UPDATE COMPLETE STATUS
export async function updateAssignmentComplete(
  userId: string,
  assignmentId: string,
  complete: boolean
) {
  await updateDoc(doc(db, "assignments", userId, "items", assignmentId), {
    complete,
  });
}

// DELETE DUPLICATE ASSIGNMENTS
export async function removeDuplicateAssignments(userId: string) {
  const snap = await getDocs(collection(db, "assignments", userId, "items"));
  const seenTitles = new Set<string>();

  for (const docSnap of snap.docs) {
    const data = docSnap.data() as Assignment;
    if (seenTitles.has(data.title)) {
      // Duplicate found, delete it
      await deleteDoc(doc(db, "assignments", userId, "items", docSnap.id));
    } else {
      seenTitles.add(data.title);
    }
  }
}

// GENERATE DEFAULT ASSIGNMENTS (SAFE + NO DUPLICATES)
export async function generateDefaultAssignments(userId: string) {
  // First, remove duplicates if any
  await removeDuplicateAssignments(userId);

  const defaultAssignments: Omit<Assignment, "id">[] = [
    {
      type: "Watch",
      title: "Guided Meditation (5 minutes)",
      description: "A short meditation session to help calm your mind.",
      youtubeId: "inpok4MKVLM",
      complete: false,
    },
    {
      type: "Watch",
      title: "Relaxing Music for Stress Relief",
      description: "Listen to soothing background music for relaxation.",
      youtubeId: "2OEL4P1Rz04",
      complete: false,
    },
    {
      type: "Watch",
      title: "Mindfulness Basics",
      description: "Learn what mindfulness is and how it helps mental health.",
      youtubeId: "wfDTp2GogaQ",
      complete: false,
    },
    {
      type: "Watch",
      title: "Breathing Exercise",
      description: "Follow along with this calming breathing exercise.",
      youtubeId: "nmFUDkj1Aq0",
      complete: false,
    },
    {
      type: "Watch",
      title: "Good Sleep Meditations",
      description: "Relax your body and prepare for deep sleep.",
      youtubeId: "u6HG_sqpLtM",
      complete: false,
    },
  ];

  // Fetch existing assignments after removing duplicates
  const snap = await getDocs(collection(db, "assignments", userId, "items"));
  const existingTitles = new Set(snap.docs.map(d => (d.data() as Assignment).title));

  // Create missing assignments
  for (const assignment of defaultAssignments) {
    if (!existingTitles.has(assignment.title)) {
      await createAssignment(userId, assignment);
    }
  }
}

export async function therapistCreateAssignment(
  therapistId: string,
  data: Omit<Assignment, "id">
) {
  const id = crypto.randomUUID();
  await setDoc(doc(db, "assignments", therapistId, "items", id), {
    ...data,
    createdAt: Timestamp.now(),
    complete: false,
  });
  return id;
}

// DELETE ASSIGNMENT BY ID
export async function therapistDeleteAssignment(
  therapistId: string,
  assignmentId: string
) {
  await deleteDoc(doc(db, "assignments", therapistId, "items", assignmentId));
}

// GET ALL ASSIGNMENTS (therapist view)
export async function therapistGetAssignments(therapistId: string) {
  const snap = await getDocs(collection(db, "assignments", therapistId, "items"));
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Assignment, "id">),
  }));
}