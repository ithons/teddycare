import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import '../fonts.css'
import './styles.css'

export default async function DoctorLayout({
  children
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  const slug = session.orgSlug

  if (!slug || slug !== 'doctor') {
    redirect('/')
  }
  return (
    <div className="relative flex h-[calc(100vh-_theme(spacing.16))] overflow-hidden">
      {children}
    </div>
  )
}
