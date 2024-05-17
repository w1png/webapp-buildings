"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/trpc/react";

export default function CreateRegion() {
  const toast = useToast();
  const router = useRouter();
  const createRegionMutation = api.region.create.useMutation({
    onSuccess: () => {
      router.refresh();
      toast.toast({
        title: "Регион создан",
        description: "Регион успешно создан",
      })
      setName("");
    },
    onError: () => {
      toast.toast({
        title: "Не удалось создать регион",
        description: "Попробуйте еще раз",
        variant: "destructive",
      })
    }
  })

  const [name, setName] = useState("");

  const onSubmit = () => {
    if (!name) {
      toast.toast({
        title: "Не указано название региона",
        description: "Попробуйте еще раз",
        variant: "destructive",
      })
      return;
    }

    createRegionMutation.mutate({
      name
    })
  }

  return (
    <div className="flex flex-row gap-2 w-full">
      <Input
        value={name} onChange={(e) => setName(e.target.value)}
        className="grow" placeholder="Название региона" />
      <Button size="icon" className="aspect-square"
        onClick={onSubmit}
      >
        <Plus />
      </Button>
    </div>
  );
}
