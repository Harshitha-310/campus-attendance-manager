import { useEffect, useState } from 'react';
import { coursesAPI } from '../api';
import { PageHeader, Card, CardTitle, Grid, Input, Btn, Table, useToast, Toast } from '../components/UI';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ course_id:'', course_name:'', credits:'' });
  const [toast, showToast] = useToast();

  const load = () => coursesAPI.getAll().then(r => setCourses(r.data.data || []));
  useEffect(() => { load(); }, []);
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const submit = async () => {
    if (!form.course_id || !form.course_name || !form.credits)
      return showToast('Fill all fields', 'error');
    const res = await coursesAPI.create(form);
    if (res.data.success) { showToast('Course created!'); setForm({ course_id:'', course_name:'', credits:'' }); load(); }
    else showToast(res.data.error, 'error');
  };

  return (
    <div>
      <PageHeader title="Courses" subtitle="Create and manage courses" />
      <Card>
        <CardTitle>Create New Course</CardTitle>
        <Grid cols={3}>
          <Input label="Course ID *" type="number" value={form.course_id}
            onChange={e => set('course_id', e.target.value)} placeholder="e.g. 104" />
          <Input label="Course Name *" value={form.course_name}
            onChange={e => set('course_name', e.target.value)} placeholder="e.g. Computer Networks" />
          <Input label="Credits *" type="number" value={form.credits}
            onChange={e => set('credits', e.target.value)} placeholder="1–10" />
        </Grid>
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          <Btn onClick={submit}>Create Course</Btn>
          <Btn variant="ghost" onClick={load}>Refresh</Btn>
        </div>
      </Card>
      <Card>
        <CardTitle>All Courses ({courses.length})</CardTitle>
        <Table headers={['ID','Course Name','Credits']}
          rows={courses.map(c => [c.course_id, c.course_name, c.credits])} />
      </Card>
      <Toast {...toast} />
    </div>
  );
}