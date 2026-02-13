'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SalonSlugPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();

  useEffect(() => {
    const slug = params?.slug;
    if (!slug) return;
    router.replace(`/reserver/prestations?salon=${slug}`);
  }, [params, router]);

  return null;
}
