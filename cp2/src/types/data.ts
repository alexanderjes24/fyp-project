// src/types/data.ts

// Define the two main user roles
export type Role = 'user' | 'therapist';

// Used for the MentalAssignment component
export interface Assignment {
  id: string;
  type: 'Listen' | 'Watch' | 'Read';
  title: string;
  description: string;
  link: string;
  complete: boolean;
}

// Used for the ChatInterface component
export interface Message {
  id: number;
  sender: Role | 'system';
  text: string;
  time: string; // e.g., "10:30 PM"
  blockchainTxHash?: string;
}

// Used for the SessionBooking component
export interface AvailableSlot {
  id: number;
  time: string; // e.g., "10:00 AM"
  type: 'Video' | 'Phone' | 'Live Chat';
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
  date: string; // yyyy-mm-dd
  time: string; // "10:00 AM"
  type: "Video" | "Phone" | "Live Chat";
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: any; // Firestore Timestamp
  chatId?: string;
}
