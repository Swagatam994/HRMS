import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Keyboard, Mic, MicOff, Pause, Play, Send, Volume2 } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { FeedbackPanel } from '../components/FeedbackPanel.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.js';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis.js';
import { useTimer } from '../hooks/useTimer.js';
import { interviewApi } from '../services/api.js';
import { formatDuration } from '../utils/formatters.js';

const getError = (error) => error.response?.data?.message || error.message || 'Interview action failed.';

export const InterviewRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialState = location.state || {};
  const greetedRef = useRef(false);

  const [interview, setInterview] = useState(initialState.interview || null);
  const [questions, setQuestions] = useState(initialState.questions || []);
  const [currentIndex, setCurrentIndex] = useState(initialState.interview?.answeredCount || 0);
  const [answerText, setAnswerText] = useState('');
  const [mode, setMode] = useState('voice');
  const [lastFeedback, setLastFeedback] = useState(null);
  const [complete, setComplete] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(!initialState.interview);
  const [submitting, setSubmitting] = useState(false);

  const speech = useSpeechRecognition();
  const voice = useSpeechSynthesis();
  const totalTimer = useTimer(!paused && !complete);
  const questionTimer = useTimer(!paused && !complete && !lastFeedback);

  const currentQuestion = questions[currentIndex] || null;
  const progress = useMemo(() => {
    if (!questions.length) return 0;
    const answered = currentIndex + (lastFeedback ? 1 : 0);
    return Math.min(100, Math.round((answered / questions.length) * 100));
  }, [currentIndex, questions.length, lastFeedback]);

  useEffect(() => {
    if (initialState.interview) return;

    const loadInterview = async () => {
      try {
        const response = await interviewApi.getById(id);
        const fetched = response.interview;
        if (fetched.status === 'completed') {
          navigate(`/summary/${id}`, { replace: true, state: response });
          return;
        }
        setInterview({ ...fetched, id: fetched._id });
        setQuestions(fetched.questions || []);
        setCurrentIndex(Math.min(fetched.currentQuestionIndex || fetched.answers?.length || 0, fetched.questions?.length || 0));
      } catch (error) {
        toast.error(getError(error));
      } finally {
        setLoading(false);
      }
    };

    loadInterview();
  }, [id, initialState.interview, navigate]);

  useEffect(() => {
    if (mode === 'voice') {
      setAnswerText(speech.transcript);
    }
  }, [speech.transcript, mode]);

  useEffect(() => {
    if (!currentQuestion || paused) return;
    const text = greetedRef.current
      ? currentQuestion.question
      : `Welcome to your ${interview?.role || ''} interview. ${currentQuestion.question}`;
    greetedRef.current = true;
    voice.speak(text);
  }, [currentQuestion?.id, paused]);

  const toggleRecording = () => {
    if (!speech.supported) {
      toast.error('Speech recognition is not supported in this browser.');
      return;
    }

    if (speech.listening) {
      speech.stop();
      return;
    }

    try {
      speech.start();
    } catch (error) {
      toast.error(error.message || 'Unable to start microphone.');
    }
  };

  const handlePause = () => {
    setPaused((value) => !value);
    if (!paused) {
      speech.stop();
      voice.cancel();
    }
  };

  const handleSubmit = async () => {
    const transcript = answerText.trim();
    if (!transcript) {
      toast.error('Add an answer before submitting.');
      return;
    }

    setSubmitting(true);
    speech.stop();
    try {
      const response = await interviewApi.submitAnswer({
        interviewId: id,
        questionId: currentQuestion.id,
        transcript,
        mode,
        durationSeconds: questionTimer.seconds
      });

      setLastFeedback(response.answer.feedback);
      setInterview(response.interview);
      setComplete(response.isComplete);
      toast.success('Answer evaluated');
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    setCurrentIndex((value) => value + 1);
    setLastFeedback(null);
    setAnswerText('');
    speech.reset();
    questionTimer.reset();
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const response = await interviewApi.end({ interviewId: id, elapsedSeconds: totalTimer.seconds });
      navigate(`/summary/${id}`, { replace: true, state: response });
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen label="Loading interview" />;

  if (!currentQuestion) {
    return (
      <div className="glass-panel p-6">
        <h1 className="text-2xl font-bold text-white">Interview Ready for Report</h1>
        <Button className="mt-5" onClick={handleFinish} loading={submitting}>
          Generate Final Report
        </Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-blue-300">{interview?.role}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-normal text-white">Interview Room</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-slate-200">
            {formatDuration(totalTimer.seconds)}
          </div>
          <Button variant="secondary" icon={paused ? Play : Pause} onClick={handlePause} title={paused ? 'Resume' : 'Pause'} />
        </div>
      </div>

      <section className="glass-panel p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="text-sm text-slate-400">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-sm font-semibold text-blue-300">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-400 via-emerald-300 to-amber-300" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">
                {currentQuestion.type} · {currentQuestion.difficulty}
              </p>
              <h2 className="mt-3 text-2xl font-semibold leading-9 text-white">{currentQuestion.question}</h2>
            </div>
            <Button variant="secondary" icon={Volume2} onClick={() => voice.speak(currentQuestion.question)} title="Read question" />
          </div>

          <div className="mt-6 inline-flex rounded-lg border border-white/10 bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => setMode('voice')}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                mode === 'voice' ? 'bg-blue-500 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Mic className="h-4 w-4" />
              Voice
            </button>
            <button
              type="button"
              onClick={() => setMode('typing')}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                mode === 'typing' ? 'bg-blue-500 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Keyboard className="h-4 w-4" />
              Typing
            </button>
          </div>

          <textarea
            className="field mt-5 min-h-48 resize-y leading-7"
            value={answerText}
            onChange={(event) => setAnswerText(event.target.value)}
            disabled={Boolean(lastFeedback)}
            placeholder={mode === 'voice' ? 'Transcript will appear here...' : 'Type your answer here...'}
          />

          {speech.error ? <p className="mt-2 text-sm text-amber-300">{speech.error}</p> : null}

          <div className="mt-5 flex flex-wrap justify-between gap-3">
            <div className="flex gap-2">
              {mode === 'voice' ? (
                <Button
                  variant={speech.listening ? 'danger' : 'secondary'}
                  icon={speech.listening ? MicOff : Mic}
                  onClick={toggleRecording}
                  disabled={Boolean(lastFeedback) || paused}
                >
                  {speech.listening ? 'Stop' : 'Microphone'}
                </Button>
              ) : null}
            </div>

            <div className="flex gap-2">
              {!lastFeedback ? (
                <Button icon={Send} onClick={handleSubmit} loading={submitting} disabled={paused}>
                  Submit Answer
                </Button>
              ) : complete ? (
                <Button icon={Play} onClick={handleFinish} loading={submitting}>
                  Final Report
                </Button>
              ) : (
                <Button icon={Play} onClick={handleNext}>
                  Next Question
                </Button>
              )}
            </div>
          </div>
        </div>

        <FeedbackPanel feedback={lastFeedback} />
      </section>
    </motion.div>
  );
};
