import { redirect } from "next/navigation";

export default async function ReserverSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/reserver/prestations?salon=${encodeURIComponent(slug)}`);
}
