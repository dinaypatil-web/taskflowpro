import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('Demo123!', 12);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@taskflowpro.com' },
    update: {},
    create: {
      email: 'demo@taskflowpro.com',
      phone: '+1234567890',
      firstName: 'Demo',
      lastName: 'User',
      password: hashedPassword,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  console.log('👤 Created demo user:', demoUser.email);

  // Create demo stakeholders
  const stakeholder1 = await prisma.stakeholder.create({
    data: {
      userId: demoUser.id,
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@company.com',
      phone: '+1987654321',
      organization: 'Acme Corporation',
      tags: JSON.stringify(['client', 'vip']),
    },
  });

  const stakeholder2 = await prisma.stakeholder.create({
    data: {
      userId: demoUser.id,
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@partner.com',
      phone: '+1555123456',
      organization: 'Partner Solutions',
      tags: JSON.stringify(['partner', 'project-manager']),
    },
  });

  const stakeholder3 = await prisma.stakeholder.create({
    data: {
      userId: demoUser.id,
      firstName: 'Mike',
      lastName: 'Davis',
      email: 'mike.davis@vendor.com',
      organization: 'Tech Vendor Inc',
      tags: JSON.stringify(['vendor', 'technical']),
    },
  });

  console.log('👥 Created demo stakeholders');

  // Create demo tasks
  const task1 = await prisma.task.create({
    data: {
      userId: demoUser.id,
      title: 'Complete Q1 Project Proposal',
      description: 'Finalize the project proposal document and send to all stakeholders for review',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      taskStakeholders: {
        create: [
          { stakeholderId: stakeholder1.id, role: 'reviewer' },
          { stakeholderId: stakeholder2.id, role: 'assignee' },
        ],
      },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      userId: demoUser.id,
      title: 'Schedule Team Meeting',
      description: 'Organize a team meeting to discuss project timeline and deliverables',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      taskStakeholders: {
        create: [
          { stakeholderId: stakeholder2.id, role: 'attendee' },
          { stakeholderId: stakeholder3.id, role: 'attendee' },
        ],
      },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      userId: demoUser.id,
      title: 'Review Technical Specifications',
      description: 'Review and approve the technical specifications document',
      priority: 'HIGH',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      completedAt: new Date(),
      taskStakeholders: {
        create: [
          { stakeholderId: stakeholder3.id, role: 'reviewer' },
        ],
      },
    },
  });

  const task4 = await prisma.task.create({
    data: {
      userId: demoUser.id,
      title: 'Prepare Monthly Report',
      description: 'Compile and prepare the monthly progress report for management',
      priority: 'LOW',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      isVoiceCreated: true,
      voiceMetadata: JSON.stringify({
        originalTranscript: 'Create a low priority task to prepare monthly report due in two weeks',
        confidence: 0.92,
        language: 'en-US',
        processingTime: 1150,
      }),
    },
  });

  console.log('📋 Created demo tasks');

  // Create demo reminders
  const reminder1 = await prisma.reminder.create({
    data: {
      taskId: task1.id,
      type: 'TASK_DUE',
      scheduledAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
      message: 'Project proposal is due tomorrow!',
    },
  });

  const reminder2 = await prisma.reminder.create({
    data: {
      taskId: task2.id,
      type: 'TASK_DUE',
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      message: 'Don\'t forget to schedule the team meeting',
    },
  });

  console.log('⏰ Created demo reminders');

  // Create demo calendar events
  const event1 = await prisma.calendarEvent.create({
    data: {
      userId: demoUser.id,
      taskId: task1.id,
      title: 'Project Proposal Deadline',
      description: 'Final deadline for Q1 project proposal submission',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isAllDay: true,
    },
  });

  const event2 = await prisma.calendarEvent.create({
    data: {
      userId: demoUser.id,
      title: 'Weekly Standup',
      description: 'Regular team standup meeting',
      startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow at 9 AM
      endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow at 10 AM
      location: 'Conference Room A',
    },
  });

  console.log('📅 Created demo calendar events');

  console.log('✅ Database seed completed successfully!');
  console.log('');
  console.log('Demo credentials:');
  console.log('Email: demo@taskflowpro.com');
  console.log('Password: Demo123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });