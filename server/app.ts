import Fastify from "fastify";
import cors from "@fastify/cors";
import firebasePlugin from "./plugins/firebase";
import authRoutes from "./routes/auth";  // ✅ import

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: ["http://localhost:5173"], // your frontend
  credentials: true,
});
// ✅ register Firebase first
await fastify.register(firebasePlugin);

// ✅ then register your auth route
await fastify.register(authRoutes);

fastify.listen({
  port: 3000,
  host: "0.0.0.0"
}, (err, address) => {
  if (err) throw err;
  console.log(`✅ Server running at ${address}`);
});
