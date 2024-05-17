"use client";

import { api } from "~/trpc/react";
import UpdateUserRole from "./update_role";
import BackButton from "~/components/backButton";

export default function Users() {
  const users = api.user.getAll.useQuery();

  return (
    <div className="p-6 space-y-4">
      <BackButton href="/" />
      <p className="text-2xl font-bold">
        Пользователи
      </p>
      <div className="flex flex-col gap-2">
        {users.data?.map((u) => (
          <div className="p-4 rounded-xl border flex flex-col gap-2" key={u.id}>
            <p>{u.firstName} {u.username && `(${u.username})`}</p>
            <UpdateUserRole user={u} />
          </div>
        ))}
      </div>
    </div>
  );
}
