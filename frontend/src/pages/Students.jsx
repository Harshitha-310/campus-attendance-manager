import { useEffect, useState } from 'react';
import { studentsAPI } from '../api';
import {
  PageHeader, Card, CardTitle, Grid,
  Input, Select, Btn, Table, useToast, Toast
} from '../components/UI';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [search,   setSearch]   = useState('');
  const [form, setForm] = useState({
    student_id: '', name: '', branch: '',
    semester: '', email: '', phone: '',
  });
  const [toast, showToast] = useToast();

  const load = () =>
    studentsAPI.getAll().then(r => setStudents(r.data.data || []));
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.student_id || !form.name || !form.branch || !form.semester)
      return showToast('Fill all required fields', 'error');
    const res = await studentsAPI.register(form);
    if (res.data.success) {
      showToast('Student registered!');
      setForm({ student_id: '', name: '', branch: '', semester: '', email: '', phone: '' });
      load();
    } else showToast(res.data.error, 'error');
  };

  const branches = ['CSE','IT','ECE','ME','CE'].map(b => ({ value: b, label: b }));
  const sems     = [1,2,3,4,5,6,7,8].map(s => ({ value: s, label: `Semester ${s}` }));

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return !q
      || s.student_name?.toLowerCase().includes(q)
      || s.branch?.toLowerCase().includes(q)
      || String(s.student_id).includes(q)
      || s.email?.toLowerCase().includes(q);
  });

  return (
    <div>
      <PageHeader title="Students" subtitle="Register and manage students" />

      <Card>
        <CardTitle>Register New Student</CardTitle>
        <Grid cols={3}>
          <Input label="Student ID *" type="number" value={form.student_id}
            onChange={e => set('student_id', e.target.value)} placeholder="e.g. 1004" />
          <Input label="Full Name *" value={form.name}
            onChange={e => set('name', e.target.value)} placeholder="e.g. Rahul Sharma" />
          <Select label="Branch *" value={form.branch} options={branches}
            onChange={e => set('branch', e.target.value)} />
          <Select label="Semester *" value={form.semester} options={sems}
            onChange={e => set('semester', e.target.value)} />
          <Input label="Email" type="email" value={form.email}
            onChange={e => set('email', e.target.value)} placeholder="student@email.com" />
          <Input label="Phone" value={form.phone}
            onChange={e => set('phone', e.target.value)} placeholder="10-digit number" />
        </Grid>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Btn onClick={submit}>Register Student</Btn>
          <Btn variant="ghost" onClick={load}>Refresh</Btn>
        </div>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16,
          paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent2)' }}>
            All Students ({filtered.length})
          </span>
          <input
            placeholder="Search by name, ID, branch, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text)', padding: '7px 14px',
              fontSize: 13, outline: 'none', width: 280, fontFamily: 'inherit',
            }}
          />
        </div>
        <Table
          headers={['ID', 'Name', 'Branch', 'Semester', 'Email', 'Phone']}
          rows={filtered.map(s => [
            s.student_id, s.student_name, s.branch,
            `Sem ${s.semester}`, s.email || '—', s.phone || '—',
          ])}
        />
      </Card>

      <Toast {...toast} />
    </div>
  );
}