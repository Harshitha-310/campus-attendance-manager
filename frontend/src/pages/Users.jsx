import { useState } from 'react';
import { authAPI } from '../api';
import { PageHeader, Card, CardTitle, Grid, Input, Select, Btn, useToast, Toast } from '../components/UI';

export default function Users() {
  const [form, setForm] = useState({
    username: '', password: '', role: '',
    ref_id: '', full_name: '',
  });
  const [toast, showToast] = useToast();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.username || !form.password || !form.role || !form.full_name)
      return showToast('Fill all required fields', 'error');
    const res = await authAPI.register(form);
    if (res.data.success) {
      showToast('User created successfully!');
      setForm({ username:'', password:'', role:'', ref_id:'', full_name:'' });
    } else {
      showToast(res.data.detail || 'Failed to create user', 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Manage Users"
        subtitle="Create login accounts for professors and students" />
      <Card>
        <CardTitle>Create New User Account</CardTitle>
        <Grid cols={2}>
          <Input label="Full Name *" value={form.full_name}
            onChange={e => set('full_name', e.target.value)}
            placeholder="e.g. Dr. Ramesh Sharma" />
          <Input label="Username *" value={form.username}
            onChange={e => set('username', e.target.value)}
            placeholder="e.g. ramesh.sharma" />
          <Input label="Password *" type="password" value={form.password}
            onChange={e => set('password', e.target.value)}
            placeholder="Set a password" />
          <Select label="Role *" value={form.role}
            options={[
              { value: 'admin',     label: 'Admin' },
              { value: 'professor', label: 'Professor' },
              { value: 'student',   label: 'Student' },
            ]}
            onChange={e => set('role', e.target.value)} />
          <Input label="Reference ID" type="number" value={form.ref_id}
            onChange={e => set('ref_id', e.target.value)}
            placeholder="Student ID or Coordinator ID" />
        </Grid>
        <div style={{
          marginTop: 12, fontSize: 12, color: 'var(--muted)',
          padding: '10px 14px', background: 'var(--bg)',
          borderRadius: 8, border: '1px solid var(--border)',
        }}>
          Reference ID: For students enter their Student ID.
          For professors enter their Coordinator ID.
          This links the login to their data.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Btn onClick={submit}>Create Account</Btn>
        </div>
      </Card>

      <Card>
        <CardTitle>Role Permissions</CardTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Feature','Admin','Professor','Student'].map(h => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--accent2)', fontSize: 11,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Dashboard',           '✓','✓','✓'],
              ['Register Students',   '✓','✗','✗'],
              ['Create Courses',      '✓','✗','✗'],
              ['Create Batches',      '✓','✗','✗'],
              ['Create Sections',     '✓','✗','✗'],
              ['Mark Attendance',     '✓','✓','✗'],
              ['View All Reports',    '✓','✓','✗'],
              ['View Own Attendance', '✓','✗','✓'],
              ['Manage Users',        '✓','✗','✗'],
            ].map((row, i) => (
              <tr key={i}
                onMouseOver={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseOut={e  => e.currentTarget.style.background = 'transparent'}>
                {row.map((cell, j) => (
                  <td key={j} style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border)',
                    color: cell === '✓' ? '#34d399'
                         : cell === '✗' ? '#f87171'
                         : 'var(--text)',
                    fontWeight: cell === '✓' || cell === '✗' ? 700 : 400,
                  }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Toast {...toast} />
    </div>
  );
}