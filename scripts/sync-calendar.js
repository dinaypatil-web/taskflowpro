const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// Initialize with service account from env
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccount) {
    console.error('FIREBASE_SERVICE_ACCOUNT not found in .env');
    process.exit(1);
}

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount))
    });
}

const db = admin.firestore();

async function syncAllTasks() {
    console.log('Starting sync of all tasks to calendar_events...');

    const tasksSnapshot = await db.collection('tasks').get();
    console.log(`Found ${tasksSnapshot.size} tasks.`);

    const batch = db.batch();
    let syncCount = 0;

    for (const taskDoc of tasksSnapshot.docs) {
        const task = taskDoc.data();
        const taskId = taskDoc.id;
        const userId = task.userId;

        if (!task.dueDate || task.isDeleted) continue;

        let dueDate;
        try {
            // Handle both Timestamp and string/Date
            dueDate = typeof task.dueDate.toDate === 'function' ? task.dueDate.toDate() : new Date(task.dueDate);
        } catch (e) {
            console.error(`Error parsing dueDate for task ${taskId}:`, task.dueDate);
            continue;
        }

        if (isNaN(dueDate.getTime())) {
            console.warn(`Invalid dueDate for task ${taskId}:`, task.dueDate);
            continue;
        }

        const eventsSnapshot = await db.collection('calendar_events')
            .where('taskId', '==', taskId)
            .where('userId', '==', userId)
            .limit(1)
            .get();

        const eventData = {
            userId,
            taskId,
            title: task.title,
            description: task.description || '',
            startDate: admin.firestore.Timestamp.fromDate(dueDate),
            endDate: admin.firestore.Timestamp.fromDate(dueDate),
            isAllDay: true,
            updatedAt: admin.firestore.Timestamp.now(),
        };

        if (eventsSnapshot.empty) {
            const newEventRef = db.collection('calendar_events').doc();
            batch.set(newEventRef, {
                ...eventData,
                createdAt: admin.firestore.Timestamp.now(),
            });
            syncCount++;
        } else {
            const eventRef = eventsSnapshot.docs[0].ref;
            batch.update(eventRef, eventData);
        }

        // Firestore batch limit is 500
        if (syncCount >= 450) {
            await batch.commit();
            console.log(`Committed ${syncCount} events...`);
            syncCount = 0;
        }
    }

    if (syncCount > 0) {
        await batch.commit();
        console.log(`Committed remaining ${syncCount} events.`);
    }

    console.log('Sync complete.');
}

syncAllTasks().catch(console.error);
