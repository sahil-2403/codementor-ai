import { useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Loader from '../../components/common/Loader.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import SectionHeader from '../../components/common/SectionHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusPill from '../../components/common/StatusPill.jsx';
import AdminFilters from '../../components/admin/AdminFilters.jsx';
import PaginationControls from '../../components/admin/PaginationControls.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { useAdminUsers } from '../../queries/adminQueries.js';

export default function UsersPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 10, search: '', role: '' });
  const { data, isLoading } = useAdminUsers(filters);
  const columns = [
    { key: 'name', header: 'Name', render: (user) => <b>{user.name}</b> },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (user) => <StatusPill status={user.role} /> },
    { key: 'verified', header: 'Verified', render: (user) => <StatusPill status={user.isEmailVerified ? 'verified' : 'pending'} tone={user.isEmailVerified ? 'success' : 'warning'} /> },
    { key: 'createdAt', header: 'Joined', render: (user) => formatDate(user.createdAt) }
  ];
  return <PageShell>
    <PageHeader eyebrow="Admin" title="Users" description="Search and audit learner/admin accounts without loading the full user table at once." />
    <Card>
      <SectionHeader title="User directory" description={`${data?.pagination?.total || 0} accounts found.`} />
      <div className="mt-4"><AdminFilters filters={filters} setFilters={setFilters} includeTopic={false} includeRole /></div>
      <div className="mt-4"><DataTable columns={columns} rows={data?.users || []} isLoading={isLoading} emptyTitle="No users found" emptyDescription="Try a different search or role filter." minWidth={760} /></div>
      <PaginationControls pagination={data?.pagination} setFilters={setFilters} />
    </Card>
  </PageShell>;
}
