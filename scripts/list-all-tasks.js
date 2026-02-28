
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

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

async function listAllTasks() {
    const results = {
        timestamp: new Date().toISOString(),
        totalTasks: 0,
        uniqueUserIds: new Set(),
        tasks: []
    };

    try {
        const allTasks = await db.collection('tasks').get();
        results.totalTasks = allTasks.size;

        allTasks.docs.forEach(doc => {
            const data = doc.data();
            results.uniqueUserIds.add(data.userId);
            results.tasks.push({
                id: doc.id,
                title: data.title,
                userId: data.userId,
                createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null
            });
        });

        results.uniqueUserIds = Array.from(results.uniqueUserIds);
    } catch (e) {
        console.error(e.message);
    }

    console.log(`Found ${results.totalTasks} tasks for ${results.uniqueUserIds.length} users.`);
    console.log('Unique User IDs:', results.uniqueUserIds);

    fs.writeFileSync(path.join(__dirname, '../all_tasks_debug.json'), JSON.stringify(results, null, 2));
}

listAllTasks().then(() => process.exit(0)).catch(console.error);
