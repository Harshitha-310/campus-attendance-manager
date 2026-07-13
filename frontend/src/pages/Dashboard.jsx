import { useEffect, useState } from 'react';
import { reportsAPI, coursesAPI, sectionsAPI, professorsAPI, departmentsAPI } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { PageHeader, Card, CardTitle, Badge, ProgressBar, Table } from '../components/UI';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0d1829', border: '1px solid #1a2d4a',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 600, color: '#e2eaf5', marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#60a5fa' }}>Attendance: {payload[0]?.value}%</div>
      {payload[0]?.payload?.present_count !== undefined && (
        <>
          <div style={{ color: '#34d399', marginTop: 2 }}>
            Present: {payload[0].payload.present_count}
          </div>
          <div style={{ color: '#f87171', marginTop: 2 }}>
            Absent: {payload[0].payload.absent_count}
          </div>
        </>
      )}
    </div>
  );
};

export default function Dashboard() {
  const [stats,       setStats]       = useState(null);
  const [report,      setReport]      = useState([]);
  const [alerts,      setAlerts]      = useState([]);
  const [courses,     setCourses]     = useState([]);
  const [sections,    setSections]    = useState([]);
  const [professors,  setProfessors]  = useState([]);
  const [departments, setDepartments] = useState([]);
  const [chartData,   setChartData]   = useState([]);
  const [selCourse,   setSelCourse]   = useState('');
  const [selSection,  setSelSection]  = useState('');
  const [chartMode,   setChartMode]   = useState('all');
  const [chartLoading,setChartLoading]= useState(false);
  const [activeTab,   setActiveTab]   = useState('summary');

  useEffect(() => {
    reportsAPI.stats().then(r       => setStats(r.data.data?.[0]));
    reportsAPI.all().then(r         => setReport(r.data.data || []));
    reportsAPI.alerts().then(r      => setAlerts(r.data.data || []));
    coursesAPI.getAll().then(r      => setCourses(r.data.data || []));
    sectionsAPI.getAll().then(r     => setSections(r.data.data || []));
    professorsAPI.getAll().then(r   => setProfessors(r.data.data || []));
    departmentsAPI.getAll().then(r  => setDepartments(r.data.data || []));
    fetchChart('all', null);
  }, []);

  const fetchChart = async (mode, id) => {
    setChartLoading(true);
    setChartMode(mode);
    let res;
    if      (mode === 'all')     res = await reportsAPI.chartAll();
    else if (mode === 'course')  res = await reportsAPI.chartCourse(id);
    else if (mode === 'section') res = await reportsAPI.chartSection(id);
    setChartData(res.data.data || []);
    setChartLoading(false);
  };

  const handleGenerate = () => {
    if (selSection)     fetchChart('section', selSection);
    else if (selCourse) fetchChart('course',  selCourse);
    else                fetchChart('all',     null);
  };

  const eligible    = report.filter(r => r.eligibility === 'ELIGIBLE').length;
  const notEligible = report.filter(r => r.eligibility === 'NOT ELIGIBLE').length;

  const pieData = chartMode === 'section' ? [
    { name: 'Eligible',     value: chartData.filter(r => (r.avg_pct||0) >= 75).length },
    { name: 'Not Eligible', value: chartData.filter(r => (r.avg_pct||0) <  75).length },
  ] : chartMode === 'course' ? [
    { name: 'Sections ≥75%', value: chartData.filter(r => (r.avg_pct||0) >= 75).length },
    { name: 'Sections <75%', value: chartData.filter(r => (r.avg_pct||0) <  75).length },
  ] : [
    { name: 'Eligible',     value: eligible },
    { name: 'Not Eligible', value: notEligible },
  ];

  const barKey = chartMode === 'section' ? 'student_name' : 'section_name';
  const barLabel = chartMode === 'all'
    ? 'All Sections — Average Attendance %'
    : chartMode === 'course'
    ? `Course: ${courses.find(c => String(c.course_id) === String(selCourse))?.course_name || ''}`
    : `Section: ${sections.find(s => String(s.section_id) === String(selSection))?.section_name || ''} — Students`;

  const statCards = [
    { label: 'Students',      value: stats?.students,     color: '#60a5fa' },
    { label: 'Departments',   value: stats?.departments,  color: '#a78bfa' },
    { label: 'Professors',    value: stats?.professors,   color: '#34d399' },
    { label: 'Coordinators',  value: stats?.coordinators, color: '#fbbf24' },
    { label: 'Courses',       value: stats?.courses,      color: '#f472b6' },
    { label: 'Sections',      value: stats?.sections,     color: '#38bdf8' },
    { label: 'Att. Records',  value: stats?.att_records,  color: '#fb923c' },
    { label: 'Eligible',      value: eligible,            color: '#10b981' },
    { label: 'Not Eligible',  value: notEligible,         color: '#ef4444' },
  ];

  const tabs = ['summary', 'departments', 'professors', 'alerts'];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Live system overview — all entities" />

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(9,1fr)',
        gap: 12, marginBottom: 24,
      }}>
        {statCards.map((s, i) => (
          <div key={i} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '16px 14px',
            borderTop: `3px solid ${s.color}`,
          }}>
            <div style={{ fontSize: 24, fontWeight: 700,
              color: s.color, lineHeight: 1 }}>
              {s.value ?? '—'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              fontWeight: 600 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Chart filter */}
      <Card style={{ marginBottom: 16 }}>
        <CardTitle>Chart Filter — Course → Section → Students</CardTitle>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>Course</label>
            <select value={selCourse}
              onChange={e => { setSelCourse(e.target.value); setSelSection(''); }}
              style={{ background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text)', padding: '9px 12px',
                fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
              <option value="">All Courses</option>
              {courses.map(c => (
                <option key={c.course_id} value={c.course_id}>{c.course_name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>Section</label>
            <select value={selSection} onChange={e => setSelSection(e.target.value)}
              style={{ background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text)', padding: '9px 12px',
                fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
              <option value="">All Sections</option>
              {sections.map(s => (
                <option key={s.section_id} value={s.section_id}>
                  {s.section_name} — {s.course_name}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleGenerate} style={{
            padding: '9px 22px', borderRadius: 8, border: 'none',
            background: '#3b82f6', color: '#fff', fontSize: 13,
            fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>Generate Chart</button>
          <button onClick={() => { setSelCourse(''); setSelSection(''); fetchChart('all', null); }}
            style={{ padding: '9px 22px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--muted)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit' }}>Reset</button>
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)' }}>
          Showing: <span style={{
            fontWeight: 600,
            color: chartMode === 'all' ? '#60a5fa'
                 : chartMode === 'course' ? '#fbbf24' : '#34d399',
          }}>
            {chartMode === 'all' ? 'All sections overview'
             : chartMode === 'course'
             ? `Course — ${courses.find(c => String(c.course_id) === String(selCourse))?.course_name}`
             : `Section — ${sections.find(s => String(s.section_id) === String(selSection))?.section_name}`}
          </span>
        </div>
      </Card>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr',
        gap: 20, marginBottom: 20 }}>
        <Card style={{ marginBottom: 0 }}>
          <CardTitle>{barLabel}</CardTitle>
          {chartLoading ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)',
              padding: 80, fontSize: 13 }}>Loading chart...</div>
          ) : chartData.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)',
              padding: 80, fontSize: 13 }}>No attendance data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}
                  margin={{ top: 24, right: 16, left: -10,
                    bottom: chartData.length > 4 ? 50 : 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2d4a" vertical={false} />
                  <XAxis dataKey={barKey}
                    tick={{ fill: '#5a7a9e', fontSize: 11 }}
                    angle={chartData.length > 4 ? -35 : 0}
                    textAnchor={chartData.length > 4 ? 'end' : 'middle'}
                    interval={0} />
                  <YAxis domain={[0,100]} tick={{ fill: '#5a7a9e', fontSize: 11 }}
                    tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avg_pct" radius={[6,6,0,0]}
                    label={{ position:'top', fontSize:11, fill:'#94a3b8',
                      formatter: v => v ? `${v}%` : '' }}>
                    {chartData.map((entry, i) => (
                      <Cell key={i}
                        fill={(entry.avg_pct||0) >= 75 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center',
                marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2,
                    background: '#10b981', display: 'inline-block' }} />
                  ≥ 75% Eligible
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2,
                    background: '#ef4444', display: 'inline-block' }} />
                  &lt; 75% Not Eligible
                </span>
              </div>
            </>
          )}
        </Card>

        <Card style={{ marginBottom: 0 }}>
          <CardTitle>
            {chartMode === 'all' ? 'Overall Eligibility'
             : chartMode === 'course' ? 'Course Eligibility'
             : 'Section Eligibility'}
          </CardTitle>
          {pieData[0].value + pieData[1].value === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)',
              padding: 80, fontSize: 13 }}>No data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={4} dataKey="value">
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Legend formatter={v => (
                    <span style={{ color:'var(--muted)', fontSize:12 }}>{v}</span>
                  )} />
                  <Tooltip contentStyle={{
                    background:'#0d1829', border:'1px solid #1a2d4a',
                    borderRadius:8, fontSize:12, color:'#e2eaf5'
                  }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', justifyContent:'center',
                gap:32, marginTop:4 }}>
                {pieData.map((p, i) => (
                  <div key={i} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:24, fontWeight:700,
                      color: i === 0 ? '#10b981' : '#ef4444' }}>
                      {p.value}
                    </div>
                    <div style={{ fontSize:10, color:'var(--muted)', marginTop:2,
                      textTransform:'uppercase', letterSpacing:'0.06em' }}>
                      {p.name}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '7px 18px', borderRadius: 8, fontSize: 12,
            fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            border: `1px solid ${activeTab === t ? 'var(--accent)' : 'var(--border)'}`,
            background: activeTab === t ? 'rgba(59,130,246,0.12)' : 'transparent',
            color: activeTab === t ? 'var(--accent2)' : 'var(--muted)',
            textTransform: 'capitalize',
          }}>{t === 'summary' ? 'Attendance Summary'
             : t === 'departments' ? 'Departments'
             : t === 'professors' ? 'Professors'
             : 'Alerts'}</button>
        ))}
      </div>

      {/* Tab: Alerts */}
      {activeTab === 'alerts' && (
        <Card style={{ borderColor: alerts.length > 0 ? 'rgba(239,68,68,0.35)' : undefined }}>
          <div style={{ display:'flex', alignItems:'center', gap:10,
            marginBottom:16, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>
            <div style={{ width:8, height:8, borderRadius:'50%',
              background:'#ef4444', boxShadow:'0 0 8px #ef4444' }} />
            <span style={{ fontSize:13, fontWeight:600, color:'#f87171' }}>
              {alerts.length} student{alerts.length !== 1 ? 's' : ''} below 75% attendance
            </span>
          </div>
          {alerts.length === 0 ? (
            <div style={{ textAlign:'center', color:'var(--muted)',
              padding:40, fontSize:13 }}>
              All students are above 75%
            </div>
          ) : (
            <Table
              headers={['Student','Dept','Course','Section','Coordinator','Att %','Status']}
              rows={alerts.map(r => [
                r.student_name,
                <Badge color="blue">{r.dept_name || r.branch}</Badge>,
                r.course_name,
                <Badge color="blue">{r.section_name}</Badge>,
                <span style={{ fontSize:12, color:'var(--muted)' }}>
                  {r.coordinator_name || '—'}
                </span>,
                <ProgressBar value={r.attendance_pct || 0} />,
                <Badge color="red">{r.eligibility}</Badge>,
              ])}
            />
          )}
        </Card>
      )}

      {/* Tab: Summary */}
      {activeTab === 'summary' && (
        <Card>
          <CardTitle>Full Attendance Summary</CardTitle>
          <Table
            headers={['Student','Dept','Course','Section',
                      'Coordinator','Total','Present','Att %','Status']}
            rows={report.map(r => [
              r.student_name,
              <Badge color="blue">{r.dept_name || r.branch}</Badge>,
              r.course_name,
              <Badge color="blue">{r.section_name}</Badge>,
              <span style={{ fontSize:12, color:'var(--muted)' }}>
                {r.coordinator_name || '—'}
              </span>,
              r.total_classes,
              r.present_count,
              <ProgressBar value={r.attendance_pct || 0} />,
              <Badge color={r.eligibility === 'ELIGIBLE' ? 'green' : 'red'}>
                {r.eligibility}
              </Badge>,
            ])}
            empty="No attendance data yet."
          />
        </Card>
      )}

      {/* Tab: Departments */}
      {activeTab === 'departments' && (
        <Card>
          <CardTitle>Departments ({departments.length})</CardTitle>
          <Table
            headers={['Dept ID','Department Name','Code',
                      'Students','Professors']}
            rows={departments.map(d => [
              d.dept_id,
              d.dept_name,
              <span style={{ fontFamily:'monospace', fontSize:12,
                color:'var(--accent2)', fontWeight:700 }}>{d.dept_code}</span>,
              report.filter(r =>
                r.dept_name === d.dept_name).length > 0
                ? [...new Set(report.filter(r =>
                    r.dept_name === d.dept_name).map(r => r.student_id))].length
                : 0,
              professors.filter(p => p.dept_name === d.dept_name).length,
            ])}
            empty="No departments found."
          />
        </Card>
      )}

      {/* Tab: Professors */}
      {activeTab === 'professors' && (
        <Card>
          <CardTitle>Professors & Coordinators ({professors.length})</CardTitle>
          <Table
            headers={['Name','Department','Designation','Is Coordinator']}
            rows={professors.map(p => [
              p.prof_name,
              <Badge color="blue">{p.dept_name}</Badge>,
              <span style={{ fontSize:12, color:'var(--muted)' }}>
                {p.designation}
              </span>,
              p.is_coordinator === 'Y'
                ? <Badge color="green">Coordinator</Badge>
                : <Badge color="amber">Professor Only</Badge>,
            ])}
            empty="No professors found."
          />
        </Card>
      )}
    </div>
  );
}