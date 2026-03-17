import Button from '../components/Button';
import { PageHero } from '../components/primitives';

export default function NotFound() {
  return (
    <div className="bg-tm-off-white">
      <PageHero
        eyebrow="Not found"
        title="This room does not exist yet"
        body="The route you requested is not part of the Tailored Manor experience. Use the links below to return to the live platform."
        image="https://images.pexels.com/photos/13570885/pexels-photo-13570885.jpeg?auto=compress&cs=tinysrgb&w=1800"
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
