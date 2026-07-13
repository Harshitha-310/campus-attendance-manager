import { useEffect, useState } from 'react';
import { slotsAPI } from '../api';
import { PageHeader, Card, CardTitle, Grid, Input, Btn, Table, useToast, Toast } from '../components/UI';

export default function Slots() {
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ slot_id:'', slot_number:'', start_time:'', end_time:'' });
  const [toast, showToast] = useToast();

  const load = () => slotsAPI.getAll().then(r => setSlots(r.data.data || []));
  useEffect(() => { load(); }, []);
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const submit = async () => {
    if (!form.slot_id || !form.slot_number || !form.start_time || !form.end_time)
      return showToast('Fill all fields', 'error');
    const res = await slotsAPI.create(form);
    if (res.data.success) { showToast('Slot created!'); setForm({ slot_id:'', slot_number:'', start_time:'', end_time:'' }); load(); }
    else showToast(res.data.error, 'error');
  };

  return (
    <div>
      <PageHeader title="Slots" subtitle="Define class time slots" />
      <Card>
        <CardTitle>Create New Slot</CardTitle>
        <Grid cols={2}>
          <Input label="Slot ID *" type="number" value={form.slot_id}
            onChange={e => set('slot_id', e.target.value)} placeholder="e.g. 7" />
          <Input label="Slot Number *" type="number" value={form.slot_number}
            onChange={e => set('slot_number', e.target.value)} placeholder="e.g. 7" />
          <Input label="Start Time *" value={form.start_time}
            onChange={e => set('start_time', e.target.value)} placeholder="e.g. 16:00" />
          <Input label="End Time *" value={form.end_time}
            onChange={e => set('end_time', e.target.value)} placeholder="e.g. 16:50" />
        </Grid>
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          <Btn onClick={submit}>Create Slot</Btn>
          <Btn variant="ghost" onClick={load}>Refresh</Btn>
        </div>
      </Card>
      <Card>
        <CardTitle>All Slots ({slots.length})</CardTitle>
        <Table headers={['ID','Slot No.','Start','End']}
          rows={slots.map(s => [s.slot_id, s.slot_number, s.start_time, s.end_time])} />
      </Card>
      <Toast {...toast} />
    </div>
  );
}