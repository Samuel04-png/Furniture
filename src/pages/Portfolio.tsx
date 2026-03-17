import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageHero, SectionIntro } from '../components/primitives';
import { useTailoredStore } from '../store/useTailoredStore';

export default function Portfolio() {
  const projects = useTailoredStore((state) => state.portfolioProjects);

  return (
    <div className="bg-tm-off-white">
      <PageHero
        eyebrow="Installed work"
        title="Rooms completed with Tailored Manor"
        body="Case studies with real room conditions, real constraints, and tailored furniture solutions."
        image={projects[0]?.heroImage}
        heightClassName="min-h-[58svh]"
      />
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Case studies"
            title="Every project is its own narrative"
            body="The portfolio carries through the editorial tone of the homepage while proving the product in lived spaces."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {projects.map((project, index) => (
              <Link key={project.id} to={`/portfolio/${project.slug}`} className={`overflow-hidden rounded-[2rem] border border-black/8 bg-white shadow-[0_24px_70px_rgba(12,12,12,0.07)] ${index === 0 ? 'md:col-span-2' : ''}`}>
                <div className={`${index === 0 ? 'grid md:grid-cols-[1.2fr_0.8fr]' : ''}`}>
                  <img src={project.heroImage} alt={project.title} className={`w-full object-cover ${index === 0 ? 'h-full min-h-[26rem]' : 'h-80'}`} />
                  <div className="p-8">
                    <p className="font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-gold">{project.category}</p>
                    <h2 className="mt-4 font-cormorant text-[clamp(2rem,4vw,3.5rem)] leading-[0.96] tracking-[-0.04em] text-tm-obsidian">{project.title}</h2>
                    <p className="mt-4 font-dm text-sm leading-7 text-tm-warm-gray">{project.summary}</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {project.metrics.map((metric) => (
                        <span key={metric} className="rounded-full border border-black/8 px-4 py-2 font-dm text-[0.68rem] uppercase tracking-[0.18em] text-tm-warm-gray">
                          {metric}
                        </span>
                      ))}
                    </div>
                    <span className="mt-8 inline-flex items-center gap-2 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-obsidian">
                      View case study
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
