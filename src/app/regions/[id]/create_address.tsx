"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/trpc/react";

export default function CreateAddress({
  regionId
}: {
  regionId: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const createAddressMutation = api.address.create.useMutation({
    onSuccess: () => {
      router.refresh();
      toast.toast({
        title: "Адрес создан",
        description: "Адрес успешно создан",
      })
      setName("");
    },
    onError: () => {
      toast.toast({
        title: "Не удалось создать адрес",
        description: "Попробуйте еще раз",
        variant: "destructive",
      })
    }
  })

  const [name, setName] = useState("");

  const onSubmit = () => {
    if (!name) {
      toast.toast({
        title: "Не указано название адреса",
        description: "Попробуйте еще раз",
        variant: "destructive",
      })
      return;
    }

    createAddressMutation.mutate({
      regionId,
      name
    })
  }

  return (
    <div className="flex flex-row gap-2 w-full">
      <Input
        value={name} onChange={(e) => setName(e.target.value)}
        className="grow" placeholder="Название адреса" />
      <Button size="icon" className="aspect-square"
        onClick={onSubmit}
      >
        <Plus />
      </Button>
    </div>
  );
}
