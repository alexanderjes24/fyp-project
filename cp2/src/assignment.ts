import { generateDefaultAssignments } from "./services/assignmentService"; // adjust path if needed

async function restoreAssignmentsForUser(userId: string) {
  await generateDefaultAssignments(userId);
  console.log("Default assignments restored!");
}

// Replace with the actual user ID
restoreAssignmentsForUser("USER_ID_HERE").catch(console.error);
