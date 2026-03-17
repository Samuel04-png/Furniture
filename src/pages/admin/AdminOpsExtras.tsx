import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { InputField, MetricCard, SelectField, SectionIntro, TextAreaField } from '../../components/primitives';
import { formatCurrency, formatDateTime, generateId } from '../../lib/utils';
import { useTailoredStore } from '../../store/useTailoredStore';

export function InventoryPage() {
  const inventoryItems = useTailoredStore((state) => state.inventoryItems);
  const updateInventoryItem = useTailoredStore((state) => state.updateInventoryItem);

  return (
    <div className="space-y-8">
      <SectionIntro eyebrow="Inventory control" title="Material and component readiness" body="This extends the PDF with stock and reorder management so production can be planned more reliably." />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Tracked items" value={String(inventoryItems.length)} meta="Hardwood, fabric, hardware, finishing" />
        <MetricCard label="Below reorder point" value={String(inventoryItems.filter((item) => item.onHand <= item.reorderPoint).length)} meta="Needs purchasing attention" />
        <MetricCard label="Reserved stock" value={String(inventoryItems.reduce((sum, item) => sum + item.reserved, 0))} meta="Committed to current production" />
      </div>
      <div className="overflow-hidden rounded-[2rem] border border-black/8 bg-white shadow-[0_20px_60px_rgba(12,12,12,0.06)]">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full border-collapse">
          <thead className="bg-[#f6f1e7] font-dm text-[0.68rem] uppercase tracking-[0.22em] text-tm-warm-gray">
            <tr>
              <th className="px-4 py-4 text-left">Item</th>
              <th className="px-4 py-4 text-left">On hand</th>
              <th className="px-4 py-4 text-left">Reserved</th>
              <th className="px-4 py-4 text-left">Reorder point</th>
              <th className="px-4 py-4 text-left">Supplier</th>
              <th className="px-4 py-4 text-left">Adjust</th>
            </tr>
          </thead>
          <tbody>
            {inventoryItems.map((item) => (
              <tr key={item.id} className="border-t border-black/6 font-dm text-sm text-tm-warm-gray">
                <td className="px-4 py-4">
                  <p className="font-medium text-tm-obsidian">{item.name}</p>
                  <p className="text-xs uppercase tracking-[0.18em]">{item.category}</p>
                </td>
                <td className="px-4 py-4">{item.onHand} {item.unit}</td>
                <td className="px-4 py-4">{item.reserved}</td>
                <td className="px-4 py-4">{item.reorderPoint}</td>
                <td className="px-4 py-4">{item.supplier}</td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => updateInventoryItem(item.id, { onHand: Math.max(0, item.onHand - 1) })} className="rounded-full border border-black/10 px-3 py-1">-</button>
                    <button type="button" onClick={() => updateInventoryItem(item.id, { onHand: item.onHand + 1 })} className="rounded-full border border-black/10 px-3 py-1">+</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AccountingPage() {
  const records = useTailoredStore((state) => state.accountingRecords);
  const addAccountingRecord = useTailoredStore((state) => state.addAccountingRecord);
  const [form, setForm] = useState({ type: 'Invoice', title: '', clientName: '', amount: '', dueDate: '' });

  const income = records.filter((item) => item.type !== 'Expense' && item.status === 'Paid').reduce((sum, item) => sum + item.amount, 0);
  const outstanding = records.filter((item) => item.status === 'Issued' || item.status === 'Overdue').reduce((sum, item) => sum + item.amount, 0);
  const expenses = records.filter((item) => item.type === 'Expense').reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-8">
      <SectionIntro eyebrow="Accounting" title="Receivables, deposits, and operating spend" body="This is another expanded module beyond the original prototype so admin users can track financial signals alongside leads and production." />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Received" value={formatCurrency(income)} meta="Paid deposits and invoices" />
        <MetricCard label="Outstanding" value={formatCurrency(outstanding)} meta="Issued or overdue receivables" />
        <MetricCard label="Expenses" value={formatCurrency(expenses)} meta="Tracked operational outflow" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[2rem] border border-black/8 bg-white shadow-[0_20px_60px_rgba(12,12,12,0.06)]">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse">
            <thead className="bg-[#f6f1e7] font-dm text-[0.68rem] uppercase tracking-[0.22em] text-tm-warm-gray">
              <tr>
                <th className="px-4 py-4 text-left">Title</th>
                <th className="px-4 py-4 text-left">Type</th>
                <th className="px-4 py-4 text-left">Amount</th>
                <th className="px-4 py-4 text-left">Status</th>
                <th className="px-4 py-4 text-left">Due</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-t border-black/6 font-dm text-sm text-tm-warm-gray">
                  <td className="px-4 py-4">
                    <p className="font-medium text-tm-obsidian">{record.title}</p>
                    {record.clientName ? <p className="text-xs uppercase tracking-[0.18em]">{record.clientName}</p> : null}
                  </td>
                  <td className="px-4 py-4">{record.type}</td>
                  <td className="px-4 py-4">{formatCurrency(record.amount)}</td>
                  <td className="px-4 py-4">{record.status}</td>
                  <td className="px-4 py-4">{record.dueDate}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
        <form
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            addAccountingRecord({
              id: generateId('acc'),
              type: form.type as never,
              title: form.title,
              clientName: form.clientName || undefined,
              amount: Number(form.amount),
              status: 'Draft',
              dueDate: form.dueDate,
              issuedDate: new Date().toISOString().slice(0, 10),
            });
            setForm({ type: 'Invoice', title: '', clientName: '', amount: '', dueDate: '' });
          }}
          className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_20px_60px_rgba(12,12,12,0.06)]"
        >
          <SectionIntro eyebrow="New record" title="Add a financial entry" />
          <div className="mt-6 space-y-5">
            <SelectField label="Type" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
              <option>Invoice</option>
              <option>Deposit</option>
              <option>Expense</option>
              <option>Purchase Order</option>
            </SelectField>
            <InputField label="Title" required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            <InputField label="Client (optional)" value={form.clientName} onChange={(event) => setForm((current) => ({ ...current, clientName: event.target.value }))} />
            <div className="grid gap-5 md:grid-cols-2">
              <InputField label="Amount" required type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
              <InputField label="Due date" required type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
            </div>
            <button type="submit" className="rounded-full bg-tm-obsidian px-5 py-3 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-cream">
              Add record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const settings = useTailoredStore((state) => state.companySettings);
  const team = useTailoredStore((state) => state.teamMembers);
  const materials = useTailoredStore((state) => state.materials);
  const updateCompanySettings = useTailoredStore((state) => state.updateCompanySettings);
  const updateMaterial = useTailoredStore((state) => state.updateMaterial);
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-8">
      <SectionIntro eyebrow="System settings" title="Company, templates, materials, and team" body="Settings drive what appears on the public site as well as the automated messages the studio sends." />
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_20px_60px_rgba(12,12,12,0.06)]">
          <SectionIntro eyebrow="Company profile" title="Public-facing business details" />
          <div className="mt-6 space-y-5">
            <InputField label="Company name" value={settings.companyName} onChange={(event) => updateCompanySettings({ companyName: event.target.value })} />
            <InputField label="Primary phone" value={settings.primaryPhone} onChange={(event) => updateCompanySettings({ primaryPhone: event.target.value })} />
            <InputField label="Email" value={settings.email} onChange={(event) => updateCompanySettings({ email: event.target.value })} />
            <TextAreaField label="Address" rows={3} value={settings.address} onChange={(event) => updateCompanySettings({ address: event.target.value })} />
          </div>
        </div>
        <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_20px_60px_rgba(12,12,12,0.06)]">
          <SectionIntro eyebrow="Automation templates" title="Notification copy" />
          <div className="mt-6 space-y-5">
            {settings.notificationTemplates.map((template) => (
              <TextAreaField
                key={template.id}
                label={template.label}
                rows={4}
                value={template.body}
                onChange={(event) =>
                  updateCompanySettings({
                    notificationTemplates: settings.notificationTemplates.map((item) =>
                      item.id === template.id ? { ...item, body: event.target.value } : item,
                    ),
                  })
                }
              />
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_20px_60px_rgba(12,12,12,0.06)]">
          <SectionIntro eyebrow="Team" title="Roles and access context" />
          <div className="mt-6 space-y-4">
            {team.map((member) => (
              <div key={member.id} className="rounded-[1.4rem] border border-black/8 p-4">
                <p className="font-cormorant text-2xl tracking-[-0.03em] text-tm-obsidian">{member.name}</p>
                <p className="mt-2 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-gold">{member.role}</p>
                <p className="mt-2 font-dm text-sm text-tm-warm-gray">{member.email}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_20px_60px_rgba(12,12,12,0.06)]">
          <SectionIntro eyebrow="Materials" title="Edit the public material library" />
          <div className="mt-6 space-y-5">
            {materials.map((material) => (
              <div key={material.id} className="rounded-[1.4rem] border border-black/8 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full" style={{ backgroundColor: material.tone }} />
                  <p className="font-cormorant text-2xl tracking-[-0.03em] text-tm-obsidian">{material.name}</p>
                </div>
                <TextAreaField
                  label="Description"
                  rows={3}
                  value={material.description}
                  onChange={(event) => updateMaterial(material.id, { description: event.target.value })}
                  className="mt-4"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_20px_60px_rgba(12,12,12,0.06)]">
        <SectionIntro eyebrow="Audit note" title="Ops notes" />
        <TextAreaField label="Internal note" rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-4" />
        <p className="mt-4 font-dm text-sm text-tm-warm-gray">Last reviewed {formatDateTime(new Date().toISOString())}</p>
        <Link to="/contact" className="mt-5 inline-block rounded-full border border-tm-gold px-5 py-3 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-gold">
          Check public contact page
        </Link>
      </div>
    </div>
  );
}
