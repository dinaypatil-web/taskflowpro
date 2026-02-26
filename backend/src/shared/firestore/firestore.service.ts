import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirestoreService implements OnModuleInit {
    private firestore: admin.firestore.Firestore;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const serviceAccount = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT');

        if (!serviceAccount) {
            // Fallback to default bucket if no service account provided (for local emulator or ADC)
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                });
            }
        } else {
            if (!admin.apps.length) {
                try {
                    const parsedAccount = JSON.parse(serviceAccount);
                    admin.initializeApp({
                        credential: admin.credential.cert(parsedAccount),
                    });
                } catch (error) {
                    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT. Initializing with applicationDefault.', error);
                    admin.initializeApp({
                        credential: admin.credential.applicationDefault(),
                    });
                }
            }
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
}
