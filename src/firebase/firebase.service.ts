// src/firebase/firebase.service.ts
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseUserDto } from './firebase.dto';
import { ConfigService } from '@nestjs/config'; // <--- THIS IS CRITICAL

@Injectable()
export class FirebaseService {
  private readonly db: admin.database.Database;

  constructor(private configService: ConfigService) {
    if (!admin.apps.length) {
      console.log('Firebase App not initialized. Attempting initialization...');

      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>(
        'FIREBASE_CLIENT_EMAIL',
      );
      const privateKeyEnv = this.configService.get<string>(
        'FIREBASE_PRIVATE_KEY',
      );
      const databaseURL = this.configService.get<string>(
        'FIREBASE_DATABASE_URL',
      );
      const processedPrivateKey = privateKeyEnv?.replace(/\\n/g, '\n');

      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: projectId,
            clientEmail: clientEmail,
            privateKey: processedPrivateKey,
          }),
          databaseURL: databaseURL,
        });
      } catch (initError) {
        throw new Error('Firebase Admin SDK initialization failed.');
      }
    } else {
      console.log('Firebase App already initialized.');
    }
    this.db = admin.database();
    console.log('Firebase DB instance obtained.');
  }

  getDb(): admin.database.Database {
    return this.db;
  }

  async createUser(userId: string, data: FirebaseUserDto): Promise<void> {
    try {
      await this.db.ref(`users/${userId}`).set(data);
      // console.log(` User stored in Firebase at users/${userId}`);
    } catch (error) {
      console.error('Data that failed to store:', data);
    }
  }
}
