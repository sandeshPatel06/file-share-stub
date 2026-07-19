import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { SharePage } from "@/components/SharePage";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title:       `${slug} — FileShare`,
    description: `Shared space at /s/${slug}. Real-time collaborative text and file sharing.`,
  };
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;

  const doc = await adminDb.collection("pages").doc(slug).get();
  if (!doc.exists) notFound();

  const data = doc.data()!;

  // Strip passwordHash — never pass to client
  return (
    <SharePage
      pageData={{
        slug:        data.slug,
        isProtected: data.isProtected,
        content:     data.content,
      }}
    />
  );
}
