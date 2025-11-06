import fp from 'fastify-plugin';
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const serviceAccountPath = path.resolve('./serviceAccountKey.json');

const firebasePlugin = fp(async (fastify) => {
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error('❌ Firebase service account key not found. Place it in the root folder.');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    console.log('🔥 Firebase Admin initialized');
  }

  const db = admin.firestore();

  // Expose Firebase to the app
  fastify.decorate('firebase', admin);
  fastify.decorate('db', db);
});

export default firebasePlugin;
