import { auth } from "../firebaseClient";
import type { Assignment } from "../types/data";

const API_URL = "http://localhost:3000/therapist";

async function getToken() {
  return await auth.currentUser?.getIdToken();
}

export async function addAssignment(userId: string, data: Omit<Assignment, "id">) {
  const token = await getToken();
  const res = await fetch(`${API_URL}/assignment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, data }),
  });
  return res.json();
}

export async function editAssignment(userId: string, assignmentId: string, data: Partial<Assignment>) {
  const token = await getToken();
  const res = await fetch(`${API_URL}/assignment`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, assignmentId, data }),
  });
  return res.json();
}

export async function deleteAssignment(userId: string, assignmentId: string) {
  const token = await getToken();
  const res = await fetch(`${API_URL}/assignment`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, assignmentId }),
  });
  return res.json();
}
