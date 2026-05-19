import { redirect } from 'next/navigation'

// Applications page removed — apply buttons removed from cards.
// Users now apply directly via job board links.
export default function ApplicationsPage() {
  redirect('/dashboard')
}
