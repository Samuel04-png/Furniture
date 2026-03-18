import Button from '../components/Button';
import { PageHero } from '../components/primitives';
import { asset } from '../data/content';


export default function NotFound() {
  return (
    <div className="bg-tm-off-white">
      <PageHero
        eyebrow="Not found"
        title="This room does not exist yet"
        body="The route you requested is not part of the Tailored Manor experience. Use the links below to return to the live platform."
        image={asset('full bedroom setup/Tailored to reflect your style and provide the comfort you deserve. Transforming a house (4).jpg')}
        heightClassName="min-h-[60svh]"

      >
        <div className="flex flex-wrap gap-4">
          <Button to="/" variant="primary">
            Back home
          </Button>
          <Button to="/collections" variant="secondary">
            Browse collection
          </Button>
        </div>
      </PageHero>
    </div>
  );
}
