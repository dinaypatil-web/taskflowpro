
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
const userId = 'cLhsidbqXoSIjZeKHD87';

async function checkTasks() {
    const results = {
        timestamp: new Date().toISOString(),
        userId: userId,
        totalTasksInCollection: 0,
        tasksForUser: [],
        tasksMissingIsDeleted: [],
        tasksWithIsDeletedTrue: [],
        errors: []
    };

    try {
        const allTasks = await db.collection('tasks').get();
        results.totalTasksInCollection = allTasks.size;

        allTasks.docs.forEach(doc => {
            const data = doc.data();
            const taskInfo = {
                id: doc.id,
                title: data.title,
                userId: data.userId,
                isDeleted: data.isDeleted,
                createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
                allKeys: Object.keys(data)
            };

            if (data.userId === userId) {
                results.tasksForUser.push(taskInfo);

                if (data.isDeleted === undefined || data.isDeleted === null) {
                    results.tasksMissingIsDeleted.push(doc.id);
                } else if (data.isDeleted === true) {
                    results.tasksWithIsDeletedTrue.push(doc.id);
                }
            }
        });
    } catch (e) {
        results.errors.push(e.message);
    }

    fs.writeFileSync(path.join(__dirname, '../debug_tasks_data.json'), JSON.stringify(results, null, 2));
    console.log('Results written to debug_tasks_data.json');
}

checkTasks().then(() => process.exit(0)).catch(console.error);
