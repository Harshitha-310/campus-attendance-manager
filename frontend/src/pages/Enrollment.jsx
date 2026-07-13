import { useEffect, useState } from 'react';
import { enrollmentAPI, studentsAPI, coursesAPI, sectionsAPI } from '../api';
import { PageHeader, Card, CardTitle, Grid, Select, Btn, Table, useToast, Toast, Badge } from '../components/UI';

export default function Enrollment() {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents]       = useState([]);
  const [courses, setCourses]         = useState([]);
  const [sections, setSections]       = useState([]);
  const [form, setForm] = useState({ student_id:'', course_id:'', section_id:'' });
  const [toast, showToast] = useToast();

  const load = () => {
    enrollmentAPI.getAll().then(r => setEnrollments(r.data.data || []));
    studentsAPI.getAll().then(r => setStudents(r.data.data || []));
    coursesAPI.getAll().then(r => setCourses(r.data.data || []));
    sectionsAPI.getAll().then(r => setSections(r.data.data || []));
  };
  useEffect(() => { load(); }, []);
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const submit = async () => {
    if (!form.student_id || !form.course_id || !form.section_id)
      return showToast('Select all fields', 'error');
    const res = await enrollmentAPI.enroll(form);
    if (res.data.success) { showToast('Student enrolled!'); setForm({ student_id:'', course_id:'', section_id:'' }); load(); }
    else showToast(res.data.error, 'error');
  };

  return (
    <div>
      <PageHeader title="Enrollment" subtitle="Enroll students into courses and sections" />
      <Card>
        <CardTitle>Enroll Student</CardTitle>
        <Grid cols={3}>
          <Select label="Student *" value={form.student_id}
            options={students.map(s => ({ value: s.student_id, label: s.student_name }))}
            onChange={e => set('student_id', e.target.value)} />
          <Select label="Course *" value={form.course_id}
            options={courses.map(c => ({ value: c.course_id, label: c.course_name }))}
            onChange={e => set('course_id', e.target.value)} />
          <Select label="Section *" value={form.section_id}
            options={sections.map(s => ({ value: s.section_id, label: `${s.section_name} — ${s.batch_name}` }))}
            onChange={e => set('section_id', e.target.value)} />
        </Grid>
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          <Btn onClick={submit}>Enroll Student</Btn>
          <Btn variant="ghost" onClick={load}>Refresh</Btn>
        </div>
      </Card>
      <Card>
        <CardTitle>All Enrollments ({enrollments.length})</CardTitle>
        <Table
          headers={['Reg ID','Student','Course','Section','Date']}
          rows={enrollments.map(e => [
            e.reg_id, e.student_name, e.course_name,
            <Badge color="blue">{e.section_name}</Badge>,
            e.reg_date
          ])}
        />
      </Card>
      <Toast {...toast} />
    </div>
  );
}