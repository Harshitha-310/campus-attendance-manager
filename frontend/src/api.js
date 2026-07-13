import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const logsAPI = {
  all:      () => api.get('/logs/all'),
  warnings: () => api.get('/logs/warnings'),
  student:  (id) => api.get(`/logs/student/${id}`),
};
export const authAPI = {
  login:    (d)     => api.post('/auth/login', d),
  register: (d)     => api.post('/auth/register', d),
  logout:   (token) => api.post(`/auth/logout?token=${token}`),
  verify:   (token) => api.get(`/auth/verify?token=${token}`),
};
export const departmentsAPI = {
  getAll:  () => api.get('/departments/all'),
  create:  (d) => api.post('/departments/create', d),
};
export const professorsAPI = {
  getAll:       () => api.get('/professors/all'),
  create:       (d) => api.post('/professors/create', d),
  coordinators: () => api.get('/professors/coordinators'),
  courses:      (id) => api.get(`/professors/${id}/courses`),
};
export const studentsAPI = {
  getAll:   () => api.get('/students/all'),
  register: (d) => api.post('/students/register', d),
};
export const coursesAPI = {
  getAll:  () => api.get('/courses/all'),
  create:  (d) => api.post('/courses/create', d),
};
export const batchesAPI = {
  getAll:  () => api.get('/batches/all'),
  create:  (d) => api.post('/batches/create', d),
};
export const sectionsAPI = {
  getAll:   () => api.get('/sections/all'),
  create:   (d) => api.post('/sections/create', d),
  students: (id) => api.get(`/sections/${id}/students`),
  info:     (id) => api.get(`/sections/${id}/info`),
};
export const slotsAPI = {
  getAll:  () => api.get('/slots/all'),
  create:  (d) => api.post('/slots/create', d),
};
export const enrollmentAPI = {
  getAll:  () => api.get('/enrollment/all'),
  enroll:  (d) => api.post('/enrollment/enroll', d),
};
export const attendanceAPI = {
  markBulk:   (d) => api.post('/attendance/mark-bulk', d),
  editRecord: (d) => api.post('/attendance/edit', d),
  dateWise:   (student_id, section_id) =>
    api.get('/attendance/datewise', { params: { student_id, section_id } }),
};
export const reportsAPI = {
  all:          ()   => api.get('/reports/all'),
  section:      (id) => api.get(`/reports/section/${id}`),
  student:      (id) => api.get(`/reports/student/${id}`),
  stats:        ()   => api.get('/reports/stats'),
  alerts:       ()   => api.get('/reports/alerts'),
  chartAll:     ()   => api.get('/reports/chart-data/all'),
  chartCourse:  (id) => api.get(`/reports/chart-data/course/${id}`),
  chartSection: (id) => api.get(`/reports/chart-data/section/${id}`),
};