import Link from "next/link";
import BackButton from "~/components/backButton";
import { Button } from "~/components/ui/button";
import NotFoundPage from "~/not-found";
import { api } from "~/trpc/server";

export default async function Region({
  params
}: {
  params: {
    id: string;
  }
}) {
  const region = await api.region.getOne({
    id: params.id,
    type: "ASSEMBLY"
  })

  if (!region) {
    return <NotFoundPage />
  }

  return (
    <div className="h-screen w-screen flex flex-col p-6">
      <BackButton href="/regions" />
      <p className="text-2xl font-bold">{region.name}</p>
      <div className="flex flex-col gap-2 grow justify-center items-center">
        <Link href={`/regions/${region.id}/assembly`}>
          <Button>Монтаж</Button>
        </Link>
        <Link href={`/regions/${region.id}/disassembly`}>
          <Button>Демонтаж</Button>
        </Link>

      </div>
    </div>
  );
}
