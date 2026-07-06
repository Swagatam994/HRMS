import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Upload, FileText, Bot, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { hrApi } from '../services/api.js';

export const ResumeScreening = () => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf') {
        toast.error('Please select a PDF file.');
        return;
      }
      setFile(selected);
    }
  };

  const handleScreen = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please upload a resume.');
    if (!jobDescription) return toast.error('Please provide a job description.');

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', jobDescription);

      const response = await hrApi.screenResume(formData);
      setResult(response);
      toast.success('Resume analyzed successfully.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error analyzing resume.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <p className="text-sm text-blue-300">Resume Intelligence Agent</p>
        <h1 className="mt-1 text-3xl font-bold tracking-normal text-white">AI Screening</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={handleScreen} className="glass-panel p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Target Job Description</label>
            <textarea
              className="field min-h-[150px] resize-y"
              placeholder="Paste the job requirements, responsibilities, and qualifications..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Resume (PDF)</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-lg p-6 cursor-pointer hover:bg-white/[0.02] transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm text-slate-300">
                {file ? file.name : 'Click to upload or drag and drop'}
              </span>
              <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
            </label>
          </div>

          <Button type="submit" icon={Bot} loading={loading} className="w-full justify-center">
            Analyze Compatibility
          </Button>
        </form>

        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{result.candidateName || 'Unknown Candidate'}</h2>
                <p className="text-sm text-slate-400">{result.email || 'No email found'}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-300">{result.matchScore}%</div>
                <div className="text-xs uppercase tracking-wider text-slate-400">Match Score</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">Experience</p>
                <p className="font-semibold text-white">{result.totalYearsExperience} Years</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">Recommendation</p>
                <div className="flex items-center gap-2">
                  {result.recommendationStatus === 'Shortlist' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  {result.recommendationStatus === 'Review' && <AlertCircle className="w-4 h-4 text-amber-400" />}
                  {result.recommendationStatus === 'Reject' && <AlertCircle className="w-4 h-4 text-red-400" />}
                  <span className={`font-semibold ${
                    result.recommendationStatus === 'Shortlist' ? 'text-emerald-400' :
                    result.recommendationStatus === 'Review' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {result.recommendationStatus}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Core Technical Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {(result.extractedSkills || []).map((skill, i) => (
                  <span key={i} className="bg-blue-500/10 text-blue-200 border border-blue-500/20 rounded px-2.5 py-1 text-xs font-medium">
                    {skill}
                  </span>
                ))}
                {(!result.extractedSkills || result.extractedSkills.length === 0) && (
                  <span className="text-sm text-slate-500">No core skills explicitly found.</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
