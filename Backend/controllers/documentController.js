import Employee from '../models/Employee.js';
import EmployeeDocument from '../models/EmployeeDocument.js';
import { generateDocumentHtml, saveGeneratedDocument } from '../services/documentService.js';

export const generateDocument = async (req, res, next) => {
  try {
    const { employeeId, type } = req.body;
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const html = await generateDocumentHtml(type, {
      name: employee.name,
      employeeId: employee.employeeId,
      role: employee.role,
      department: employee.department,
      joiningDate: employee.joiningDate?.toISOString?.() || employee.joiningDate,
      reportingManager: employee.reportingManager?.name || employee.reportingManager || 'TBD'
    });

    const doc = await saveGeneratedDocument({ employeeId: employee._id, type, html, filename: `${type}-${employee.employeeId}.html` });

    res.json({ doc, previewHtml: html });
  } catch (error) {
    next(error);
  }
};

export const getDocumentsForEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const docs = await EmployeeDocument.find({ employee: employeeId }).sort({ generatedAt: -1 });
    res.json(docs);
  } catch (error) {
    next(error);
  }
};

export default { generateDocument, getDocumentsForEmployee };
