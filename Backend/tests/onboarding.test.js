import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDocumentHtml } from '../services/documentService.js';
import { getDefaultTasksForRole } from '../services/taskService.js';

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
