import { useEffect, useState } from 'react';
import { reportsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Card, CardTitle, Badge, ProgressBar, Table } from '../components/UI';

export default function MyAttendance() {
  const { user }  = useAuth();
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.ref_id) {
      reportsAPI.student(user.ref_id)
        .then(r => { setData(r.data.data || []); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const overall = data.length
    ? Math.round(data.reduce((s, r) => s + (r.attendance_pct || 0), 0) / data.length)
    : 0;

  return (
    <div>
      <PageHeader
        title={`My Attendance`}
        subtitle={`Welcome, ${user?.full_name || 'Student'}`}
      />

      {/* Overall card */}
      {data.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          gap: 16, marginBottom: 24,
        }}>
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '20px 24px',
            borderTop: `3px solid ${overall >= 75 ? '#10b981' : '#ef4444'}`,
          }}>
            <div style={{
              fontSize: 36, fontWeight: 700,
              color: overall >= 75 ? '#10b981' : '#ef4444',
            }}>
              {overall}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6,
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Overall Attendance
            </div>
          </div>
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '20px 24px',
            borderTop: '3px solid #3b82f6',
          }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#60a5fa' }}>
              {data.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6,
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Courses Enrolled
            </div>
          </div>
          <div style={{
            background: overall >= 75
              ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${overall >= 75
              ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            borderRadius: 12, padding: '20px 24px',
          }}>
            <div style={{
              fontSize: 22, fontWeight: 700,
              color: overall >= 75 ? '#10b981' : '#ef4444',
              marginBottom: 6,
            }}>
              {overall >= 75 ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Exam Eligibility
            </div>
            {overall < 75 && (
              <div style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>
                Need {75 - overall}% more to become eligible
              </div>
            )}
          </div>
        </div>
      )}

      <Card>
        <CardTitle>Course-wise Attendance</CardTitle>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40,
            color: 'var(--muted)', fontSize: 13 }}>
            Loading your attendance...
          </div>
        ) : data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40,
            color: 'var(--muted)', fontSize: 13 }}>
            No attendance records found for your account.
          </div>
        ) : (
          <Table
            headers={['Course','Section','Total Classes',
                      'Present','Attendance %','Status']}
            rows={data.map(r => [
              r.course_name,
              <Badge color="blue">{r.section_name}</Badge>,
              r.total_classes,
              r.present_count,
              <ProgressBar value={r.attendance_pct || 0} />,
              <Badge color={r.eligibility === 'ELIGIBLE' ? 'green' : 'red'}>
                {r.eligibility}
              </Badge>,
            ])}
          />
        )}
      </Card>
    </div>
  );
}