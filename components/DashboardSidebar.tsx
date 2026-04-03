import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/hooks/useAuth';
import { UI, getPrimaryDashboardHref } from '../lib/constants';

const USER_LINKS = [
  { href: '/dashboard', label: UI.DASHBOARD },
  { href: '/favorites', label: 'Favourites' },
  { href: '/dashboard/notifications', label: UI.NOTIFICATIONS },
];

const REALTOR_LINKS = [
  { href: '/dashboard', label: UI.DASHBOARD },
  { href: '/listings/new', label: 'Add Listing' },
  { href: '/dashboard/crm', label: 'CRM' },
  { href: '/dashboard/notifications', label: UI.NOTIFICATIONS },
];

const BROKER_LINKS = [
  { href: '/dashboard/broker', label: UI.DASHBOARD },
  { href: '/dashboard/broker/performance', label: UI.BROKER_PERFORMANCE },
  { href: '/dashboard/broker/workload', label: UI.BROKER_WORKLOAD },
  { href: '/dashboard/broker/client-oversight', label: UI.BROKER_CLIENT_OVERSIGHT },
  { href: '/dashboard/broker/communications', label: UI.BROKER_COMMUNICATIONS },
  { href: '/dashboard/broker/admin-controls', label: UI.BROKER_ADMIN_CONTROLS },
  { href: '/dashboard/broker/realtors', label: 'Realtor dashboards' },
  { href: '/dashboard/broker/team', label: UI.TEAM_MANAGEMENT },
  { href: '/dashboard/broker/approvals', label: UI.PENDING_APPROVALS },
  { href: '/dashboard/crm', label: 'CRM' },
  { href: '/dashboard/notifications', label: UI.NOTIFICATIONS },
];

const OFFICE_ADMIN_LINKS = [
  { href: '/dashboard/office-admin', label: UI.OFFICE_ADMIN_DASHBOARD },
  { href: '/admin', label: 'Broker/Realtor Management' },
  { href: '/dashboard/crm', label: 'CRM Oversight' },
  { href: '/dashboard/notifications', label: UI.NOTIFICATIONS },
];
const SYSTEM_ADMIN_LINKS = [
  { href: '/dashboard/system-admin', label: UI.ADMIN_DASHBOARD },
  { href: '/admin', label: 'Admin Operations' },
  { href: '/dashboard/crm', label: 'CRM' },
  { href: '/dashboard/notifications', label: UI.NOTIFICATIONS },
];

export default function DashboardSidebar() {
  const router = useRouter();
  const { role, isRealtor, isBroker, isOfficeAdmin, isSystemAdmin } = useAuth();

  const sections: { title: string; links: { href: string; label: string }[] }[] = [];
  if (role === 'USER') sections.push({ title: 'User', links: USER_LINKS });
  if (isRealtor) sections.push({ title: 'Realtor', links: REALTOR_LINKS });
  if (isBroker) sections.push({ title: 'Broker', links: BROKER_LINKS });
  if (isOfficeAdmin) sections.push({ title: 'Office Admin', links: OFFICE_ADMIN_LINKS });
  if (isSystemAdmin) sections.push({ title: 'System Admin', links: SYSTEM_ADMIN_LINKS });

  if (sections.length === 0) return null;

  return (
    <aside
      className="hidden md:block w-56 shrink-0 border-r border-slate-200 bg-white py-6 pr-4"
      aria-label="Dashboard navigation"
    >
      <nav className="sticky top-20 flex flex-col gap-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              {section.title}
            </h3>
            <ul className="space-y-0.5">
              {section.links.map((link) => {
                // Dashboard (index) should not be active when a child route is selected
                const isParentOnly = link.href === getPrimaryDashboardHref(role);
                const isActive = isParentOnly
                  ? router.pathname === link.href
                  : router.pathname === link.href ||
                    (link.href.length > 1 && router.pathname.startsWith(link.href + '/'));
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`block px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-accent-50 text-accent-700'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
