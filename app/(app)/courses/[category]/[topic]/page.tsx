import { CoursePlaylistsPage } from "@/components/course-playlists-page"
import { getCourseTopic } from "@/lib/course-references"
import { notFound } from "next/navigation"

type CourseReferencePageProps = {
  params: Promise<{
    category: string
    topic: string
  }>
}

export default async function CourseReferencePage({ params }: CourseReferencePageProps) {
  const { category, topic } = await params
  const reference = getCourseTopic(category, topic)

  if (!reference) {
    notFound()
  }

  return <CoursePlaylistsPage category={reference.category} topic={reference.topic} />
}
