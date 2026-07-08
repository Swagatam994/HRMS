import EmployeeDocument from '../models/EmployeeDocument.js';

const templates = {
  offer: ({ name, employeeId, role, department, joiningDate, reportingManager }) => `
    <html><body style="font-family:Arial,sans-serif;line-height:1.6;padding:24px;">
      <h1>Offer Letter</h1>
      <p>Dear ${name},</p>
      <p>We are pleased to offer you the position of ${role} in ${department}.</p>
      <p>Employee ID: ${employeeId}</p>
      <p>Joining Date: ${joiningDate || 'TBD'}</p>
      <p>Reporting Manager: ${reportingManager || 'TBD'}</p>
    </body></html>
  `,
  appointment: ({ name, employeeId, role, department, joiningDate, reportingManager }) => `
    <html><body style="font-family:Arial,sans-serif;line-height:1.6;padding:24px;">
      <h1>Appointment Letter</h1>
      <p>Dear ${name},</p>
      <p>This letter confirms your appointment as ${role} in ${department}.</p>
      <p>Employee ID: ${employeeId}</p>
      <p>Joining Date: ${joiningDate || 'TBD'}</p>
      <p>Reporting Manager: ${reportingManager || 'TBD'}</p>
    </body></html>
  `,
  nda: ({ name, employeeId }) => `
    <html><body style="font-family:Arial,sans-serif;line-height:1.6;padding:24px;">
      <h1>Non-Disclosure Agreement</h1>
      <p>This NDA is between the Company and ${name} (ID: ${employeeId}).</p>
      <p>The employee agrees to keep all confidential information private during and after employment.</p>
    </body></html>
  `,
  welcome: ({ name, employeeId, role, department }) => `
    <html><body style="font-family:Arial,sans-serif;line-height:1.6;padding:24px;">
      <h1>Welcome Letter</h1>
      <p>Welcome ${name}!</p>
      <p>Your Employee ID is ${employeeId} and you will join the ${department} team as a ${role}.</p>
    </body></html>
  `,
  joining: ({ name, employeeId, joiningDate, reportingManager }) => `
    <html><body style="font-family:Arial,sans-serif;line-height:1.6;padding:24px;">
      <h1>Joining Instructions</h1>
      <p>Dear ${name},</p>
      <p>Please report on ${joiningDate || 'your scheduled date'}.</p>
      <p>Your manager will be ${reportingManager || 'assigned shortly'}.</p>
      <p>Employee ID: ${employeeId}</p>
    </body></html>
  `
};

export const generateDocumentHtml = async (type, data) => {
  const builder = templates[type] || templates.offer;
  return builder(data);
};

export const saveGeneratedDocument = async ({ employeeId, type, html, filename }) => {
  const doc = await EmployeeDocument.create({
    employee: employeeId,
    type,
    filename,
    contentHtml: html,
    generatedAt: new Date()
  });

  return doc;
};

export default { generateDocumentHtml, saveGeneratedDocument };
