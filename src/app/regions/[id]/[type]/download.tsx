"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/trpc/react";

export default function DownloadRegion({
  regionId
}: {
  regionId: string;
}) {
  const [wasRequested, setWasRequested] = useState(false);
  const toast = useToast();

  const downloadRegionMutation = api.image.downloadRegion.useMutation({
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
        downloadRegionMutation.mutate({ regionId })
      }}
      className="gap-2"
      disabled={downloadRegionMutation.isPending || wasRequested}
    >
      <Download /> Скачать
    </Button>
  );
}
