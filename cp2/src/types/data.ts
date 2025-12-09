// src/types/data.ts

// Define the two main user roles
export type Role = 'user' | 'therapist' | 'admin';

// Used for the MentalAssignment component
export interface Assignment {
  id: string;
  type: "Watch" | "Listen" | "Read";
  title: string;
  description: string;
  youtubeId?: string; // <-- add this
  complete: boolean;
  createdAt?: any; // Firestore timestamp
}


// Used for the ChatInterface component
export interface Message {
  id: string;
  sender: Role | 'system';
  text: string;
  time: string; // e.g., "10:30 PM"
  blockchainTxHash?: string;
}

// Used for the SessionBooking component
export interface AvailableSlot {
  id: number;
  time: string; // e.g., "10:00 AM"
  type: 'Video' | 'Voice Call';
  therapistId: string;
}

// Used for the PreRegistrationQuiz component
export interface QuizAnswer {
  questionId: number;
  answerValue: string | number | string[];
}

export interface Booking {
  id: string; // the document id we generate: therapistId_date_time (encoded)
  userId: string;
  therapistId: string;
  therapistName: string;
  date: string; // yyyy-mm-dd
  time: string; // "10:00 AM"
  type: "Video" | "Phone" | "Live Chat";
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: any; // Firestore Timestamp
  chatId?: string;
}
