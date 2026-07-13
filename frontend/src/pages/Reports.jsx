import { useEffect, useState } from 'react';
import { reportsAPI, sectionsAPI, studentsAPI, attendanceAPI } from '../api';
import {
  PageHeader, Card, CardTitle, Select, Btn,
  Table, Badge, ProgressBar, useToast, Toast
} from '../components/UI';

function exportCSV(data) {
  if (!data.length) return;
  const headers = ['Student','Branch','Dept','Course','Section',
                   'Coordinator','Total Classes','Present',
                   'Attendance %','Status'];
  const rows = data.map(r => [
    r.student_name, r.branch, r.dept_name, r.course_name,
    r.section_name, r.coordinator_name,
    r.total_classes, r.present_count,
    r.attendance_pct, r.eligibility,
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${v ?? ''}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Date-wise modal with inline edit on every slot ──────────────
function DateWiseModal({ student, sectionId, onClose, onRefresh }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [toast,   showToast]  = useToast();

  const load = () => {
    setLoading(true);
    setError('');
    if (!student?.student_id || !sectionId) {
      setError('Missing student ID or section ID');
      setLoading(false);
      return;
    }
    attendanceAPI.dateWise(student.student_id, sectionId)
      .then(r => {
        if (r.data.success) setRecords(r.data.data || []);
        else setError(r.data.error || 'Failed to load records');
        setLoading(false);
      })
      .catch(err => {
        setError(`Server error: ${err.message}`);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const grouped = records.reduce((acc, r) => {
    const key = r.att_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec'];
    const d = new Date(Number(year), parseInt(month) - 1, Number(day));
    const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return `${weekdays[d.getDay()]}, ${day} ${months[parseInt(month)-1]} ${year}`;
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await attendanceAPI.editRecord({
        student_id: student.student_id,
        section_id: Number(sectionId),
        slot_id:    editing.slot_id,
        att_date:   editing.att_date,
        status:     editing.newStatus,
      });
      if (res.data.success) {
        showToast('Attendance updated successfully!');
        setEditing(null);
        load();
        if (onRefresh) onRefresh();
      } else {
        showToast(res.data.error || 'Update failed', 'error');
      }
    } catch (e) {
      showToast('Connection error', 'error');
    }
    setSaving(false);
  };

  const totalDates   = Object.keys(grouped).length;
  const presentDates = Object.entries(grouped)
    .filter(([, slots]) => slots.some(s => s.status === 'P')).length;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000, padding: 24,
    }}>
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 16, width: '100%', maxWidth: 680,
        maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontWeight: 700, fontSize: 17,
              color: 'var(--text)',
            }}>
              {student.student_name}
            </div>
            <div style={{
              color: 'var(--muted)', fontSize: 12, marginTop: 3,
            }}>
              Date-wise attendance — Student ID: {student.student_id}
              &nbsp;|&nbsp; Section ID: {sectionId}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--text)', borderRadius: 8,
            padding: '7px 18px', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
          }}>
            Close
          </button>
        </div>

        {/* Summary strip */}
        {!loading && !error && records.length > 0 && (
          <div style={{
            padding: '12px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', gap: 28,
            flexShrink: 0, flexWrap: 'wrap',
          }}>
            {[
              { label: 'Total slots',
                value: records.length,
                color: 'var(--accent2)' },
              { label: 'Present',
                value: records.filter(r => r.status === 'P').length,
                color: '#34d399' },
              { label: 'Absent',
                value: records.filter(r => r.status === 'A').length,
                color: '#f87171' },
              { label: 'Days attended',
                value: `${presentDates} / ${totalDates}`,
                color: '#fbbf24' },
            ].map((item, i) => (
              <div key={i} style={{ fontSize: 12 }}>
                <span style={{ color: 'var(--muted)' }}>
                  {item.label}:{' '}
                </span>
                <span style={{
                  fontWeight: 700, color: item.color,
                }}>
                  {item.value}
                </span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>
              Click ✎ on any slot to edit
            </div>
          </div>
        )}

        {/* Scrollable body */}
        <div style={{
          overflowY: 'auto', padding: '16px 24px', flex: 1,
        }}>

          {/* Loading */}
          {loading && (
            <div style={{
              textAlign: 'center', padding: '60px 0',
            }}>
              <div style={{
                width: 28, height: 28,
                border: '2px solid var(--border)',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                margin: '0 auto 14px',
              }} />
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                Loading attendance records...
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{
              textAlign: 'center', color: '#f87171',
              padding: '40px 24px', fontSize: 13,
              background: 'rgba(239,68,68,0.06)',
              borderRadius: 10,
              border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <div style={{ fontSize: 20, marginBottom: 10 }}>⚠</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Failed to load records
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                {error}
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && records.length === 0 && (
            <div style={{
              textAlign: 'center', color: 'var(--muted)',
              padding: '60px 0', fontSize: 13,
            }}>
              No attendance records found for this student
              in this section.
            </div>
          )}

          {/* Records */}
          {!loading && !error && records.length > 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {Object.entries(grouped).map(([date, slots]) => {
                const presentCount =
                  slots.filter(s => s.status === 'P').length;
                const allPresent = presentCount === slots.length;
                const allAbsent  = presentCount === 0;

                const borderColor = allPresent
                  ? 'rgba(16,185,129,0.35)'
                  : allAbsent
                  ? 'rgba(239,68,68,0.35)'
                  : 'rgba(251,191,36,0.35)';

                const bgColor = allPresent
                  ? 'rgba(16,185,129,0.05)'
                  : allAbsent
                  ? 'rgba(239,68,68,0.05)'
                  : 'rgba(251,191,36,0.05)';

                const tagColor = allPresent
                  ? { bg: 'rgba(16,185,129,0.15)', color: '#34d399' }
                  : allAbsent
                  ? { bg: 'rgba(239,68,68,0.15)',  color: '#f87171' }
                  : { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' };

                const tagLabel = allPresent
                  ? 'FULL PRESENT'
                  : allAbsent ? 'FULL ABSENT' : 'PARTIAL';

                return (
                  <div key={date} style={{
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 10, padding: '12px 16px',
                  }}>
                    {/* Date row */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 10,
                    }}>
                      <span style={{
                        fontWeight: 700, fontSize: 13,
                        color: 'var(--text)',
                      }}>
                        {formatDate(date)}
                      </span>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <span style={{
                          fontSize: 11, color: 'var(--muted)',
                        }}>
                          {presentCount} / {slots.length} present
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          padding: '3px 10px', borderRadius: 20,
                          background: tagColor.bg, color: tagColor.color,
                        }}>
                          {tagLabel}
                        </span>
                      </div>
                    </div>

                    {/* Slot pills — each with inline edit */}
                    <div style={{
                      display: 'flex', gap: 8,
                      flexWrap: 'wrap', alignItems: 'center',
                    }}>
                      {slots.map((s, i) => {
                        const isEditingThis =
                          editing?.slot_id  === s.slot_id &&
                          editing?.att_date === date;

                        return (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center',
                            gap: 5, padding: '5px 12px',
                            borderRadius: 8, fontSize: 12,
                            fontWeight: 600,
                            background: s.status === 'P'
                              ? 'rgba(16,185,129,0.12)'
                              : 'rgba(239,68,68,0.12)',
                            border: `1px solid ${s.status === 'P'
                              ? 'rgba(16,185,129,0.3)'
                              : 'rgba(239,68,68,0.3)'}`,
                          }}>
                            {/* Slot info */}
                            <span style={{ opacity: 0.75 }}>
                              Slot {s.slot_number}
                            </span>
                            <span style={{ opacity: 0.4 }}>|</span>
                            <span>
                              {s.start_time}–{s.end_time}
                            </span>
                            <span style={{
                              color: s.status === 'P'
                                ? '#34d399' : '#f87171',
                            }}>
                              {s.status === 'P' ? '✓' : '✗'}
                            </span>

                            {/* Inline edit controls */}
                            {isEditingThis ? (
                              <div style={{
                                display: 'flex', gap: 4, marginLeft: 6,
                              }}>
                                {['P', 'A'].map(st => (
                                  <button key={st}
                                    onClick={() => setEditing(e =>
                                      ({ ...e, newStatus: st }))}
                                    style={{
                                      padding: '2px 10px',
                                      borderRadius: 5,
                                      fontSize: 11, fontWeight: 800,
                                      cursor: 'pointer',
                                      fontFamily: 'inherit',
                                      transition: 'all 0.12s',
                                      border: `1px solid ${
                                        editing.newStatus === st
                                          ? st === 'P'
                                            ? '#10b981' : '#ef4444'
                                          : 'var(--border)'}`,
                                      background:
                                        editing.newStatus === st
                                          ? st === 'P'
                                            ? 'rgba(16,185,129,0.25)'
                                            : 'rgba(239,68,68,0.25)'
                                          : 'var(--bg)',
                                      color: editing.newStatus === st
                                        ? st === 'P'
                                          ? '#34d399' : '#f87171'
                                        : 'var(--muted)',
                                    }}>
                                    {st}
                                  </button>
                                ))}
                                <button
                                  onClick={saveEdit}
                                  disabled={saving}
                                  style={{
                                    padding: '2px 10px',
                                    borderRadius: 5,
                                    fontSize: 11, fontWeight: 700,
                                    cursor: saving
                                      ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit',
                                    background: saving
                                      ? '#1e3a5f' : '#3b82f6',
                                    border: 'none', color: '#fff',
                                  }}>
                                  {saving ? '...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => setEditing(null)}
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: 5,
                                    fontSize: 11,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    background: 'transparent',
                                    border: '1px solid var(--border)',
                                    color: 'var(--muted)',
                                  }}>
                                  ✕
                                </button>
                              </div>
                            ) : (
                              /* Edit pencil button */
                              <button
                                onClick={() => setEditing({
                                  slot_id:   s.slot_id,
                                  att_date:  date,
                                  newStatus: s.status,
                                })}
                                title="Edit this attendance record"
                                style={{
                                  marginLeft: 4,
                                  padding: '2px 7px',
                                  borderRadius: 5,
                                  fontSize: 12,
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  background: 'rgba(255,255,255,0.06)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--muted)',
                                  lineHeight: 1,
                                }}>
                                ✎
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Toast {...toast} />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Main Reports page ────────────────────────────────────────────
export default function Reports() {
  const [type,      setType]      = useState('all');
  const [sections,  setSecs]      = useState([]);
  const [students,  setStus]      = useState([]);
  const [secId,     setSecId]     = useState('');
  const [stuId,     setStuId]     = useState('');
  const [data,      setData]      = useState([]);
  const [search,    setSearch]    = useState('');
  const [dateModal, setDateModal] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [toast,     showToast]    = useToast();

  useEffect(() => {
    sectionsAPI.getAll().then(r => setSecs(r.data.data || []));
    studentsAPI.getAll().then(r => setStus(r.data.data || []));
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await reportsAPI.all();
      setData(res.data.data || []);
      setSearch('');
    } catch (e) {
      showToast('Failed to load report', 'error');
    }
    setLoading(false);
  };

  const generate = async () => {
    setLoading(true);
    try {
      let res;
      if (type === 'section') {
        if (!secId) {
          showToast('Select a section', 'error');
          setLoading(false);
          return;
        }
        res = await reportsAPI.section(secId);
      } else if (type === 'student') {
        if (!stuId) {
          showToast('Select a student', 'error');
          setLoading(false);
          return;
        }
        res = await reportsAPI.student(stuId);
      } else {
        res = await reportsAPI.all();
      }
      setData(res.data.data || []);
      setSearch('');
    } catch (e) {
      showToast('Failed to load report', 'error');
    }
    setLoading(false);
  };

  const openDateModal = (r) => {
    const sid = r.section_id ?? r.SECTION_ID;
    if (!sid) {
      showToast(
        'Section ID missing — use All Students or By Section report',
        'error'
      );
      return;
    }
    setDateModal({ student: r, sectionId: Number(sid) });
  };

  const filtered = data.filter(r => {
    const q = search.toLowerCase();
    return !q
      || (r.student_name     || '').toLowerCase().includes(q)
      || (r.course_name      || '').toLowerCase().includes(q)
      || (r.branch           || '').toLowerCase().includes(q)
      || (r.dept_name        || '').toLowerCase().includes(q)
      || (r.section_name     || '').toLowerCase().includes(q)
      || (r.coordinator_name || '').toLowerCase().includes(q);
  });

  const eligible    = data.filter(r => r.eligibility === 'ELIGIBLE').length;
  const notEligible = data.filter(r => r.eligibility === 'NOT ELIGIBLE').length;

  return (
    <div>
      <PageHeader
        title="Attendance Reports"
        subtitle="View, search, export and edit attendance records"
      />

      {/* Filter card */}
      <Card>
        <CardTitle>Filter Report</CardTitle>
        <div style={{
          display: 'flex', gap: 16,
          alignItems: 'flex-end', flexWrap: 'wrap',
        }}>
          <div style={{ minWidth: 180 }}>
            <Select
              label="Report Type"
              value={type}
              options={[
                { value: 'all',     label: 'All Students' },
                { value: 'section', label: 'By Section' },
                { value: 'student', label: 'By Student' },
              ]}
              onChange={e => {
                setType(e.target.value);
                setSecId('');
                setStuId('');
              }}
            />
          </div>

          {type === 'section' && (
            <div style={{ minWidth: 220 }}>
              <Select
                label="Section"
                value={secId}
                options={sections.map(s => ({
                  value: s.section_id,
                  label: `${s.section_name} — ${s.batch_name}`,
                }))}
                onChange={e => setSecId(e.target.value)}
              />
            </div>
          )}

          {type === 'student' && (
            <div style={{ minWidth: 220 }}>
              <Select
                label="Student"
                value={stuId}
                options={students.map(s => ({
                  value: s.student_id,
                  label: `${s.student_name} (${s.student_id})`,
                }))}
                onChange={e => setStuId(e.target.value)}
              />
            </div>
          )}

          <Btn onClick={generate} disabled={loading}>
            {loading ? 'Loading...' : 'Generate'}
          </Btn>
          <Btn
            variant="success"
            onClick={() => exportCSV(filtered)}
          >
            Export CSV
          </Btn>
        </div>
      </Card>

      {/* Summary pills */}
      {data.length > 0 && (
        <div style={{
          display: 'flex', gap: 12,
          marginBottom: 20, flexWrap: 'wrap',
        }}>
          <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 10, padding: '10px 20px', fontSize: 13,
          }}>
            Total:{' '}
            <strong style={{ color: 'var(--accent2)' }}>
              {data.length}
            </strong>
          </div>
          <div style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 10, padding: '10px 20px', fontSize: 13,
          }}>
            Eligible:{' '}
            <strong style={{ color: '#34d399' }}>{eligible}</strong>
          </div>
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10, padding: '10px 20px', fontSize: 13,
          }}>
            Not Eligible:{' '}
            <strong style={{ color: '#f87171' }}>{notEligible}</strong>
          </div>
        </div>
      )}

      {/* Results table */}
      <Card>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: 'var(--accent2)',
          }}>
            Results — {filtered.length} record
            {filtered.length !== 1 ? 's' : ''}
          </span>
          <input
            placeholder="Search name, course, dept, section, coordinator..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text)',
              padding: '7px 14px', fontSize: 13,
              outline: 'none', width: 340,
              fontFamily: 'inherit',
            }}
            onFocus={e =>
              e.target.style.borderColor = '#3b82f6'}
            onBlur={e =>
              e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {loading ? (
          <div style={{
            textAlign: 'center', padding: '40px 0',
            color: 'var(--muted)', fontSize: 13,
          }}>
            Loading...
          </div>
        ) : (
          <Table
            headers={[
              'Student', 'Dept', 'Course', 'Section',
              'Coordinator', 'Total', 'Present',
              'Att %', 'Status', 'Actions',
            ]}
            rows={filtered.map(r => [
              <span style={{ fontWeight: 500 }}>
                {r.student_name}
              </span>,
              <Badge color="blue">
                {r.dept_name || r.branch || '—'}
              </Badge>,
              r.course_name,
              <Badge color="blue">{r.section_name}</Badge>,
              <span style={{
                fontSize: 12, color: 'var(--muted)',
              }}>
                {r.coordinator_name || '—'}
              </span>,
              r.total_classes,
              r.present_count,
              <ProgressBar value={r.attendance_pct || 0} />,
              <Badge color={
                r.eligibility === 'ELIGIBLE' ? 'green' : 'red'
              }>
                {r.eligibility}
              </Badge>,
              /* Actions column — View Dates + Edit */
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => openDateModal(r)}
                  title="View date-wise attendance"
                  style={{
                    padding: '4px 10px', borderRadius: 6,
                    fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    color: '#60a5fa', whiteSpace: 'nowrap',
                  }}>
                  View Dates
                </button>
                <button
                  onClick={() => openDateModal(r)}
                  title="Edit attendance — opens date view where you can edit each slot"
                  style={{
                    padding: '4px 10px', borderRadius: 6,
                    fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    background: 'rgba(251,191,36,0.1)',
                    border: '1px solid rgba(251,191,36,0.3)',
                    color: '#fbbf24', whiteSpace: 'nowrap',
                  }}>
                  ✎ Edit
                </button>
              </div>,
            ])}
            empty="No data. Click Generate to load the report."
          />
        )}
      </Card>

      {/* Date-wise + Edit modal */}
      {dateModal && (
        <DateWiseModal
          student={dateModal.student}
          sectionId={dateModal.sectionId}
          onClose={() => setDateModal(null)}
          onRefresh={generate}
        />
      )}

      <Toast {...toast} />
    </div>
  );
}