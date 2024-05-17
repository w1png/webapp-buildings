"use client";

import {
  retrieveLaunchParams,
} from '@tma.js/sdk-react';
import { useEffect, useState } from 'react';
import { api, setInitData } from '~/trpc/react';

export default function useUser() {
  const [initDataRaw, setInitDataRaw] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = retrieveLaunchParams();

      if (params.initDataRaw) {
        setInitData(params.initDataRaw);
        setInitDataRaw(params.initDataRaw)
      }
    } catch (e) {
      console.error("BUG HERE", e);
    }
  }, [])

  const getUser = api.user.getSelf.useQuery(undefined, {
    enabled: !!initDataRaw
  });

  return {
    user: getUser.data ?? null,
    isPending: getUser.isPending
  };
}
