import { useEffect, useState } from 'react';
import { batchesAPI, coursesAPI } from '../api';
import { PageHeader, Card, CardTitle, Grid, Input, Select, Btn, Table, useToast, Toast } from '../components/UI';

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ batch_id:'', batch_name:'', course_id:'' });
  const [toast, showToast] = useToast();

  const load = () => {
    batchesAPI.getAll().then(r => setBatches(r.data.data || []));
    coursesAPI.getAll().then(r => setCourses(r.data.data || []));
  };
  useEffect(() => { load(); }, []);
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const submit = async () => {
    if (!form.batch_id || !form.batch_name || !form.course_id)
      return showToast('Fill all fields', 'error');
    const res = await batchesAPI.create(form);
    if (res.data.success) { showToast('Batch created!'); setForm({ batch_id:'', batch_name:'', course_id:'' }); load(); }
    else showToast(res.data.error, 'error');
  };

  return (
    <div>
      <PageHeader title="Batches" subtitle="Create batches under courses" />
      <Card>
        <CardTitle>Create New Batch</CardTitle>
        <Grid cols={3}>
          <Input label="Batch ID *" type="number" value={form.batch_id}
            onChange={e => set('batch_id', e.target.value)} placeholder="e.g. 4" />
          <Input label="Batch Name *" value={form.batch_name}
            onChange={e => set('batch_name', e.target.value)} placeholder="e.g. Batch-C-2024" />
          <Select label="Course *" value={form.course_id}
            options={courses.map(c => ({ value: c.course_id, label: c.course_name }))}
            onChange={e => set('course_id', e.target.value)} />
        </Grid>
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          <Btn onClick={submit}>Create Batch</Btn>
          <Btn variant="ghost" onClick={load}>Refresh</Btn>
        </div>
      </Card>
      <Card>
        <CardTitle>All Batches ({batches.length})</CardTitle>
        <Table headers={['ID','Batch Name','Course']}
          rows={batches.map(b => [b.batch_id, b.batch_name, b.course_name])} />
      </Card>
      <Toast {...toast} />
    </div>
  );
}