
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env') });

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountStr) {
    console.error('FIREBASE_SERVICE_ACCOUNT not found in .env');
    process.exit(1);
}

try {
    const serviceAccount = JSON.parse(serviceAccountStr);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
} catch (e) {
    console.error('Failed to initialize Admin SDK:', e);
    process.exit(1);
}

const db = admin.firestore();

async function checkStakeholders() {
    const results: any = {
        timestamp: new Date().toISOString(),
        totalDocuments: 0,
        samples: [],
        missingUserIdCount: 0,
        deletedDocsCount: 0,
        errors: []
    };

    try {
        const allDocs = await db.collection('stakeholders').get();
        results.totalDocuments = allDocs.size;

        if (allDocs.empty) {
            results.message = 'No stakeholders found in the collection.';
        } else {
            const sampleSize = Math.min(allDocs.size, 10);
            allDocs.docs.slice(0, sampleSize).forEach(doc => {
                const data = doc.data();
                results.samples.push({
                    id: doc.id,
                    userId: data.userId,
                    deletedAt: data.deletedAt,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    allKeys: Object.keys(data)
                });

                if (!data.userId) results.missingUserIdCount++;
                if (data.deletedAt !== null && data.deletedAt !== undefined) results.deletedDocsCount++;
            });
        }
    } catch (e: any) {
        results.errors.push(e.message);
    }

    fs.writeFileSync(path.join(__dirname, '../debug_stakeholders.json'), JSON.stringify(results, null, 2));
    console.log('Results written to debug_stakeholders.json');
}

checkStakeholders().then(() => process.exit(0)).catch(console.error);
