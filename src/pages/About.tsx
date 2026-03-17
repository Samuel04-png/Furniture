import { PageHero, SectionIntro } from '../components/primitives';
import { useTailoredStore } from '../store/useTailoredStore';

export default function About() {
  const team = useTailoredStore((state) => state.teamMembers);

  return (
    <div className="bg-tm-off-white">
      <PageHero
        eyebrow="Brand story"
        title="An interior experience studio, not a furniture shop"
        body="Tailored Manor is built around a simple idea: a room should not be furnished generically when it can be composed intentionally."
        image="https://images.pexels.com/photos/8447892/pexels-photo-8447892.jpeg?auto=compress&cs=tinysrgb&w=1800"
        heightClassName="min-h-[58svh]"
      />
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Who we are"
            title="African warmth with European restraint"
            body="The studio celebrates Zambian materials, calm detailing, and digital tools that help clients feel certain before commissioning a custom piece."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {team.map((member) => (
              <div key={member.id} className="rounded-[2rem] border border-black/8 bg-white p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f6f1e7] font-cormorant text-2xl text-tm-gold">
                  {member.initials}
                </div>
                <h3 className="mt-5 font-cormorant text-[2rem] leading-none tracking-[-0.03em] text-tm-obsidian">{member.name}</h3>
                <p className="mt-2 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-gold">{member.role}</p>
                <p className="mt-4 font-dm text-sm leading-7 text-tm-warm-gray">{member.email}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
