import { useEffect, useState } from 'react';
import { professorsAPI, departmentsAPI } from '../api';
import {
  PageHeader, Card, CardTitle, Grid,
  Input, Select, Btn, Table, Badge, useToast, Toast
} from '../components/UI';

export default function Coordinators() {
  const [professors,  setProfessors]  = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    prof_id:        '',
    prof_name:      '',
    email:          '',
    phone:          '',
    dept_id:        '',
    designation:    'Assistant Professor',
    is_coordinator: 'N',
  });
  const [toast, showToast] = useToast();

  const load = async () => {
    professorsAPI.getAll().then(r  => setProfessors(r.data.data  || []));
    departmentsAPI.getAll().then(r => setDepartments(r.data.data || []));
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.prof_id || !form.prof_name || !form.dept_id)
      return showToast('ID, Name and Department are required', 'error');
    const res = await professorsAPI.create({
      ...form,
      prof_id: Number(form.prof_id),
      dept_id: Number(form.dept_id),
    });
    if (res.data.success) {
      showToast('Professor added successfully!');
      setForm({
        prof_id: '', prof_name: '', email: '',
        phone: '', dept_id: '',
        designation: 'Assistant Professor', is_coordinator: 'N',
      });
      load();
    } else {
      showToast(res.data.error || 'Failed to add professor', 'error');
    }
  };

  const designations = [
    'Professor',
    'Associate Professor',
    'Assistant Professor',
    'Lecturer',
    'HOD',
  ].map(d => ({ value: d, label: d }));

  const coordinators = professors.filter(p => p.is_coordinator === 'Y');
  const nonCoords    = professors.filter(p => p.is_coordinator === 'N');

  return (
    <div>
      <PageHeader
        title="Professors"
        subtitle="Manage all professors and faculty coordinators"
      />

      {/* Stats strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
        gap: 14, marginBottom: 24,
      }}>
        {[
          { label: 'Total Professors',  value: professors.length,   color: '#60a5fa' },
          { label: 'Coordinators',      value: coordinators.length, color: '#34d399' },
          { label: 'Teaching Only',     value: nonCoords.length,    color: '#fbbf24' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '16px 20px',
            borderTop: `3px solid ${s.color}`,
          }}>
            <div style={{ fontSize: 28, fontWeight: 700,
              color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              fontWeight: 600 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Add professor form */}
      <Card>
        <CardTitle>Add New Professor</CardTitle>
        <Grid cols={3}>
          <Input label="Professor ID *" type="number"
            value={form.prof_id}
            onChange={e => set('prof_id', e.target.value)}
            placeholder="e.g. 11" />
          <Input label="Full Name *"
            value={form.prof_name}
            onChange={e => set('prof_name', e.target.value)}
            placeholder="e.g. Dr. Anil Gupta" />
          <Select label="Department *"
            value={form.dept_id}
            options={departments.map(d => ({
              value: d.dept_id, label: `${d.dept_name} (${d.dept_code})`,
            }))}
            onChange={e => set('dept_id', e.target.value)} />
          <Input label="Email"
            type="email" value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="prof@college.edu" />
          <Input label="Phone"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="10-digit number" />
          <Select label="Designation"
            value={form.designation}
            options={designations}
            onChange={e => set('designation', e.target.value)} />
        </Grid>

        {/* Coordinator toggle */}
        <div style={{
          marginTop: 16, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Is Section Coordinator?
          </span>
          {['Y', 'N'].map(v => (
            <button key={v} type="button"
              onClick={() => set('is_coordinator', v)}
              style={{
                padding: '6px 20px', borderRadius: 8,
                fontWeight: 700, fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit',
                border: `1px solid ${form.is_coordinator === v
                  ? v === 'Y' ? '#10b981' : 'var(--border)'
                  : 'var(--border)'}`,
                background: form.is_coordinator === v
                  ? v === 'Y'
                    ? 'rgba(16,185,129,0.15)'
                    : 'rgba(255,255,255,0.06)'
                  : 'transparent',
                color: form.is_coordinator === v
                  ? v === 'Y' ? '#34d399' : 'var(--text)'
                  : 'var(--muted)',
              }}>
              {v === 'Y' ? 'Yes — Coordinator' : 'No — Teaching Only'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Btn onClick={submit}>Add Professor</Btn>
          <Btn variant="ghost" onClick={load}>Refresh</Btn>
        </div>
      </Card>

      {/* Coordinators table */}
      <Card>
        <CardTitle>
          Faculty Coordinators ({coordinators.length})
        </CardTitle>
        <Table
          headers={['ID', 'Name', 'Department', 'Designation', 'Email', 'Phone', 'Role']}
          rows={coordinators.map(p => [
            p.prof_id,
            <span style={{ fontWeight: 500 }}>{p.prof_name}</span>,
            <Badge color="blue">{p.dept_code || p.dept_name}</Badge>,
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {p.designation}
            </span>,
            p.email || '—',
            p.phone || '—',
            <Badge color="green">Coordinator</Badge>,
          ])}
          empty="No coordinators found."
        />
      </Card>

      {/* All professors table */}
      <Card>
        <CardTitle>
          All Professors ({professors.length})
        </CardTitle>
        <Table
          headers={['ID', 'Name', 'Department', 'Designation', 'Email', 'Phone', 'Role']}
          rows={professors.map(p => [
            p.prof_id,
            <span style={{ fontWeight: 500 }}>{p.prof_name}</span>,
            <Badge color="blue">{p.dept_code || p.dept_name}</Badge>,
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {p.designation}
            </span>,
            p.email || '—',
            p.phone || '—',
            p.is_coordinator === 'Y'
              ? <Badge color="green">Coordinator</Badge>
              : <Badge color="amber">Teaching Only</Badge>,
          ])}
          empty="No professors found. Add professors using the form above."
        />
      </Card>

      <Toast {...toast} />
    </div>
  );
}