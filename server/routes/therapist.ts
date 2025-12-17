// server/routes/therapist.ts

import { FastifyInstance } from "fastify";
import admin from "firebase-admin";
import crypto from "crypto";
import { getVerifiedCredential, storeCredentialHash } from "../blockchain/credential";
import { storeMedicalRecordHash } from "../blockchain/record";

interface SubmitCredsBody {
    uid: string;
    name: string;
    university: string;
    license: string;
    dateOfLicense: string; // ISO string
}

interface SubmitMedicalRecordBody {
    bookingId: string;
    therapistId: string; // Used for verification
    diagnosis: string;
    prescription: string;
    notes: string;
}

// Interface matching the frontend QuizResponse type (RENAMED)
interface QuizResponse {
    answers: { question: string; answer: string }[];
    lastTaken: string;
}

type ApprovalStatus = "pending" | "approved" | "rejected";

// --- Helper Data: MUST BE COMPLETED WITH YOUR ACTUAL QUIZ QUESTIONS ---
const QUESTIONS_MAP: { [key: number]: string } = {
    1: "What area of your life are you currently struggling with most?",
    2: "On a scale of 1 to 10, how would you rate your current stress level?",
    3: "Have you recently experienced a significant life event?",
    4: "Please describe your primary emotional challenge right now.",
    5: "Are you ready to commit to weekly therapy sessions?",
    // NOTE: Add all your quiz questions here for the lookup to work correctly.
};
// ---------------------------------------------------------------------

export default async function therapistRoutes(fastify: FastifyInstance) {
    const db = admin.firestore();

    // -----------------------------
    // Middleware: Verify Firebase Token for protected routes
    // -----------------------------
    fastify.addHook("preHandler", async (request, reply) => {
        if (
            request.url.startsWith("/therapist/check-credentials") ||
            request.url.startsWith("/therapist/submit-credentials") ||
            request.url.startsWith("/therapist/approve-cred") ||
            request.url.startsWith("/therapist/medical-record") ||
            request.url.startsWith("/therapist/quiz-results") // <--- FIX APPLIED HERE
        ) {
            const token = request.headers.authorization?.split(" ")[1];
            if (!token) return reply.code(401).send({ error: "Unauthorized: Missing token" });

            try {
                const decoded = await admin.auth().verifyIdToken(token);
                (request as any).user = decoded;
            } catch (err) {
                return reply.code(401).send({ error: "Unauthorized: Invalid token" });
            }
        }
    });

    // -----------------------------
    // Check if therapist has credentials (protected)
    // -----------------------------
    fastify.get("/check-credentials", async (request, reply) => {
        const uid = (request.query as any).uid || (request as any).user.uid;
        const docSnap = await db.collection("therapistCredentials").doc(uid).get();
        reply.send({ hasCreds: docSnap.exists, credentials: docSnap.data() || null });
    });

    // -----------------------------
    // Submit therapist credentials (protected)
    // -----------------------------
    fastify.post<{ Body: SubmitCredsBody }>("/submit-credentials", async (request, reply) => {
        const { uid, name, university, license, dateOfLicense } = request.body;
        const currentUser = (request as any).user;

        if (currentUser.uid !== uid && currentUser.role !== "admin") {
            return reply.code(403).send({ error: "Forbidden" });
        }

        const credentials = {
            name,
            university,
            license,
            dateOfLicense,
            approval: "pending" as ApprovalStatus,
            createdAt: new Date(),
            hash: null, // placeholder for blockchain hash later
            txHash: null,
        };

        await db.collection("therapistCredentials").doc(uid).set(credentials);
        reply.send({ success: true, credentials });
    });


    // ------------------------------------
    // Create and Hash Medical Record (Protected)
    // ------------------------------------
    fastify.post<{ Body: SubmitMedicalRecordBody }>(
        "/medical-record/create",
        async (request, reply) => {
            const { bookingId, therapistId, diagnosis, prescription, notes } = request.body;
            const currentUser = (request as any).user;

            // 1. Authorization Check
            if (currentUser.uid !== therapistId) {
                return reply.code(403).send({ error: "Forbidden: Not authorized to submit this record." });
            }

            // 2. Booking Verification
            const bookingDoc = await db.collection("bookings").doc(bookingId).get();
            if (!bookingDoc.exists || bookingDoc.data()?.therapistId !== therapistId) {
                return reply.code(403).send({ error: "Forbidden: Booking not found or not assigned to you." });
            }

            try {
                // 3. Generate SHA-256 Hash
                const dataToHash = {
                    bookingId,
                    therapistId,
                    diagnosis,
                    prescription,
                    notes,
                };

                const hash = crypto
                    .createHash("sha256")
                    .update(JSON.stringify(dataToHash))
                    .digest("hex");

                const formattedHash = `0x${hash}`;
                let txHash: string;

                // 4. Store Hash on Blockchain
                try {
                    const receipt = await storeMedicalRecordHash(bookingId, therapistId, formattedHash);
                    txHash = receipt.hash;
                } catch (err: any) {
                    console.error("Blockchain storage for medical record failed:", err.message);
                    return reply.status(500).send({ error: "Blockchain Transaction Failed: " + err.message });
                }

                // 5. Update Firestore (The Official Record)
                const recordData = {
                    bookingId,
                    therapistId,
                    diagnosis,
                    prescription,
                    notes,
                    timestamp: new Date().toISOString(),
                    blockchainHash: formattedHash,
                    txHash,
                };

                await db.collection("medicalRecords").doc(bookingId).set(recordData);

                // 6. Respond to frontend
                return {
                    success: true,
                    message: "Record secured and submitted.",
                    hash: formattedHash,
                    txHash,
                };

            } catch (err: any) {
                console.error("Error in medical record creation:", err);
                reply.status(500).send({ error: err.message || "Internal server error." });
            }
        }
    );
    fastify.get("/medical-record/:bookingId", async (request, reply) => {
        const { bookingId } = request.params as { bookingId: string };
        const currentUser = (request as any).user;

        if (!currentUser) {
            return reply.code(401).send({ error: "Unauthorized" });
        }

        try {
            // 1. Fetch record from Firestore
            const recordDoc = await db.collection("medicalRecords").doc(bookingId).get();

            if (!recordDoc.exists) {
                return reply.code(404).send({ error: "Medical record not found." });
            }

            const recordData = recordDoc.data();

            // 2. Authorization Check: Ensure only the therapist who wrote it (or an admin) can see it
            if (recordData?.therapistId !== currentUser.uid && currentUser.role !== "admin") {
                return reply.code(403).send({ error: "Forbidden: You are not authorized to view this record." });
            }

            // 3. Return the record formatted for the frontend
            return reply.send({
                success: true,
                record: {
                    diagnosis: recordData?.diagnosis,
                    prescription: recordData?.prescription,
                    notes: recordData?.notes,
                    blockchainHash: recordData?.blockchainHash,
                    timestamp: recordData?.timestamp,
                }
            });

        } catch (err: any) {
            console.error("Error fetching medical record:", err);
            reply.status(500).send({ error: "Failed to fetch medical record." });
        }
    });
    // ------------------------------------
    // NEW: Get Quiz Results by User ID (Patient)
    // ------------------------------------
    fastify.get("/quiz-results", async (request, reply) => {
        const { userId } = request.query as { userId: string };
        const currentUser = (request as any).user;

        // Note: The preHandler now verifies the token and populates currentUser.
        // This check is now effective and important for authorization.
        if (!currentUser || !currentUser.uid) {
             return reply.code(401).send({ error: "Unauthorized: Must be logged in." });
        }
        if (!userId) {
            return reply.code(400).send({ error: "Missing userId parameter." });
        }

        try {
            // Find the latest quiz result for the given userId
            const quizSnapshot = await db.collection("quizResponses") // Collection name remains 'quizResults'
                .where("userId", "==", userId)
                .orderBy("createdAt", "desc") 
                .limit(1)
                .get();

            if (quizSnapshot.empty) {
                // Crucial: Return a clean response on no data found.
                return reply.send({ quiz: null, message: "No quiz results found for this user." });
            }

            const latestQuiz = quizSnapshot.docs[0].data();
            
            // --- DATA TRANSFORMATION: Mapping question IDs to text ---
            const detailedAnswers: { question: string; answer: string }[] = latestQuiz.answers.map((qa: any) => {
                const questionText = QUESTIONS_MAP[qa.questionId] || `Question ID ${qa.questionId} (Text Missing)`;
                
                // Ensure answer value is a string for display
                const answerText = typeof qa.answerValue === 'number' 
                                   ? qa.answerValue.toString() 
                                   : qa.answerValue;

                return {
                    question: questionText,
                    answer: answerText,
                };
            });
            // --- END TRANSFORMATION ---

            // Format the final data structure, using the new interface name
            const formattedQuiz: QuizResponse = {
                answers: detailedAnswers, 
                // Safely convert Firestore Timestamp to a displayable date string
                lastTaken: latestQuiz.createdAt && latestQuiz.createdAt.toDate 
                             ? latestQuiz.createdAt.toDate().toLocaleDateString() 
                             : "N/A",
            };
            
            return reply.send({ quiz: formattedQuiz });

        } catch (err: any) {
            console.error("Error fetching quiz results:", err);
            reply.status(500).send({ error: "Failed to fetch quiz results." });
        }
    });


    // -----------------------------
    // Public: Get all therapists with credentials
    // -----------------------------
    fastify.get("/all-therapists", async (request, reply) => {
        const { uid } = request.query as { uid?: string };

        if (uid) {
            const docSnap = await db.collection("therapistCredentials").doc(uid).get();
            if (!docSnap.exists) return reply.code(404).send({ error: "Therapist not found" });
            return reply.send({ credentials: docSnap.data() });
        }

        const snapshot = await db.collection("therapistCredentials").get();
        const therapists = snapshot.docs.map((doc) => ({ uid: doc.id, ...(doc.data() as any) }));
        reply.send({ therapists });
    });

    // -----------------------------
    // Public: Verify Credential on Chain
    // -----------------------------
    fastify.get("/verify-cred/:uid", async (req, reply) => {
  const { uid } = req.params as { uid: string };

  try {
    // 1. Get current data from Firestore
    const docRef = db.collection("therapistCredentials").doc(uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return reply.status(404).send({ verified: false, message: "No record in database." });
    }

    const data = docSnap.data() as any;

    // 2. RE-GENERATE HASH (MUST match Admin Dashboard logic exactly)
    // We use JSON.stringify because that's what approve-cred uses
    const currentHash = crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          uid: uid,
          name: data.name,
          university: data.university,
          license: data.license,
          dateOfLicense: data.dateOfLicense,
        })
      )
      .digest("hex");

    // 3. Get the original hash from Blockchain
    const blockchainData = await getVerifiedCredential(uid);

    if (!blockchainData || !blockchainData.hash) {
      return reply.send({ verified: false, message: "Not found on blockchain." });
    }

    // 4. Compare
    const isVerified = (currentHash === blockchainData.hash);

    return reply.send({
      verified: isVerified,
      hash: blockchainData.hash,     // The "True" hash
      currentHash: currentHash,      // The "Calculated" hash
      timestamp: blockchainData.timestamp
    });

  } catch (err: any) {
    reply.status(500).send({ error: "Verification failed: " + err.message });
  }
});
}