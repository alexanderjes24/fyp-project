import { db } from "../firebaseClient";
import { collection, addDoc } from "firebase/firestore";

export async function saveQuizAnswers(userId: string, answers: any[]) {
  try {
    const ref = collection(db, "quizResponses");

    await addDoc(ref, {
      userId,
      answers,
      createdAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Error saving quiz answers:", error);
    throw error;
  }
}
