// src/App.jsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './pages/Login';
import WaitingPage from './pages/waitingpage';
import Home from './pages/Home';
import TrialExpired from './pages/trialExpired';
import SignUpPage from "./pages/SignUpPage";
import PrivateRoute from "./components/PrivatteRoute";
import LandingPage from "./pages/LandingPage";
import RedirectBasedOnAuth from "./components/RedirectBasedOnAuth";
import Intro from "./pages/Intro";
import TodoList from "./components/TodoList";
import TodoPage from "./pages/TodoPage";
import Profile from "./components/ProfileCard";
import Subscription from "./components/Subscription";
import CoursesUser from "./components/Courses";
import QuizViewer from "./components/Quizzes";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import SessionsPage from "./pages/sessionspage";
import SessionDetailPage from "./pages/SessionDetailPage";
import ExamCountdown from "./pages/ExamCountdown";
import Pomodoro from "./pages/Pomodoro";
import CourseTracker from "./pages/couresTracker";
import ExamSessionPage from "./pages/ExamSessionPage";
import CreateExam from "./pages/CreateExams";
import ExamDetailPage from "./pages/Examsdeatilssession";
import TDTPPage from "./pages/tdsessionpage";
import CreateTDSession from "./pages/tptdcreatesession";
import TDSessionPage from "./pages/tdsessionpagedetails";

function App() {
  // ✅ Global copy/selection/right-click protection
    /*useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault(); // block right-click
    const handleSelectStart = (e) => e.preventDefault(); // block text selection
    const handleCopy = (e) => e.preventDefault(); // block copy

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("copy", handleCopy);
    };
  }, []);
*/
  return (
    <BrowserRouter>
      <Routes>
        {/* Root: show landing page but redirect logged-in users */}
        <Route path="/" element={<RedirectBasedOnAuth fallback={<LandingPage />} />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/waiting" element={<WaitingPage />} />
        <Route path="/trial-expired" element={<TrialExpired />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />

        {/* Home: protected route */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        >
          <Route index element={<Intro />} />   {/* /home */}
          <Route path="todo" element={<TodoPage />} /> {/* /home/todo */}
          <Route path="Profile" element={<Profile />} /> 
          <Route path="subscription" element={<Subscription/>} /> 
          <Route path="courses" element={<CoursesUser/>} /> 
          <Route path="quizzes" element={<QuizViewer />} /> 
          <Route path="sessions" element={<SessionsPage />} /> 
          <Route path="sessions/:id" element={<SessionDetailPage />} />
          <Route path="exam-countdown" element={<ExamCountdown />} /> 
          <Route path="pomodoro" element={<Pomodoro />} /> 
          <Route path="course-tracker" element={<CourseTracker />} /> 
          <Route path="examSession" element={<ExamSessionPage/>} />
          <Route path="CreateExam" element={<CreateExam/>} />
          <Route path="exams/:id" element={<ExamDetailPage />} />
          <Route path="/home/tdtp" element={<TDTPPage />} />
          <Route path="/home/tdtp/create" element={<CreateTDSession/>}/>
          <Route path="/home/tdtp/sessions/:id" element={<TDSessionPage/>} /> 
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
