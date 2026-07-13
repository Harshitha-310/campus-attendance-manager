import { useEffect, useState } from 'react';
import { attendanceAPI, sectionsAPI, slotsAPI } from '../api';
import { PageHeader, Card, CardTitle, Btn, useToast, Toast } from '../components/UI';

export default function Attendance() {
  const [sections,   setSections]   = useState([]);
  const [slots,      setSlots]      = useState([]);
  const [students,   setStudents]   = useState([]);
  const [statuses,   setStatuses]   = useState({});
  const [sectionInfo,setSectionInfo]= useState(null);
  const [loaded,     setLoaded]     = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    section_id: '',
    slot_id:    '',
    att_date:   new Date().toISOString().split('T')[0],
  });

  const [toast, showToast] = useToast();

  useEffect(() => {
    sectionsAPI.getAll().then(r => setSections(r.data.data || []));
    slotsAPI.getAll().then(r => setSlots(r.data.data || []));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSectionChange = async (secId) => {
    set('section_id', secId);
    setLoaded(false);
    setStudents([]);
    setSectionInfo(null);
    if (secId) {
      const info = sections.find(s => String(s.section_id) === String(secId));
      setSectionInfo(info || null);
    }
  };

  const loadStudents = async () => {
    if (!form.section_id) return showToast('Select a section first', 'error');
    const res = await sectionsAPI.students(form.section_id);
    const list = res.data.data || [];
    if (list.length === 0) return showToast('No students in this section', 'error');
    setStudents(list);
    const init = {};
    list.forEach(s => { init[s.student_id] = 'P'; });
    setStatuses(init);
    setLoaded(true);
  };

  const markAll = (st) => {
    const all = {};
    students.forEach(s => { all[s.student_id] = st; });
    setStatuses(all);
  };

  const submit = async () => {
    if (!form.slot_id || !form.att_date)
      return showToast('Select slot and date', 'error');
    setSubmitting(true);
    const records = students.map(s => ({
      student_id: s.student_id,
      section_id: parseInt(form.section_id),
      slot_id:    parseInt(form.slot_id),
      att_date:   form.att_date,
      status:     statuses[s.student_id] || 'A',
    }));
    const res = await attendanceAPI.markBulk({ records });
    setSubmitting(false);
    if (res.data.success) {
      const errs = res.data.errors?.length || 0;
      showToast(
        errs === 0
          ? `Attendance saved for ${records.length} students!`
          : `Saved with ${errs} error(s)`,
        errs ? 'error' : 'success'
      );
      if (errs > 0) console.error(res.data.errors);
    } else {
      showToast(res.data.error || 'Failed to submit', 'error');
    }
  };

  const presentCount = Object.values(statuses).filter(s => s === 'P').length;
  const absentCount  = Object.values(statuses).filter(s => s === 'A').length;

  const selectedSlot = slots.find(s => String(s.slot_id) === String(form.slot_id));

  return (
    <div>
      <PageHeader title="Mark Attendance"
        subtitle="Select department, course, section and slot to mark attendance" />

      {/* Selection card */}
      <Card>
        <CardTitle>Class Details</CardTitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
          gap:16, marginBottom:16 }}>

          {/* Section — shows course and dept info */}
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:11, color:'var(--muted)', fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.06em' }}>
              Section *
            </label>
            <select value={form.section_id}
              onChange={e => handleSectionChange(e.target.value)}
              style={{ background:'var(--bg)', border:'1px solid var(--border)',
                borderRadius:8, color:'var(--text)', padding:'9px 12px',
                fontSize:13, outline:'none', fontFamily:'inherit' }}>
              <option value="">Select Section</option>
              {sections.map(s => (
                <option key={s.section_id} value={s.section_id}>
                  {s.section_name} — {s.course_name} ({s.dept_code || s.dept_name})
                </option>
              ))}
            </select>
          </div>

          {/* Slot */}
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:11, color:'var(--muted)', fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.06em' }}>
              Slot *
            </label>
            <select value={form.slot_id}
              onChange={e => set('slot_id', e.target.value)}
              style={{ background:'var(--bg)', border:'1px solid var(--border)',
                borderRadius:8, color:'var(--text)', padding:'9px 12px',
                fontSize:13, outline:'none', fontFamily:'inherit' }}>
              <option value="">Select Slot</option>
              {slots.map(s => (
                <option key={s.slot_id} value={s.slot_id}>
                  Slot {s.slot_number} &nbsp;({s.start_time} – {s.end_time})
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:11, color:'var(--muted)', fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.06em' }}>
              Date *
            </label>
            <input type="date" value={form.att_date}
              onChange={e => set('att_date', e.target.value)}
              style={{ background:'var(--bg)', border:'1px solid var(--border)',
                borderRadius:8, color:'var(--text)', padding:'9px 12px',
                fontSize:13, fontFamily:'inherit', outline:'none' }} />
          </div>
        </div>

        {/* Section info panel — shows dept + course + coordinator */}
        {sectionInfo && (
          <div style={{
            background:'var(--bg)', border:'1px solid var(--border)',
            borderRadius:10, padding:'14px 18px', marginBottom:16,
            display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16,
          }}>
            <div>
              <div style={{ fontSize:10, color:'var(--muted)', fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.06em',
                marginBottom:4 }}>Department</div>
              <div style={{ fontSize:13, fontWeight:600, color:'#a78bfa' }}>
                {sectionInfo.dept_name || '—'}
              </div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>
                {sectionInfo.dept_code}
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, color:'var(--muted)', fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.06em',
                marginBottom:4 }}>Course</div>
              <div style={{ fontSize:13, fontWeight:600, color:'#60a5fa' }}>
                {sectionInfo.course_name || '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, color:'var(--muted)', fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.06em',
                marginBottom:4 }}>Section</div>
              <div style={{ fontSize:13, fontWeight:600, color:'#fbbf24' }}>
                {sectionInfo.section_name}
              </div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>
                {sectionInfo.batch_name}
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, color:'var(--muted)', fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.06em',
                marginBottom:4 }}>Coordinator</div>
              <div style={{ fontSize:13, fontWeight:600, color:'#34d399' }}>
                {sectionInfo.coord_name || '—'}
              </div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>
                {sectionInfo.coord_designation || ''}
              </div>
            </div>
          </div>
        )}

        {/* Slot info strip */}
        {selectedSlot && (
          <div style={{
            background:'rgba(59,130,246,0.06)',
            border:'1px solid rgba(59,130,246,0.2)',
            borderRadius:8, padding:'10px 16px', marginBottom:16,
            display:'flex', gap:24, alignItems:'center',
          }}>
            <span style={{ fontSize:11, color:'var(--muted)',
              textTransform:'uppercase', fontWeight:600 }}>
              Selected Slot:
            </span>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--accent2)' }}>
              Slot {selectedSlot.slot_number}
            </span>
            <span style={{ fontSize:13, color:'var(--muted)' }}>
              {selectedSlot.start_time} – {selectedSlot.end_time}
            </span>
            <span style={{ fontSize:12, color:'var(--muted)' }}>
              Date: <strong style={{ color:'var(--text)' }}>{form.att_date}</strong>
            </span>
          </div>
        )}

        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <Btn variant="outline" onClick={loadStudents}>
            Load Students
          </Btn>
          {loaded && (
            <>
              <Btn variant="success" onClick={() => markAll('P')}>
                All Present
              </Btn>
              <Btn variant="danger" onClick={() => markAll('A')}>
                All Absent
              </Btn>
            </>
          )}
        </div>
      </Card>

      {/* Student list */}
      {loaded && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between',
            alignItems:'center', marginBottom:16,
            paddingBottom:12, borderBottom:'1px solid var(--border)' }}>
            <div>
              <span style={{ fontSize:13, fontWeight:600,
                color:'var(--accent2)' }}>
                {students.length} Students
              </span>
              {sectionInfo && (
                <span style={{ fontSize:12, color:'var(--muted)', marginLeft:12 }}>
                  {sectionInfo.course_name} — {sectionInfo.section_name}
                </span>
              )}
            </div>
            <div style={{ display:'flex', gap:16, fontSize:12 }}>
              <span style={{ color:'#34d399', fontWeight:600 }}>
                Present: {presentCount}
              </span>
              <span style={{ color:'#f87171', fontWeight:600 }}>
                Absent: {absentCount}
              </span>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {students.map(s => {
              const isPresent = statuses[s.student_id] === 'P';
              return (
                <div key={s.student_id} style={{
                  display:'flex', alignItems:'center',
                  justifyContent:'space-between',
                  padding:'10px 16px', borderRadius:8,
                  background: isPresent
                    ? 'rgba(16,185,129,0.06)'
                    : 'rgba(239,68,68,0.06)',
                  border: `1px solid ${isPresent
                    ? 'rgba(16,185,129,0.2)'
                    : 'rgba(239,68,68,0.2)'}`,
                  transition:'all 0.15s',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    {/* Avatar circle */}
                    <div style={{
                      width:36, height:36, borderRadius:'50%',
                      background: isPresent
                        ? 'rgba(16,185,129,0.15)'
                        : 'rgba(239,68,68,0.15)',
                      display:'flex', alignItems:'center',
                      justifyContent:'center',
                      fontSize:13, fontWeight:700,
                      color: isPresent ? '#34d399' : '#f87171',
                      flexShrink:0,
                    }}>
                      {s.student_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14 }}>
                        {s.student_name}
                      </div>
                      <div style={{ fontSize:11, color:'var(--muted)',
                        marginTop:2, display:'flex', gap:10 }}>
                        <span>ID: {s.student_id}</span>
                        <span>·</span>
                        <span>{s.dept_name || s.branch}</span>
                        {s.dept_code && (
                          <>
                            <span>·</span>
                            <span style={{ color:'var(--accent2)',
                              fontWeight:600 }}>{s.dept_code}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* P / A buttons */}
                  <div style={{ display:'flex', gap:8 }}>
                    {['P','A'].map(st => (
                      <button key={st}
                        onClick={() => setStatuses(prev => ({
                          ...prev, [s.student_id]: st
                        }))}
                        style={{
                          width:44, height:44, borderRadius:8,
                          fontWeight:800, fontSize:15,
                          cursor:'pointer', fontFamily:'inherit',
                          transition:'all 0.15s',
                          border: statuses[s.student_id] === st
                            ? `2px solid ${st==='P' ? '#10b981' : '#ef4444'}`
                            : '1px solid var(--border)',
                          background: statuses[s.student_id] === st
                            ? st === 'P'
                              ? 'rgba(16,185,129,0.2)'
                              : 'rgba(239,68,68,0.2)'
                            : 'var(--bg)',
                          color: statuses[s.student_id] === st
                            ? st === 'P' ? '#34d399' : '#f87171'
                            : 'var(--muted)',
                        }}>
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit */}
          <div style={{ marginTop:20, display:'flex',
            alignItems:'center', gap:16 }}>
            <Btn variant="success" onClick={submit} disabled={submitting}>
              {submitting ? 'Submitting...' : `Submit Attendance (${students.length} students)`}
            </Btn>
            {sectionInfo && (
              <span style={{ fontSize:12, color:'var(--muted)' }}>
                {sectionInfo.course_name} · {sectionInfo.section_name}
                · Slot {selectedSlot?.slot_number}
                · {form.att_date}
              </span>
            )}
          </div>
        </Card>
      )}

      <Toast {...toast} />
    </div>
  );
}