import { type FormEvent, type ReactNode, useState } from 'react';
import { MapPin, MessageCircle, Phone } from 'lucide-react';
import Button from '../components/Button';
import { InputField, PageHero, SectionIntro, TextAreaField } from '../components/primitives';
import { companySettings } from '../data/content';
import { generateId } from '../lib/utils';
import { useTailoredStore } from '../store/useTailoredStore';

export default function Contact() {
  const addEnquiry = useTailoredStore((state) => state.addEnquiry);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    clientName: '',
    phone: '',
    email: '',
    notes: '',
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    addEnquiry({
      id: generateId('enq'),
      type: 'direct',
      clientName: form.clientName,
      phone: form.phone,
      email: form.email,
      productIds: [],
      productNames: [],
      status: 'New',
      channel: 'Contact Form',
      createdAt: new Date().toISOString(),
      notes: [
        {
          id: generateId('note'),
          author: 'System',
          message: form.notes || 'General contact request submitted.',
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setSubmitted(true);
  };

  return (
    <div className="bg-tm-off-white">
      <PageHero
        eyebrow="Get in touch"
        title="Visit the studio or start the conversation online"
        body="The consultation can begin through WhatsApp, the room visualiser, or a direct message here."
        image="https://images.pexels.com/photos/32493215/pexels-photo-32493215.jpeg?auto=compress&cs=tinysrgb&w=1800"
        heightClassName="min-h-[56svh]"
      />

      <section className="tm-section">
        <div className="tm-container grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <SectionIntro
              eyebrow="Studio details"
              title="Tailored Manor Lusaka"
              body="Showroom visits are best by appointment so we can prepare material boards, dimensions, and reference pieces for the discussion."
            />
            <InfoCard icon={<MapPin className="h-5 w-5" />} label="Address" value={companySettings.address} />
            <InfoCard icon={<Phone className="h-5 w-5" />} label="Phone" value={companySettings.primaryPhone} />
            <InfoCard icon={<MessageCircle className="h-5 w-5" />} label="WhatsApp" value={`+${companySettings.whatsappNumber}`} />

            <div className="border border-black/10 bg-tm-off-white p-6">
              <p className="font-dm text-[11px] uppercase tracking-[0.2em] text-tm-warm-gray">Showroom hours</p>
              <div className="mt-4 space-y-3">
                {companySettings.showroomHours.map((item) => (
                  <div key={item.day} className="flex items-center justify-between border-b border-black/6 pb-3 font-dm text-sm text-tm-warm-gray last:border-b-0 last:pb-0">
                    <span>{item.day}</span>
                    <span>{item.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-black/10 bg-tm-off-white p-8">
            {submitted ? (
              <div className="text-center">
                <h2 className="font-cormorant text-[2.8rem] font-light leading-none tracking-[-0.04em] text-tm-obsidian">Message received</h2>
                <p className="mx-auto mt-4 max-w-xl font-dm text-[16px] leading-[1.75] text-tm-warm-gray">
                  The enquiry is already visible in the admin CRM. If you prefer a faster reply, continue the same brief on WhatsApp.
                </p>
                <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Button href={`https://wa.me/${companySettings.whatsappNumber}`} target="_blank" rel="noreferrer" variant="primary">
                    WhatsApp us now
                  </Button>
                  <Button to="/collections" variant="minimal" className="text-tm-obsidian">
                    Explore collections
                  </Button>
                </div>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <SectionIntro
                  eyebrow="Direct message"
                  title="Tell us about your space"
                  body="We use this as an initial brief before recommending a visualiser route, a direct consultation, or a specific piece."
                />
                <div className="grid gap-5 md:grid-cols-2">
                  <InputField label="Full name" required value={form.clientName} onChange={(event) => setForm((current) => ({ ...current, clientName: event.target.value }))} />
                  <InputField label="Phone" required value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                </div>
                <InputField label="Email" type="email" required value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                <TextAreaField
                  label="What do you need?"
                  rows={6}
                  placeholder="Room type, pieces you are considering, dimensions, material preferences, or anything you want the team to know."
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                />
                <Button type="submit" variant="minimal" className="bg-tm-obsidian hover:bg-tm-obsidian hover:text-tm-cream">
                  Send enquiry
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="border border-black/10 bg-tm-off-white p-5">
      <div className="flex items-center gap-3 text-tm-gold">{icon}</div>
      <p className="mt-4 font-dm text-[11px] uppercase tracking-[0.2em] text-tm-warm-gray">{label}</p>
      <p className="mt-3 font-dm text-[16px] leading-[1.75] text-tm-obsidian">{value}</p>
    </div>
  );
}
