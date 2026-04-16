import { useState } from 'react';
import { AdminButton, AdminEmptyState, AdminModal, AdminStatusChip, AdminSurface, AdminSurfaceHeader } from '../../../components/admin/AdminUi';
import { uploadWebsiteMedia } from '../../../lib/backend/services/storage';
import { generateId, slugify } from '../../../lib/utils';
import { useTailoredStore } from '../../../store/useTailoredStore';
import type { PortfolioProject, SampleRoom, Testimonial } from '../../../types';
import { Field, SelectInput, TextArea, TextInput } from './shared';

const defaultRoomForm = () => ({ name: '', image: '', spaceType: 'Living' as SampleRoom['spaceType'], visibleOnSite: 'true', sortOrder: '100' });
const defaultTestimonialForm = () => ({ quote: '', clientName: '', location: '', image: '', visibleOnSite: 'true', sortOrder: '100' });
const defaultProjectForm = () => ({ title: '', slug: '', location: '', category: '', heroImage: '', gallery: '', summary: '', challenge: '', solution: '', materials: '', metrics: '', testimonial: '', visibleOnSite: 'true', sortOrder: '100' });

function parseList(value: string) {
  return value.split('\n').flatMap((line) => line.split(',')).map((entry) => entry.trim()).filter(Boolean);
}

function joinList(values: string[]) {
  return values.join('\n');
}

function uniqueId(base: string, existing: string[]) {
  const slug = slugify(base) || 'record';
  let candidate = slug;
  let suffix = 2;
  while (existing.includes(candidate)) {
    candidate = `${slug}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function WebsiteContentPanel() {
  const rooms = useTailoredStore((state) => state.adminSampleRooms);
  const testimonials = useTailoredStore((state) => state.adminTestimonials);
  const projects = useTailoredStore((state) => state.adminPortfolioProjects);
  const addRoom = useTailoredStore((state) => state.addSampleRoom);
  const updateRoom = useTailoredStore((state) => state.updateSampleRoom);
  const deleteRoom = useTailoredStore((state) => state.deleteSampleRoom);
  const addTestimonial = useTailoredStore((state) => state.addTestimonial);
  const updateTestimonial = useTailoredStore((state) => state.updateTestimonial);
  const deleteTestimonial = useTailoredStore((state) => state.deleteTestimonial);
  const addProject = useTailoredStore((state) => state.addPortfolioProject);
  const updateProject = useTailoredStore((state) => state.updatePortfolioProject);
  const deleteProject = useTailoredStore((state) => state.deletePortfolioProject);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [roomForm, setRoomForm] = useState(defaultRoomForm());
  const [testimonialForm, setTestimonialForm] = useState(defaultTestimonialForm());
  const [projectForm, setProjectForm] = useState(defaultProjectForm());
  const [roomFile, setRoomFile] = useState<File | null>(null);
  const [testimonialFile, setTestimonialFile] = useState<File | null>(null);
  const [projectHeroFile, setProjectHeroFile] = useState<File | null>(null);

  const openCreateRoomModal = () => { setEditingRoomId(null); setRoomForm(defaultRoomForm()); setRoomFile(null); setRoomModalOpen(true); };
  const openEditRoomModal = (room: SampleRoom) => { setEditingRoomId(room.id); setRoomForm({ name: room.name, image: room.image, spaceType: room.spaceType, visibleOnSite: room.visibleOnSite === false ? 'false' : 'true', sortOrder: String(room.sortOrder ?? 100) }); setRoomFile(null); setRoomModalOpen(true); };
  const openCreateTestimonialModal = () => { setEditingTestimonialId(null); setTestimonialForm(defaultTestimonialForm()); setTestimonialFile(null); setTestimonialModalOpen(true); };
  const openEditTestimonialModal = (item: Testimonial) => { setEditingTestimonialId(item.id); setTestimonialForm({ quote: item.quote, clientName: item.clientName, location: item.location, image: item.image, visibleOnSite: item.visibleOnSite === false ? 'false' : 'true', sortOrder: String(item.sortOrder ?? 100) }); setTestimonialFile(null); setTestimonialModalOpen(true); };
  const openCreateProjectModal = () => { setEditingProjectId(null); setProjectForm(defaultProjectForm()); setProjectHeroFile(null); setProjectModalOpen(true); };
  const openEditProjectModal = (project: PortfolioProject) => { setEditingProjectId(project.id); setProjectForm({ title: project.title, slug: project.slug, location: project.location, category: project.category, heroImage: project.heroImage, gallery: joinList(project.gallery), summary: project.summary, challenge: project.challenge, solution: project.solution, materials: joinList(project.materials), metrics: joinList(project.metrics), testimonial: project.testimonial, visibleOnSite: project.visibleOnSite === false ? 'false' : 'true', sortOrder: String(project.sortOrder ?? 100) }); setProjectHeroFile(null); setProjectModalOpen(true); };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <AdminSurface>
          <AdminSurfaceHeader title="Sample rooms" description="These feed the visualiser's starter room gallery." action={<AdminButton onClick={openCreateRoomModal}>Add sample room</AdminButton>} />
          <div className="space-y-3">
            {rooms.length ? rooms.map((room) => (
              <div key={room.id} className="rounded-[1.25rem] border border-black/7 bg-[#fbf7f1] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-sm font-semibold text-tm-charcoal">{room.name}</p><p className="mt-1 text-sm text-tm-warm-gray">{room.spaceType}</p></div>
                  <AdminStatusChip label={room.visibleOnSite === false ? 'Hidden' : 'Visible'} tone={room.visibleOnSite === false ? 'neutral' : 'success'} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2"><AdminButton tone="ghost" onClick={() => openEditRoomModal(room)}>Edit room</AdminButton><AdminButton tone="danger" onClick={() => { if (!window.confirm(`Delete ${room.name}?`)) return; void deleteRoom(room.id); }}>Delete room</AdminButton></div>
              </div>
            )) : <AdminEmptyState title="No sample rooms yet" body="Add starter spaces so the visualiser has realistic rooms ready to use." action={<AdminButton onClick={openCreateRoomModal}>Add sample room</AdminButton>} />}
          </div>
        </AdminSurface>

        <AdminSurface>
          <AdminSurfaceHeader title="Testimonials" description="These feed the rotating trust section on the public website." action={<AdminButton onClick={openCreateTestimonialModal}>Add testimonial</AdminButton>} />
          <div className="space-y-3">
            {testimonials.length ? testimonials.map((item) => (
              <div key={item.id} className="rounded-[1.25rem] border border-black/7 bg-[#fbf7f1] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-sm font-semibold text-tm-charcoal">{item.clientName}</p><p className="mt-1 text-sm text-tm-warm-gray">{item.location}</p></div>
                  <AdminStatusChip label={item.visibleOnSite === false ? 'Hidden' : 'Visible'} tone={item.visibleOnSite === false ? 'neutral' : 'success'} />
                </div>
                <p className="mt-3 text-sm leading-6 text-tm-warm-gray">"{item.quote}"</p>
                <div className="mt-4 flex flex-wrap gap-2"><AdminButton tone="ghost" onClick={() => openEditTestimonialModal(item)}>Edit testimonial</AdminButton><AdminButton tone="danger" onClick={() => { if (!window.confirm(`Delete testimonial from ${item.clientName}?`)) return; void deleteTestimonial(item.id); }}>Delete testimonial</AdminButton></div>
              </div>
            )) : <AdminEmptyState title="No testimonials yet" body="Add real client feedback so the homepage trust section stays current." action={<AdminButton onClick={openCreateTestimonialModal}>Add testimonial</AdminButton>} />}
          </div>
        </AdminSurface>
      </div>

      <AdminSurface>
        <AdminSurfaceHeader title="Portfolio projects" description="These power the portfolio listing and individual case-study pages." action={<AdminButton onClick={openCreateProjectModal}>Add portfolio project</AdminButton>} />
        <div className="space-y-3">
          {projects.length ? projects.map((project) => (
            <div key={project.id} className="rounded-[1.25rem] border border-black/7 bg-[#fbf7f1] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div><p className="text-sm font-semibold text-tm-charcoal">{project.title}</p><p className="mt-1 text-sm text-tm-warm-gray">{project.location} • {project.category}</p></div>
                <div className="flex flex-wrap items-center gap-2"><AdminStatusChip label={project.visibleOnSite === false ? 'Hidden' : 'Visible'} tone={project.visibleOnSite === false ? 'neutral' : 'success'} /><span className="text-[0.68rem] uppercase tracking-[0.18em] text-tm-warm-gray">{project.slug}</span></div>
              </div>
              <p className="mt-3 text-sm leading-6 text-tm-warm-gray">{project.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2"><AdminButton tone="ghost" onClick={() => openEditProjectModal(project)}>Edit project</AdminButton><AdminButton tone="danger" onClick={() => { if (!window.confirm(`Delete ${project.title}?`)) return; void deleteProject(project.id); }}>Delete project</AdminButton></div>
            </div>
          )) : <AdminEmptyState title="No portfolio projects yet" body="Add completed rooms here so the public portfolio is managed from the admin, not code." action={<AdminButton onClick={openCreateProjectModal}>Add portfolio project</AdminButton>} />}
        </div>
      </AdminSurface>

      <AdminModal open={roomModalOpen} title={editingRoomId ? 'Edit sample room' : 'Add sample room'} description="Sample rooms are used as quick-start spaces in the visualiser." onClose={() => { setRoomModalOpen(false); setEditingRoomId(null); setRoomFile(null); }}>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); const roomId = editingRoomId ?? uniqueId(roomForm.name, rooms.map((room) => room.id)); const upload = roomFile ? await uploadWebsiteMedia('sample-rooms', roomId, 'room', roomFile) : null; const payload = { name: roomForm.name, image: upload?.url || roomForm.image, imagePath: upload?.path ?? undefined, spaceType: roomForm.spaceType, visibleOnSite: roomForm.visibleOnSite === 'true', sortOrder: Number(roomForm.sortOrder || 100) }; if (editingRoomId) { await updateRoom(editingRoomId, payload); } else { await addRoom({ id: roomId, ...payload }); } setRoomModalOpen(false); setEditingRoomId(null); setRoomFile(null); }}>
          <Field label="Room name"><TextInput value={roomForm.name} onChange={(event) => setRoomForm((current) => ({ ...current, name: event.target.value }))} required /></Field>
          <Field label="Space type"><SelectInput value={roomForm.spaceType} onChange={(event) => setRoomForm((current) => ({ ...current, spaceType: event.target.value as SampleRoom['spaceType'] }))}>{['Living', 'Dining', 'Bedroom', 'Office', 'Outdoor'].map((item) => <option key={item} value={item}>{item}</option>)}</SelectInput></Field>
          <Field label="Image URL"><TextInput value={roomForm.image} onChange={(event) => setRoomForm((current) => ({ ...current, image: event.target.value }))} required={!roomFile} /></Field>
          <Field label="Image file"><TextInput type="file" accept="image/*" onChange={(event) => setRoomFile(event.target.files?.[0] ?? null)} /></Field>
          <Field label="Website status"><SelectInput value={roomForm.visibleOnSite} onChange={(event) => setRoomForm((current) => ({ ...current, visibleOnSite: event.target.value }))}><option value="true">Visible on website</option><option value="false">Hidden from website</option></SelectInput></Field>
          <Field label="Sort order"><TextInput type="number" min={0} value={roomForm.sortOrder} onChange={(event) => setRoomForm((current) => ({ ...current, sortOrder: event.target.value }))} /></Field>
          <div className="sm:col-span-2 flex justify-end gap-3"><AdminButton type="button" tone="ghost" onClick={() => { setRoomModalOpen(false); setEditingRoomId(null); setRoomFile(null); }}>Cancel</AdminButton><AdminButton type="submit">{editingRoomId ? 'Save changes' : 'Create room'}</AdminButton></div>
        </form>
      </AdminModal>

      <AdminModal open={testimonialModalOpen} title={editingTestimonialId ? 'Edit testimonial' : 'Add testimonial'} description="Testimonials appear on the public homepage trust section." onClose={() => { setTestimonialModalOpen(false); setEditingTestimonialId(null); setTestimonialFile(null); }}>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); const testimonialId = editingTestimonialId ?? uniqueId(testimonialForm.clientName || 'testimonial', testimonials.map((item) => item.id)); const upload = testimonialFile ? await uploadWebsiteMedia('testimonials', testimonialId, 'portrait', testimonialFile) : null; const payload = { quote: testimonialForm.quote, clientName: testimonialForm.clientName, location: testimonialForm.location, image: upload?.url || testimonialForm.image, imagePath: upload?.path ?? undefined, visibleOnSite: testimonialForm.visibleOnSite === 'true', sortOrder: Number(testimonialForm.sortOrder || 100) }; if (editingTestimonialId) { await updateTestimonial(editingTestimonialId, payload); } else { await addTestimonial({ id: testimonialId, ...payload }); } setTestimonialModalOpen(false); setEditingTestimonialId(null); setTestimonialFile(null); }}>
          <Field label="Client name"><TextInput value={testimonialForm.clientName} onChange={(event) => setTestimonialForm((current) => ({ ...current, clientName: event.target.value }))} required /></Field>
          <Field label="Location"><TextInput value={testimonialForm.location} onChange={(event) => setTestimonialForm((current) => ({ ...current, location: event.target.value }))} required /></Field>
          <Field label="Image URL"><TextInput value={testimonialForm.image} onChange={(event) => setTestimonialForm((current) => ({ ...current, image: event.target.value }))} required={!testimonialFile} /></Field>
          <Field label="Image file"><TextInput type="file" accept="image/*" onChange={(event) => setTestimonialFile(event.target.files?.[0] ?? null)} /></Field>
          <Field label="Website status"><SelectInput value={testimonialForm.visibleOnSite} onChange={(event) => setTestimonialForm((current) => ({ ...current, visibleOnSite: event.target.value }))}><option value="true">Visible on website</option><option value="false">Hidden from website</option></SelectInput></Field>
          <Field label="Sort order"><TextInput type="number" min={0} value={testimonialForm.sortOrder} onChange={(event) => setTestimonialForm((current) => ({ ...current, sortOrder: event.target.value }))} /></Field>
          <Field label="Quote"><TextArea value={testimonialForm.quote} onChange={(event) => setTestimonialForm((current) => ({ ...current, quote: event.target.value }))} className="min-h-[140px] sm:col-span-2" required /></Field>
          <div className="sm:col-span-2 flex justify-end gap-3"><AdminButton type="button" tone="ghost" onClick={() => { setTestimonialModalOpen(false); setEditingTestimonialId(null); setTestimonialFile(null); }}>Cancel</AdminButton><AdminButton type="submit">{editingTestimonialId ? 'Save changes' : 'Create testimonial'}</AdminButton></div>
        </form>
      </AdminModal>

      <AdminModal open={projectModalOpen} title={editingProjectId ? 'Edit portfolio project' : 'Add portfolio project'} description="Portfolio projects drive the public case-study pages." onClose={() => { setProjectModalOpen(false); setEditingProjectId(null); setProjectHeroFile(null); }} width="max-w-4xl">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); const projectId = editingProjectId ?? uniqueId(projectForm.slug || projectForm.title, projects.map((project) => project.id)); const upload = projectHeroFile ? await uploadWebsiteMedia('portfolio', projectId, 'hero', projectHeroFile) : null; const payload = { slug: slugify(projectForm.slug || projectForm.title), title: projectForm.title, location: projectForm.location, category: projectForm.category, heroImage: upload?.url || projectForm.heroImage, heroImagePath: upload?.path ?? undefined, gallery: parseList(projectForm.gallery), summary: projectForm.summary, challenge: projectForm.challenge, solution: projectForm.solution, materials: parseList(projectForm.materials), metrics: parseList(projectForm.metrics), testimonial: projectForm.testimonial, visibleOnSite: projectForm.visibleOnSite === 'true', sortOrder: Number(projectForm.sortOrder || 100) }; if (editingProjectId) { await updateProject(editingProjectId, payload); } else { await addProject({ id: projectId, ...payload }); } setProjectModalOpen(false); setEditingProjectId(null); setProjectHeroFile(null); }}>
          <Field label="Project title"><TextInput value={projectForm.title} onChange={(event) => setProjectForm((current) => ({ ...current, title: event.target.value, slug: current.slug || slugify(event.target.value) }))} required /></Field>
          <Field label="Slug"><TextInput value={projectForm.slug} onChange={(event) => setProjectForm((current) => ({ ...current, slug: slugify(event.target.value) }))} required /></Field>
          <Field label="Location"><TextInput value={projectForm.location} onChange={(event) => setProjectForm((current) => ({ ...current, location: event.target.value }))} required /></Field>
          <Field label="Category"><TextInput value={projectForm.category} onChange={(event) => setProjectForm((current) => ({ ...current, category: event.target.value }))} placeholder="Residential, Hospitality..." required /></Field>
          <Field label="Hero image URL"><TextInput value={projectForm.heroImage} onChange={(event) => setProjectForm((current) => ({ ...current, heroImage: event.target.value }))} required={!projectHeroFile} /></Field>
          <Field label="Hero image file"><TextInput type="file" accept="image/*" onChange={(event) => setProjectHeroFile(event.target.files?.[0] ?? null)} /></Field>
          <Field label="Website status"><SelectInput value={projectForm.visibleOnSite} onChange={(event) => setProjectForm((current) => ({ ...current, visibleOnSite: event.target.value }))}><option value="true">Visible on website</option><option value="false">Hidden from website</option></SelectInput></Field>
          <Field label="Sort order"><TextInput type="number" min={0} value={projectForm.sortOrder} onChange={(event) => setProjectForm((current) => ({ ...current, sortOrder: event.target.value }))} /></Field>
          <Field label="Summary"><TextArea value={projectForm.summary} onChange={(event) => setProjectForm((current) => ({ ...current, summary: event.target.value }))} className="min-h-[110px]" required /></Field>
          <Field label="Challenge"><TextArea value={projectForm.challenge} onChange={(event) => setProjectForm((current) => ({ ...current, challenge: event.target.value }))} className="min-h-[110px]" required /></Field>
          <Field label="Solution"><TextArea value={projectForm.solution} onChange={(event) => setProjectForm((current) => ({ ...current, solution: event.target.value }))} className="min-h-[110px]" required /></Field>
          <Field label="Client testimonial"><TextArea value={projectForm.testimonial} onChange={(event) => setProjectForm((current) => ({ ...current, testimonial: event.target.value }))} className="min-h-[110px]" /></Field>
          <Field label="Gallery image URLs"><TextArea value={projectForm.gallery} onChange={(event) => setProjectForm((current) => ({ ...current, gallery: event.target.value }))} className="min-h-[130px]" placeholder="One URL per line" /></Field>
          <Field label="Materials"><TextArea value={projectForm.materials} onChange={(event) => setProjectForm((current) => ({ ...current, materials: event.target.value }))} className="min-h-[130px]" placeholder="One material per line" /></Field>
          <Field label="Metrics"><TextArea value={projectForm.metrics} onChange={(event) => setProjectForm((current) => ({ ...current, metrics: event.target.value }))} className="min-h-[130px]" placeholder="One metric per line" /></Field>
          <div className="sm:col-span-2 flex justify-end gap-3"><AdminButton type="button" tone="ghost" onClick={() => { setProjectModalOpen(false); setEditingProjectId(null); setProjectHeroFile(null); }}>Cancel</AdminButton><AdminButton type="submit">{editingProjectId ? 'Save changes' : 'Create project'}</AdminButton></div>
        </form>
      </AdminModal>
    </div>
  );
}
