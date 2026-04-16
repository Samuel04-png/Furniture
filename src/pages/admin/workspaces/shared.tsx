import type { ChangeEvent, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import { useTailoredStore } from '../../../store/useTailoredStore';
import { cn } from '../../../lib/utils';
import type {
  AccountingStatus,
  Consultation,
  Enquiry,
  EnquirySource,
  Product,
  TeamRole,
} from '../../../types';

export type PipelineTab = 'leads' | 'sessions' | 'consultations' | 'quotes';
export type JobsTab = 'board' | 'schedule';
export type MaterialsTab = 'stock' | 'purchase-orders' | 'library';
export type FinanceTab = 'invoices' | 'deposits' | 'expenses' | 'purchase-orders';
export type ProductsTab = 'library' | 'publishing';
export type SystemTab = 'team' | 'templates' | 'company' | 'website' | 'automations';

export const pipelineTabs: PipelineTab[] = ['leads', 'sessions', 'consultations', 'quotes'];
export const jobsTabs: JobsTab[] = ['board', 'schedule'];
export const materialsTabs: MaterialsTab[] = ['stock', 'purchase-orders', 'library'];
export const financeTabs: FinanceTab[] = ['invoices', 'deposits', 'expenses', 'purchase-orders'];
export const productsTabs: ProductsTab[] = ['library', 'publishing'];
export const systemTabs: SystemTab[] = ['team', 'templates', 'company', 'website', 'automations'];

export function useActiveAdmin() {
  const teamMembers = useTailoredStore((state) => state.teamMembers);
  const activeAdminId = useTailoredStore((state) => state.activeAdminId);
  const authUser = useTailoredStore((state) => state.authUser);
  return (
    teamMembers.find((member) => member.id === activeAdminId) ??
    teamMembers.find((member) => member.uid === authUser?.uid) ??
    teamMembers.find((member) => member.email.toLowerCase() === authUser?.email?.toLowerCase()) ??
    teamMembers[0] ??
    (authUser
      ? {
          id: authUser.uid,
          uid: authUser.uid,
          name: authUser.email || 'Admin',
          role: authUser.role,
          email: authUser.email || '',
          phone: '',
          initials: 'TM',
        }
      : undefined)
  );
}

export function safeDigits(value?: string) {
  return (value ?? '').replace(/\D/g, '');
}

export function toneForEnquiry(status: Enquiry['status']) {
  if (status === 'Won') return 'success';
  if (status === 'Lost') return 'danger';
  if (status === 'New') return 'accent';
  if (status === 'Negotiation') return 'warning';
  return 'neutral';
}

export function toneForConsultation(status: Consultation['status']) {
  if (status === 'Completed') return 'success';
  if (status === 'Cancelled') return 'danger';
  if (status === 'Rescheduled') return 'warning';
  return 'accent';
}

export function toneForFinance(status: AccountingStatus) {
  if (status === 'Paid') return 'success';
  if (status === 'Overdue') return 'danger';
  if (status === 'Issued') return 'warning';
  return 'neutral';
}

export function toneForProduct(status: Product['status']) {
  if (status === 'Live') return 'success';
  if (status === 'Draft') return 'accent';
  return 'neutral';
}

export function getLeadNextAction(enquiry: Enquiry) {
  if (enquiry.status === 'New') return 'Send WhatsApp response';
  if (enquiry.status === 'Consultation Scheduled') return 'Prepare consultation brief';
  if (enquiry.status === 'Quote Sent') return 'Check quote response';
  if (enquiry.status === 'Negotiation') return 'Follow up on revisions';
  if (enquiry.status === 'Won') return 'Move to jobs workspace';
  return 'Archive and document learnings';
}

export function getJobNextAction(orderStatus: string, balanceDue: number) {
  if (balanceDue > 0 && orderStatus === 'Confirmed Order') return 'Request production deposit release';
  if (orderStatus === 'Materials Sourced') return 'Release to workshop';
  if (orderStatus === 'In Production') return 'Capture progress update';
  if (orderStatus === 'Quality Check') return 'Run final QC and approve';
  if (orderStatus === 'Ready for Delivery') return 'Schedule delivery';
  return 'Close out and request final review';
}

export function mapFinanceTab(tab: FinanceTab) {
  if (tab === 'invoices') return 'Invoice';
  if (tab === 'deposits') return 'Deposit';
  if (tab === 'expenses') return 'Expense';
  return 'Purchase Order';
}

export function financeTabLabel(tab: FinanceTab) {
  if (tab === 'invoices') return 'Invoices';
  if (tab === 'deposits') return 'Deposits';
  if (tab === 'expenses') return 'Expenses';
  return 'Purchase Orders';
}

export function pipelineTabLabel(tab: PipelineTab) {
  if (tab === 'leads') return 'Leads';
  if (tab === 'sessions') return 'Sessions';
  if (tab === 'consultations') return 'Consultations';
  return 'Quotes';
}

export function productChecklist(product: Product) {
  const checks = [
    Boolean(product.heroImage),
    Boolean(product.cardImage),
    Boolean(product.summary),
    Boolean(product.story),
    product.gallery.length >= 2,
  ];
  return checks.filter(Boolean).length;
}

export function mapProductCategoryToOverlay(category: Product['category']): Product['overlayKind'] {
  if (category === 'Seating') return 'sofa';
  if (category === 'Tables') return 'table';
  if (category === 'Storage') return 'cabinet';
  if (category === 'Beds') return 'bed';
  if (category === 'Office') return 'desk';
  return 'outdoor';
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-[0.6rem] font-medium uppercase tracking-[0.24em] text-tm-warm-gray">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'min-h-[2.9rem] w-full rounded-[1rem] border border-black/8 bg-[#fffdf9] px-4 py-3 text-sm leading-6 text-tm-charcoal shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition duration-200 ease-out placeholder:text-tm-warm-gray/75 focus:border-tm-gold focus:ring-2 focus:ring-tm-gold/18',
        props.className,
      )}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'min-h-[2.9rem] w-full rounded-[1rem] border border-black/8 bg-[#fffdf9] px-4 py-3 text-sm leading-6 text-tm-charcoal shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition duration-200 ease-out focus:border-tm-gold focus:ring-2 focus:ring-tm-gold/18',
        props.className,
      )}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'min-h-[120px] w-full rounded-[1rem] border border-black/8 bg-[#fffdf9] px-4 py-3 text-sm leading-6 text-tm-charcoal shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition duration-200 ease-out placeholder:text-tm-warm-gray/75 focus:border-tm-gold focus:ring-2 focus:ring-tm-gold/18',
        props.className,
      )}
    />
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}) {
  return (
    <label className="relative min-w-0 flex-1 sm:min-w-[220px]">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tm-warm-gray" />
      <TextInput value={value} onChange={onChange} placeholder={placeholder} className="pl-10" />
    </label>
  );
}

export function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.15rem] border border-black/6 bg-[#fffdf9] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
      <p className="text-[0.6rem] font-medium uppercase tracking-[0.22em] text-tm-warm-gray">{label}</p>
      <p className="mt-3 text-sm leading-6 text-tm-charcoal">{value}</p>
    </div>
  );
}

export function defaultLeadForm() {
  return {
    clientName: '',
    phone: '',
    email: '',
    source: 'direct' as EnquirySource,
    channel: 'Website enquiry',
    productNames: '',
  };
}

export function roleSupportsEditing(role?: TeamRole) {
  return role === 'Admin' || role === 'Owner' || role === 'Sales' || role === 'Operations';
}
