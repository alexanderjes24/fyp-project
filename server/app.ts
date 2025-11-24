import Fastify from "fastify";
import cors from "@fastify/cors";
import firebasePlugin from "./plugins/firebase";
import authRoutes from "./routes/auth.js";
import counterRoutes from "./routes/counter.js";
import consentRoutes from "./routes/consent.js";
import quizRoutes from "./routes/quiz.js";

async function startServer() {
  const fastify = Fastify({ logger: true });

  // CORS
  await fastify.register(cors, {
    origin: ["http://localhost:5173"],
    credentials: true,
  });

  // Plugins
  await fastify.register(firebasePlugin);

  // Routes
  await fastify.register(authRoutes, { prefix: "/auth" });
  await fastify.register(counterRoutes, { prefix: "/counter" });
  await fastify.register(consentRoutes,{ prefix: "/consent" });
  fastify.register(quizRoutes);
  // Start server
  
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("🚀 Server running at http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

startServer();
