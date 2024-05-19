"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogTitle, AlertDialogAction, AlertDialogCancel, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogTrigger, AlertDialogDescription } from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/trpc/react";

export default function DeleteAddress({
  addressId,
  regionId
}: {
  addressId: string;
  regionId: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const deleteAddressMutation = api.address.delete.useMutation({
    onSuccess: () => {
      router.push(`/regions/${regionId}`);
      router.refresh();
      toast.toast({
        title: "Адрес удален",
        description: "Адрес успешно удален",
      })
    },
    onError: () => {
      toast.toast({
        title: "Не удалось удалить Адрес",
        description: "Попробуйте еще раз",
        variant: "destructive",
      })
    }
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <Button variant="destructive" size="icon" className="aspect-square">
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удаление Адреса</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите удалить Адрес?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              deleteAddressMutation.mutate({ id: addressId });
            }}
          >
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
