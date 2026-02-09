import { redirect } from 'next/navigation'
import { SetupForm } from './setup-form'

export const dynamic = 'force-dynamic'

export default async function SetupPage() {
  const { db } = await import('@/lib/db')
  const userCount = await db.user.count()

  if (userCount > 0) {
    redirect('/login')
  }

  return <SetupForm />
}
