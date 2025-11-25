import { setDoc, getDocs, doc, collection, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebaseClient";
import type { Assignment } from "../types/data";

// Create a single assignment
export async function createAssignment(userId: string, data: Omit<Assignment, "id">) {
  const id = crypto.randomUUID();

  await setDoc(doc(db, "assignments", userId, "items", id), {
    ...data,
    createdAt: Timestamp.now(),
    complete: false,
  });

  return id;
}

// Get all assignments for a user
export async function getAssignments(userId: string): Promise<Assignment[]> {
  const snap = await getDocs(collection(db, "assignments", userId, "items"));
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Assignment, "id">),
  }));
}

// Toggle complete status
export async function updateAssignmentComplete(userId: string, assignmentId: string, complete: boolean) {
  await updateDoc(doc(db, "assignments", userId, "items", assignmentId), { complete });
}

// Generate default assignments if user has none
export async function generateDefaultAssignments(userId: string) {
  const defaultAssignments: Omit<Assignment, "id">[] = [
    {
      type: "Listen",
      title: "Relaxing Music",
      description: "Listen to calming music for 10 minutes",
      link: "https://www.youtube.com/watch?v=2OEL4P1Rz04",
      complete: false,
    },
    {
      type: "Read",
      title: "Mindfulness Article",
      description: "Read an article about mindfulness",
      link: "https://www.mindful.org/what-is-mindfulness/",
      complete: false,
    },
    {
      type: "Watch",
      title: "Guided Meditation",
      description: "Watch a 5-minute guided meditation video",
      link: "https://www.youtube.com/watch?v=inpok4MKVLM",
      complete: false,
    },
  ];

  for (const assignment of defaultAssignments) {
    await createAssignment(userId, assignment);
  }
}
