import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { generateDocumentHtml } from '../services/documentService.js';
import { getDefaultTasksForRole } from '../services/taskService.js';
import { getHiringAnalytics } from '../services/analyticsService.js';

let mongoServer;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('generateDocumentHtml returns appointment letter content for appointment type', async () => {
  const html = await generateDocumentHtml('appointment', {
    name: 'Ava',
    employeeId: 'EMP1234',
    role: 'Frontend Developer',
    department: 'Engineering',
    joiningDate: '2026-08-01',
    reportingManager: 'Mina'
  });

  assert.match(html, /Appointment Letter/i);
  assert.match(html, /Ava/);
  assert.match(html, /EMP1234/);
});

test('getDefaultTasksForRole returns role-based onboarding tasks', () => {
  const tasks = getDefaultTasksForRole('Frontend Developer');

  assert.ok(tasks.length >= 3);
  assert.ok(tasks.some((item) => item.title === 'Install VS Code'));
  assert.ok(tasks.some((item) => item.title === 'Clone Company Repository'));
});

test('getHiringAnalytics is available and returns analytics structure', async () => {
  const analytics = await getHiringAnalytics();

  assert.ok(analytics && typeof analytics === 'object');
  assert.ok(analytics.metrics);
  assert.ok(Array.isArray(analytics.charts?.statusDistribution));
  assert.ok(Array.isArray(analytics.charts?.funnel));
});
