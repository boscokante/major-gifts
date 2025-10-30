'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

const CHANNELS = ['budgets', 'grants', 'grant_year_amounts', 'allocation_rules', 'actuals'];

export function RealtimeListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const subscriptions = CHANNELS.map((table) =>
      supabase
        .channel(`${table}-changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          router.refresh();
        })
        .subscribe(),
    );

    return () => {
      subscriptions.forEach((subscription) => {
        supabase.removeChannel(subscription);
      });
    };
  }, [router]);

  return null;
}
