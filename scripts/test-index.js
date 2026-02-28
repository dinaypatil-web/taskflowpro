
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountStr) {
    console.error('FIREBASE_SERVICE_ACCOUNT not found in .env');
    process.exit(1);
}

try {
    const serviceAccount = JSON.parse(serviceAccountStr);
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
} catch (e) {
    console.error('Failed to initialize Admin SDK:', e);
    process.exit(1);
}

const db = admin.firestore();
const userId = 'cLhsidbqXoSIjZeKHD87';

async function testQueries() {
    console.log(`Testing queries for userId: ${userId}`);

    const queries = [
        {
            name: 'Tasks List (createdAt)',
            query: db.collection('tasks')
                .where('userId', '==', userId)
                .where('isDeleted', '==', false)
                .orderBy('createdAt', 'desc')
        },
        {
            name: 'Recent Tasks (updatedAt)',
            query: db.collection('tasks')
                .where('userId', '==', userId)
                .where('isDeleted', '==', false)
                .orderBy('updatedAt', 'desc')
        },
        {
            name: 'Stakeholders List',
            query: db.collection('stakeholders')
                .where('userId', '==', userId)
                .where('deletedAt', '==', null)
                .orderBy('firstName', 'asc')
        }
    ];

    for (const q of queries) {
        console.log(`\n--- Testing: ${q.name} ---`);
        try {
            const snapshot = await q.query.limit(5).get();
            console.log(`✅ Success! Found ${snapshot.size} documents.`);
        } catch (e) {
            console.error(`❌ Failed!`);
            console.error(e.message);
        }
    }
}

testQueries().then(() => process.exit(0)).catch(console.error);
