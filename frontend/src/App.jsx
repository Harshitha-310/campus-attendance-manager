import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout       from './components/Layout';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Students     from './pages/Students';
import Courses      from './pages/Courses';
import Batches      from './pages/Batches';
import Coordinators from './pages/Coordinators';
import Sections     from './pages/Sections';
import Slots        from './pages/Slots';
import Enrollment   from './pages/Enrollment';
import Attendance   from './pages/Attendance';
import Reports      from './pages/Reports';
import MyAttendance from './pages/MyAttendance';
import Users        from './pages/Users';
import Departments from './pages/Departments';


function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={
                <ProtectedRoute roles={['admin','professor','student']}>
                  <Dashboard />
                </ProtectedRoute>
              }/>
              <Route path="/students" element={
                <ProtectedRoute roles={['admin']}>
                  <Students />
                </ProtectedRoute>
              }/>
              <Route path="/courses" element={
                <ProtectedRoute roles={['admin']}>
                  <Courses />
                </ProtectedRoute>
              }/>
              <Route path="/batches" element={
                <ProtectedRoute roles={['admin']}>
                  <Batches />
                </ProtectedRoute>
              }/>
              <Route path="/coordinators" element={
                <ProtectedRoute roles={['admin']}>
                  <Coordinators />
                </ProtectedRoute>
              }/>
	      <Route path="/departments" element={
  		<ProtectedRoute roles={['admin']}>
    		  <Departments />
  		</ProtectedRoute>
	      } />
              <Route path="/sections" element={
                <ProtectedRoute roles={['admin']}>
                  <Sections />
                </ProtectedRoute>
              }/>
              <Route path="/slots" element={
                <ProtectedRoute roles={['admin']}>
                  <Slots />
                </ProtectedRoute>
              }/>
              <Route path="/enrollment" element={
                <ProtectedRoute roles={['admin']}>
                  <Enrollment />
                </ProtectedRoute>
              }/>
              <Route path="/users" element={
                <ProtectedRoute roles={['admin']}>
                  <Users />
                </ProtectedRoute>
              }/>
              <Route path="/attendance" element={
                <ProtectedRoute roles={['admin','professor']}>
                  <Attendance />
                </ProtectedRoute>
              }/>
              <Route path="/reports" element={
                <ProtectedRoute roles={['admin','professor']}>
                  <Reports />
                </ProtectedRoute>
              }/>
              <Route path="/my-attendance" element={
                <ProtectedRoute roles={['student']}>
                  <MyAttendance />
                </ProtectedRoute>
              }/>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      }/>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}