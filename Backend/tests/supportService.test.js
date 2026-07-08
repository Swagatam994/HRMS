import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSupportContext, classifySupportIntent } from '../services/supportService.js';

test('classifySupportIntent detects leave and payroll questions', () => {
  assert.equal(classifySupportIntent('How many leave days do I have left?'), 'leave');
  assert.equal(classifySupportIntent('When will I receive my salary?'), 'payroll');
  assert.equal(classifySupportIntent('What onboarding tasks are pending?'), 'onboarding');
});

test('buildSupportContext returns placeholders when leave and payroll data are unavailable', () => {
  const context = buildSupportContext({
    employee: { name: 'Ava', role: 'Frontend Developer', department: 'Engineering' },
    message: 'How do I download my payslip?'
  });

  assert.ok(context.employee.name.includes('Ava'));
  assert.match(context.summary, /payslip/i);
  assert.match(context.leaveSummary, /No leave/i);
  assert.match(context.payrollSummary, /No payroll/i);
});
