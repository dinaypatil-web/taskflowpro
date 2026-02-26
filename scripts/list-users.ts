
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

async function checkUsers() {
    const results: any = {
        timestamp: new Date().toISOString(),
        totalUsers: 0,
        users: []
    };

    try {
        const allDocs = await db.collection('users').get();
        results.totalUsers = allDocs.size;

        allDocs.docs.forEach(doc => {
            const data = doc.data();
            results.users.push({
                id: doc.id,
                email: data.email,
                firstName: data.firstName
            });
        });
    } catch (e: any) {
        results.errors = [e.message];
    }

    fs.writeFileSync(path.join(__dirname, '../debug_users.json'), JSON.stringify(results, null, 2));
    console.log('Results written to debug_users.json');
}

checkUsers().then(() => process.exit(0)).catch(console.error);
