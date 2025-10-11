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
          <Route path="courses" element={<CoursesUser/>} /> {/* Placeholder for courses */}
          <Route path="quizzes" element={<QuizViewer />} /> {/* /home/todo-list */}
          <Route path="sessions" element={<SessionsPage />} /> {/* /home/sessions */}
          <Route path="sessions/:id" element={<SessionDetailPage />} />
          <Route path="exam-countdown" element={<ExamCountdown />} /> {/* /home/exam-countdown */}
          <Route path="pomodoro" element={<Pomodoro />} /> {/* /home/pomodoro */}
          <Route path="course-tracker" element={<CourseTracker />} /> {/* /home/course-tracker */}
          <Route path="examSession" element={<ExamSessionPage/>} />
          <Route path="CreateExam" element={<CreateExam/>} />
          <Route path="exams/:id" element={<ExamDetailPage />} />
          <Route path="/home/tdtp" element={<TDTPPage />} />
          <Route path="/home/tdtp/create" element={<CreateTDSession/>}/>
          <Route path="/home/tdtp/sessions/:id" element={<TDSessionPage/>} /> {/* /home/todo-list */}

          {/* Add more protected routes as needed */}
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
