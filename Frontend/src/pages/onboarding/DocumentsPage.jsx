import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileDown, FileText, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../components/Button.jsx';
import api from '../../services/api.js';

const getError = (error) => error.response?.data?.message || error.message || 'Unable to load documents.';

export const DocumentsPage = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [documents, setDocuments] = useState([]);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await api.get('/user/profile');
        const lookupId = profile?.user?.email || profile?.user?.employeeId || profile?.user?.id || profile?.user?._id;

        if (!lookupId || ['undefined', 'null'].includes(String(lookupId).toLowerCase())) {
          setEmployeeId('');
          setDocuments([]);
          setLoading(false);
          return;
        }

        const employeeResponse = await api.get(`/employee/${encodeURIComponent(lookupId)}`);
        const id = employeeResponse?.employee?._id || employeeResponse?._id;
        setEmployeeId(id || lookupId);
        const docs = await api.get(`/documents/${id || lookupId}`);
        setDocuments(docs || []);
      } catch (error) {
        toast.error(getError(error));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const generateDocument = async (type) => {
    try {
      const response = await api.post('/documents/generate', { employeeId, type });
      setDocuments((current) => [response.doc, ...current]);
      setPreview(response.previewHtml || '');
      toast.success(`${type} document generated`);
    } catch (error) {
      toast.error(getError(error));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <p className="text-sm text-blue-300">Documents</p>
        <h1 className="mt-1 text-3xl font-bold tracking-normal text-white">Onboarding paperwork</h1>
      </div>

      <div className="glass-panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Generate documents</h2>
            <p className="text-sm text-slate-400">Create offer, appointment, NDA, welcome, and joining instructions.</p>
          </div>
          <Sparkles className="h-5 w-5 text-blue-300" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['offer', 'appointment', 'nda', 'welcome', 'joining'].map((type) => (
            <Button key={type} onClick={() => generateDocument(type)} icon={FileText} variant="secondary">
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Generated documents</h2>
          {loading ? (
            <p className="mt-3 text-sm text-slate-400">Loading documents...</p>
          ) : documents.length ? (
            <div className="mt-4 space-y-3">
              {documents.map((doc) => (
                <div key={doc._id} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">{doc.type}</p>
                      <p className="text-sm text-slate-400">{doc.filename}</p>
                    </div>
                    <Button onClick={() => setPreview(doc.contentHtml || '')} icon={FileDown} variant="secondary">Preview</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No documents generated yet.</p>
          )}
        </div>

        <div className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Preview</h2>
          <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300" dangerouslySetInnerHTML={{ __html: preview || '<p>No preview selected.</p>' }} />
        </div>
      </div>
    </motion.div>
  );
};
