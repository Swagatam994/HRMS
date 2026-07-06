// @ts-expect-error - deep import to avoid pdf-parse index.js bug
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { screenResume } from '../services/resumeAgentService.js';

export const processResumeScreening = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No resume PDF provided.' });
    }
    
    if (!jobDescription) {
      return res.status(400).json({ message: 'Job description is required.' });
    }

    // Extract text from PDF
    const data = await pdfParse(req.file.buffer);
    const resumeText = data.text;

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ message: 'Failed to extract text from the provided PDF.' });
    }

    // Pass to Resume Intelligence Agent
    const analysis = await screenResume(resumeText, jobDescription);

    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Error processing resume:', error);
    return res.status(500).json({ message: 'An error occurred while screening the resume: ' + (error.message || error) });
  }
};
