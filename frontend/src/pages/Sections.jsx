import { useEffect, useState } from 'react';
import { sectionsAPI, batchesAPI, professorsAPI } from '../api';
import {
  PageHeader, Card, CardTitle, Grid,
  Input, Select, Btn, Table, Badge, useToast, Toast
} from '../components/UI';

export default function Sections() {
  const [sections,  setSections]  = useState([]);
  const [batches,   setBatches]   = useState([]);
  const [coords,    setCoords]    = useState([]);
  const [form, setForm] = useState({
    section_id: '', section_name: '',
    batch_id: '', coord_id: '',
  });
  const [toast, showToast] = useToast();

  const load = () => {
    sectionsAPI.getAll().then(r    => setSections(r.data.data  || []));
    batchesAPI.getAll().then(r     => setBatches(r.data.data   || []));
    professorsAPI.coordinators().then(r => setCoords(r.data.data || []));
  };
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.section_id || !form.section_name ||
        !form.batch_id   || !form.coord_id)
      return showToast('All fields are required', 'error');
    const res = await sectionsAPI.create({
      section_id:   Number(form.section_id),
      section_name: form.section_name,
      batch_id:     Number(form.batch_id),
      coord_id:     Number(form.coord_id),
    });
    if (res.data.success) {
      showToast('Section created!');
      setForm({ section_id:'', section_name:'', batch_id:'', coord_id:'' });
      load();
    } else {
      showToast(res.data.error || 'Failed', 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Sections"
        subtitle="Create sections and assign faculty coordinators" />

      <Card>
        <CardTitle>Create New Section</CardTitle>
        <Grid cols={2}>
          <Input label="Section ID *" type="number"
            value={form.section_id}
            onChange={e => set('section_id', e.target.value)}
            placeholder="e.g. 18" />
          <Input label="Section Name *"
            value={form.section_name}
            onChange={e => set('section_name', e.target.value)}
            placeholder="e.g. S1" />
          <Select label="Batch *" value={form.batch_id}
            options={batches.map(b => ({
              value: b.batch_id,
              label: `${b.batch_name} — ${b.course_name}`,
            }))}
            onChange={e => set('batch_id', e.target.value)} />
          <Select label="Faculty Coordinator *" value={form.coord_id}
            options={coords.map(c => ({
              value: c.prof_id || c.coord_id,
              label: `${c.prof_name || c.coord_name} (${c.dept_name || ''})`,
            }))}
            onChange={e => set('coord_id', e.target.value)} />
        </Grid>
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          <Btn onClick={submit}>Create Section</Btn>
          <Btn variant="ghost" onClick={load}>Refresh</Btn>
        </div>
      </Card>

      <Card>
        <CardTitle>All Sections ({sections.length})</CardTitle>
        <Table
          headers={['ID','Section','Batch','Course','Dept','Coordinator']}
          rows={sections.map(s => [
            s.section_id,
            <span style={{ fontWeight:600 }}>{s.section_name}</span>,
            s.batch_name,
            s.course_name,
            s.dept_code
              ? <Badge color="blue">{s.dept_code}</Badge>
              : <span style={{ color:'var(--muted)' }}>—</span>,
            s.coord_name
              ? <span style={{ fontSize:12 }}>{s.coord_name}</span>
              : <span style={{ color:'var(--muted)', fontSize:12 }}>Unassigned</span>,
          ])}
          empty="No sections found."
        />
      </Card>

      <Toast {...toast} />
    </div>
  );
}