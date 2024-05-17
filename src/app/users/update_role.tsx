"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useToast } from "~/components/ui/use-toast";
import { UserRole, userRoleEnum, userRoleEnumSchema } from "~/server/db/schema";
import { User } from "~/shared";
import { api } from "~/trpc/react";

export default function UpdateUserRole({
  user
}: {
  user: User
}) {
  const [newRole, setNewRole] = useState<UserRole>(user.role);

  const router = useRouter();
  const toast = useToast();

  const updateRoleMutation = api.user.updateRole.useMutation({
    onSuccess() {
      router.refresh();
    },
    onError() {
      toast.toast({
        title: "Не удалось обновить роль",
        description: "Попробуйте еще раз",
        variant: "destructive",
      })
    }
  })
  useEffect(() => {
    if (newRole === user.role) return;

    updateRoleMutation.mutate({
      id: user.id,
      role: newRole
    })
  }, [newRole])

  return (
    <Select onValueChange={(v) => setNewRole(v as UserRole)} value={newRole}>
      <SelectTrigger>
        <SelectValue placeholder="Роль" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={"ADMIN"}>
          Администратор
        </SelectItem>
        <SelectItem value={"USER"}>
          Пользователь
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
