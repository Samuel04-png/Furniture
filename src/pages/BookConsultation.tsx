import { FormEvent, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import Button from '../components/Button';
import { InputField, PageHero, SectionIntro, SelectField, TextAreaField } from '../components/primitives';
import { createWhatsAppLink } from '../lib/utils';
import { useTailoredStore } from '../store/useTailoredStore';

export default function BookConsultation() {
  const createConsultationRequest = useTailoredStore((state) => state.createConsultationRequest);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    clientName: '',
    phone: '',
    email: '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    createConsultationRequest({
      clientName: form.clientName,
      phone: form.phone,
      email: form.email,
      preferredDateTime: `${form.preferredDate}T${form.preferredTime || '10:00'}:00.000Z`,
      notes: form.notes,
      source: 'consultation',
    });
    setSubmitted(true);
  };

  const whatsappLink = createWhatsAppLink(
    `Hello Tailored Manor, I'd like to book a consultation.\nName: ${form.clientName}\nPhone: ${form.phone}\nPreferred date: ${form.preferredDate}\nPreferred time: ${form.preferredTime}\nNotes: ${form.notes || 'N/A'}`,
  );

  return (
    <div className="bg-tm-off-white">
      <PageHero
        eyebrow="Consultation booking"
        title="Book a tailored design consultation"
        body="Bring your room dimensions, inspiration, or just the challenge. The team will guide you toward the right piece and finish direction."
        image="https://images.pexels.com/photos/5974351/pexels-photo-5974351.jpeg?auto=compress&cs=tinysrgb&w=1800"
        heightClassName="min-h-[56svh]"
      />

      <section className="tm-section">
        <div className="tm-container max-w-4xl">
          <div className="border border-black/10 bg-tm-off-white p-8 md:p-10">
            {submitted ? (
              <div className="text-center">
                <h1 className="font-cormorant text-[clamp(2.8rem,6vw,4.2rem)] font-light leading-[0.96] tracking-[-0.04em] text-tm-obsidian">
                  We have received your request.
                </h1>
                <p className="mx-auto mt-5 max-w-2xl font-dm text-[16px] leading-[1.75] text-tm-warm-gray">
                  Your booking is already visible in the admin consultation calendar. A member of the team will reach out within 24 hours to confirm timing and next steps.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Button href={whatsappLink} target="_blank" rel="noreferrer" variant="primary" icon={<MessageCircle className="h-4 w-4" />}>
                    Continue on WhatsApp
                  </Button>
                  <Button to="/visualise" variant="minimal" className="text-tm-obsidian">
                    Try the visualiser
                  </Button>
                </div>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <SectionIntro
                  eyebrow="Tell us the essentials"
                  title="We learn your space, your taste, and your life"
                  body="This feeds directly into the consultation calendar and CRM so the team has context before they call."
                />
                <div className="grid gap-5 md:grid-cols-2">
                  <InputField label="Full name" required value={form.clientName} onChange={(event) => setForm((current) => ({ ...current, clientName: event.target.value }))} />
                  <InputField label="Phone (WhatsApp preferred)" required value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                </div>
                <InputField label="Email" type="email" required value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                <div className="grid gap-5 md:grid-cols-2">
                  <InputField label="Preferred date" type="date" required value={form.preferredDate} onChange={(event) => setForm((current) => ({ ...current, preferredDate: event.target.value }))} />
                  <SelectField label="Preferred time" required value={form.preferredTime} onChange={(event) => setForm((current) => ({ ...current, preferredTime: event.target.value }))}>
                    <option value="">Select a time</option>
                    <option value="09:00">09:00</option>
                    <option value="11:00">11:00</option>
                    <option value="14:00">14:00</option>
                    <option value="16:00">16:00</option>
                  </SelectField>
                </div>
                <TextAreaField
                  label="Tell us about your room"
                  rows={6}
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Room type, desired pieces, style direction, or any dimensions you already know."
                />
                <Button type="submit" variant="minimal" className="bg-tm-obsidian hover:bg-tm-obsidian hover:text-tm-cream">
                  Request consultation
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
