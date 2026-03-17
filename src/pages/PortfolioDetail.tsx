import { Navigate, useParams } from 'react-router-dom';
import { PageHero, SectionIntro } from '../components/primitives';
import { useTailoredStore } from '../store/useTailoredStore';

export default function PortfolioDetail() {
  const { slug } = useParams();
  const project = useTailoredStore((state) => state.portfolioProjects.find((item) => item.slug === slug));

  if (!project) {
    return <Navigate to="/portfolio" replace />;
  }

  return (
    <div className="bg-tm-off-white">
      <PageHero eyebrow={project.location} title={project.title} body={project.summary} image={project.heroImage} heightClassName="min-h-[60svh]" />
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <SectionIntro eyebrow="Challenge" title={project.challenge} body={project.solution} />
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {project.gallery.map((image) => (
                <img key={image} src={image} alt={project.title} className="h-72 w-full rounded-[1.6rem] object-cover" />
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_20px_60px_rgba(12,12,12,0.07)]">
            <p className="font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Project metrics</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.metrics.map((metric) => (
                <span key={metric} className="rounded-full border border-black/8 px-4 py-2 font-dm text-[0.68rem] uppercase tracking-[0.18em] text-tm-obsidian">
                  {metric}
                </span>
              ))}
            </div>
            <p className="mt-8 font-cormorant text-[2rem] italic leading-[1.28] text-tm-warm-gray">"{project.testimonial}"</p>
            <div className="mt-8">
              <p className="font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Materials</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.materials.map((material) => (
                  <span key={material} className="rounded-full border border-black/8 px-4 py-2 font-dm text-[0.68rem] uppercase tracking-[0.18em] text-tm-gold">
                    {material}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
