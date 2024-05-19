
"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/trpc/react";

export default function DownloadAddress({
  addressId
}: {
  addressId: string;
}) {
  const [wasRequested, setWasRequested] = useState(false);
  const toast = useToast();

  const downloadAddressMutation = api.image.downloadAddress.useMutation({
    onSuccess: () => {
      toast.toast({
        title: "Запрос на скачивание отправлен",
        description: "Архив будет отправлен в личные сообщения в Telegram."
      })
      setWasRequested(true);
    },
    onError: (err) => {
      toast.toast({
        title: "Ошибка при создании запроса на скачивание",
        description: err.message
      })
    }
  })

  return (
    <Button
      onClick={() => {
        downloadAddressMutation.mutate({ addressId })
      }}
      size="icon"
      disabled={downloadAddressMutation.isPending || wasRequested}
    >
      <Download />
    </Button>
  );
}
