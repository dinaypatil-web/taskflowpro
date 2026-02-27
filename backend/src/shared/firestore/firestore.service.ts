import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirestoreService implements OnModuleInit {
    private readonly logger = new Logger(FirestoreService.name);
    private firestore: admin.firestore.Firestore;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        if (admin.apps.length) {
            this.logger.log('Firebase already initialized, reusing existing app.');
            this.firestore = admin.firestore();
            return;
        }

        const serviceAccount = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT');

        if (!serviceAccount) {
            const msg =
                'FIREBASE_SERVICE_ACCOUNT environment variable is not set. ' +
                'Please set it to your Firebase service account JSON key string.';
            this.logger.error(msg);
            throw new Error(msg);
        }

        try {
            const parsedAccount = JSON.parse(serviceAccount);
            admin.initializeApp({
                credential: admin.credential.cert(parsedAccount),
            });
            this.logger.log('Firebase initialized successfully with service account credentials.');
        } catch (error) {
            const msg =
                'Failed to parse FIREBASE_SERVICE_ACCOUNT JSON. ' +
                'Ensure it is a valid, single-line JSON string of your Firebase service account key.';
            this.logger.error(msg, error instanceof Error ? error.message : error);
            throw new Error(msg);
        }

        this.firestore = admin.firestore();
    }

    getDb(): admin.firestore.Firestore {
        return this.firestore;
    }

    collection(collectionPath: string) {
        return this.firestore.collection(collectionPath);
    }

    doc(docPath: string) {
        return this.firestore.doc(docPath);
    }

    // Helper for generating IDs similar to CUID or as a fallback
    generateId(): string {
        return this.firestore.collection('tmp').doc().id;
    }

    /**
     * Safely converts a Firestore value (Timestamp, string, or Date) to a JS Date.
     * Returns null if the value is null, undefined, or invalid.
     */
    static safeToDate(value: any): Date | null {
        if (!value) return null;

        // Firestore Timestamp
        if (typeof value.toDate === 'function') {
            return value.toDate();
        }

        // ISO String or other date string
        if (typeof value === 'string') {
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date;
        }

        // Already a Date object
        if (value instanceof Date) {
            return value;
        }

        return null;
    }
}
