import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { LoadingScreen } from './components/LoadingScreen.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';

const Home = lazy(() => import('./pages/Home.jsx').then((module) => ({ default: module.Home })));
const Login = lazy(() => import('./pages/Login.jsx').then((module) => ({ default: module.Login })));
const Register = lazy(() => import('./pages/Register.jsx').then((module) => ({ default: module.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx').then((module) => ({ default: module.Dashboard })));
const HRDashboard = lazy(() => import('./pages/HRDashboard.jsx').then((module) => ({ default: module.HRDashboard })));
const HRInterviews = lazy(() => import('./pages/HRInterviews.jsx').then((module) => ({ default: module.HRInterviews })));
const HRInterviewDetail = lazy(() => import('./pages/HRInterviewDetail.jsx').then((module) => ({ default: module.HRInterviewDetail })));
const CreateInterview = lazy(() => import('./pages/CreateInterview.jsx').then((module) => ({ default: module.CreateInterview })));
const InterviewRoom = lazy(() => import('./pages/InterviewRoom.jsx').then((module) => ({ default: module.InterviewRoom })));
const InterviewSummary = lazy(() => import('./pages/InterviewSummary.jsx').then((module) => ({ default: module.InterviewSummary })));
const InterviewHistory = lazy(() => import('./pages/InterviewHistory.jsx').then((module) => ({ default: module.InterviewHistory })));
const Profile = lazy(() => import('./pages/Profile.jsx').then((module) => ({ default: module.Profile })));
const ResumeScreening = lazy(() => import('./pages/ResumeScreening.jsx').then((module) => ({ default: module.ResumeScreening })));
const NotFound = lazy(() => import('./pages/NotFound.jsx').then((module) => ({ default: module.NotFound })));

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#11131c',
            color: '#f8fafc',
            border: '1px solid rgba(255,255,255,0.12)'
          }
        }}
      />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/candidate/dashboard" element={<Dashboard />} />
            <Route path="/candidate/history" element={<InterviewHistory />} />
            <Route path="/hr/dashboard" element={<HRDashboard />} />
            <Route path="/hr/interviews" element={<HRInterviews />} />
            <Route path="/hr/interview/:id" element={<HRInterviewDetail />} />
            <Route path="/hr/resume-screening" element={<ProtectedRoute roles={['recruiter']}><ResumeScreening /></ProtectedRoute>} />
            <Route path="/create-interview" element={<ProtectedRoute roles={['recruiter']}><CreateInterview /></ProtectedRoute>} />
            <Route path="/interview/:id" element={<InterviewRoom />} />
            <Route path="/summary/:id" element={<InterviewSummary />} />
            <Route path="/history" element={<InterviewHistory />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
