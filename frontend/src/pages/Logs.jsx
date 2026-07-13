import { useEffect, useState } from 'react';
import { logsAPI } from '../api';
import { PageHeader, Card, CardTitle, Badge, Table } from '../components/UI';

export default function Logs() {
  const [logs,     setLogs]     = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [tab,      setTab]      = useState('warnings');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      logsAPI.all().then(r      => setLogs(r.data.data     || [])),
      logsAPI.warnings().then(r => setWarnings(r.data.data || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: 'warnings', label: `Warnings (${warnings.length})` },
    { key: 'all',      label: `All Logs (${logs.length})` },
  ];

  const isWarning = (msg) => msg?.startsWith('WARNING');
  const isOk      = (msg) => msg?.startsWith('OK');

  return (
    <div>
      <PageHeader
        title="Attendance Trigger Logs"
        subtitle="Auto-generated logs from the check_attendance_eligibility trigger"
      />

      {/* Trigger info card */}
      <Card style={{ marginBottom: 20,
        borderColor: 'rgba(59,130,246,0.3)' }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: 8 }}>Trigger 1</div>
            <div style={{ fontSize: 14, fontWeight: 600,
              color: 'var(--accent2)', marginBottom: 4 }}>
              prevent_dup_attendance
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)',
              lineHeight: 1.6 }}>
              Fires BEFORE INSERT on attendance.
              Checks student is registered and no duplicate
              entry exists for same student + section + slot + date.
              Raises error if violated.
            </div>
          </div>
          <div style={{ width: 1, background: 'var(--border)',
            flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: 8 }}>Trigger 2</div>
            <div style={{ fontSize: 14, fontWeight: 600,
              color: '#fbbf24', marginBottom: 4 }}>
              check_attendance_eligibility
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)',
              lineHeight: 1.6 }}>
              Fires AFTER INSERT OR UPDATE on attendance.
              Calculates attendance percentage and logs a
              WARNING if below 75%, OK if above.
              Never blocks the insert.
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
        gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Log Entries', value: logs.length,     color: '#60a5fa' },
          { label: 'Warnings',          value: warnings.length, color: '#ef4444' },
          { label: 'OK Entries',
            value: logs.filter(l => isOk(l.action_taken)).length,
            color: '#10b981' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '16px 20px',
            borderTop: `3px solid ${s.color}`,
          }}>
            <div style={{ fontSize: 26, fontWeight: 700,
              color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '7px 18px', borderRadius: 8, fontSize: 12,
            fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            border: `1px solid ${tab === t.key
              ? 'var(--accent)' : 'var(--border)'}`,
            background: tab === t.key
              ? 'rgba(59,130,246,0.12)' : 'transparent',
            color: tab === t.key ? 'var(--accent2)' : 'var(--muted)',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Warnings tab */}
      {tab === 'warnings' && (
        <Card>
          <CardTitle>
            Students with Attendance Below 75%
          </CardTitle>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40,
              color: 'var(--muted)', fontSize: 13 }}>Loading...</div>
          ) : (
            <Table
              headers={['Student','Course','Section',
                        'Att %','Date','Warning Message']}
              rows={warnings.map(w => [
                w.student_name,
                w.course_name,
                <Badge color="blue">{w.section_name}</Badge>,
                <span style={{ fontWeight: 700,
                  color: '#f87171' }}>{w.att_pct}%</span>,
                w.log_date,
                <span style={{ fontSize: 11, color: '#f87171',
                  lineHeight: 1.5 }}>{w.action_taken}</span>,
              ])}
              empty="No warnings — all students above 75%!"
            />
          )}
        </Card>
      )}

      {/* All logs tab */}
      {tab === 'all' && (
        <Card>
          <CardTitle>All Trigger Log Entries</CardTitle>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40,
              color: 'var(--muted)', fontSize: 13 }}>Loading...</div>
          ) : (
            <Table
              headers={['ID','Student','Course','Section',
                        'Old','New','Att %','Date','Status']}
              rows={logs.map(l => [
                l.log_id,
                l.student_name,
                l.course_name,
                <Badge color="blue">{l.section_name}</Badge>,
                l.old_status
                  ? <Badge color={l.old_status==='P' ? 'green' : 'red'}>
                      {l.old_status}
                    </Badge>
                  : '—',
                <Badge color={l.new_status==='P' ? 'green' : 'red'}>
                  {l.new_status}
                </Badge>,
                <span style={{ fontWeight: 700,
                  color: (l.att_pct||0) >= 75 ? '#34d399' : '#f87171' }}>
                  {l.att_pct}%
                </span>,
                l.log_date,
                isWarning(l.action_taken)
                  ? <Badge color="red">WARNING</Badge>
                  : isOk(l.action_taken)
                  ? <Badge color="green">OK</Badge>
                  : <Badge color="amber">INFO</Badge>,
              ])}
              empty="No log entries yet."
            />
          )}
        </Card>
      )}
    </div>
  );
}