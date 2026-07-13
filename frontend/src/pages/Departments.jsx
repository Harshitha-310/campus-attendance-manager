import { useEffect, useState } from 'react';
import { departmentsAPI } from '../api';
import {
  PageHeader, Card, CardTitle, Grid,
  Input, Btn, Table, useToast, Toast
} from '../components/UI';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    dept_id: '', dept_name: '', dept_code: '',
  });
  const [toast, showToast] = useToast();

  const load = () =>
    departmentsAPI.getAll().then(r => setDepartments(r.data.data || []));
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.dept_id || !form.dept_name || !form.dept_code)
      return showToast('All fields required', 'error');
    const res = await departmentsAPI.create({
      dept_id:   Number(form.dept_id),
      dept_name: form.dept_name,
      dept_code: form.dept_code.toUpperCase(),
    });
    if (res.data.success) {
      showToast('Department created!');
      setForm({ dept_id:'', dept_name:'', dept_code:'' });
      load();
    } else {
      showToast(res.data.error || 'Failed', 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Departments"
        subtitle="Manage academic departments" />
      <Card>
        <CardTitle>Add New Department</CardTitle>
        <Grid cols={3}>
          <Input label="Dept ID *" type="number" value={form.dept_id}
            onChange={e => set('dept_id', e.target.value)}
            placeholder="e.g. 6" />
          <Input label="Department Name *" value={form.dept_name}
            onChange={e => set('dept_name', e.target.value)}
            placeholder="e.g. Computer Science Engineering" />
          <Input label="Code *" value={form.dept_code}
            onChange={e => set('dept_code', e.target.value)}
            placeholder="e.g. CSE" />
        </Grid>
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          <Btn onClick={submit}>Add Department</Btn>
          <Btn variant="ghost" onClick={load}>Refresh</Btn>
        </div>
      </Card>
      <Card>
        <CardTitle>All Departments ({departments.length})</CardTitle>
        <Table
          headers={['ID','Department Name','Code']}
          rows={departments.map(d => [
            d.dept_id,
            d.dept_name,
            <span style={{ fontFamily:'monospace', fontSize:13,
              color:'var(--accent2)', fontWeight:700 }}>
              {d.dept_code}
            </span>,
          ])}
          empty="No departments found."
        />
      </Card>
      <Toast {...toast} />
    </div>
  );
}