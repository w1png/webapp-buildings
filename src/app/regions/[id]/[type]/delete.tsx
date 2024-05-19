"use client";

import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogTitle, AlertDialogAction, AlertDialogCancel, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogTrigger, AlertDialogDescription } from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { Region } from "~/shared";
import { api } from "~/trpc/react";

export default function DeleteRegion({
  region
}: {
  region: Region
}) {
  const router = useRouter();
  const toast = useToast();

  const deleteRegionMutation = api.region.delete.useMutation({
    onSuccess: () => {
      router.push("/regions");
      router.refresh();
      toast.toast({
        title: "Регион удален",
        description: "Регион успешно удален",
      })
    },
    onError: () => {
      toast.toast({
        title: "Не удалось удалить регион",
        description: "Попробуйте еще раз",
        variant: "destructive",
      })
    }
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <Button variant="destructive" className="basis-1/2">Удалить</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удаление региона</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите удалить регион "{region.name}"?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              deleteRegionMutation.mutate({ id: region.id });
            }}
          >
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
