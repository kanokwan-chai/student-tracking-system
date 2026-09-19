import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/auth/Login';
import StudentDashboard from './pages/student/Dashboard';
import StudentAssignments from './pages/student/Assignments';
import StudentSubjects from './pages/student/Subjects';
import StudentQuizzes from './pages/student/Quizzes';
import TeacherDashboard from './pages/teacher/Dashboard';
import Layout from './components/layout/Layout';

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole: string }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="p-8 text-center">กำลังโหลด...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== allowedRole) return <Navigate to="/" replace />;
  
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'student' ? '/student' : '/teacher'} /> : <Login />} />
      
      {/* Student Routes */}
      <Route path="/student" element={<ProtectedRoute allowedRole="student"><Layout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="subjects" element={<StudentSubjects />} />
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="quizzes" element={<StudentQuizzes />} />
      </Route>

      {/* Teacher Routes */}
      <Route path="/teacher" element={<ProtectedRoute allowedRole="teacher"><Layout /></ProtectedRoute>}>
        <Route index element={<TeacherDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
