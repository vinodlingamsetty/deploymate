import { redirect } from 'next/navigation'
import { MOCK_ORGANIZATIONS, MOCK_ORG_DISTRIBUTION_GROUPS } from '@/lib/mock-data'
import { GroupsPageContent } from '@/components/groups/groups-page-content'

interface GroupsPageProps {
  searchParams: { org?: string }
}

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
  const orgSlug = searchParams.org

  if (!orgSlug) {
    redirect('/dashboard')
  }

  const org = MOCK_ORGANIZATIONS.find((o) => o.slug === orgSlug)

  if (!org) {
    redirect('/dashboard')
  }

  const groups = MOCK_ORG_DISTRIBUTION_GROUPS.filter((g) => g.orgSlug === orgSlug)

  return <GroupsPageContent orgName={org.name} orgSlug={org.slug} groups={groups} />
}
