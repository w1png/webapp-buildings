import Link from "next/link";
import BackButton from "~/components/backButton";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/server";
import CreateRegion from "./create";

export default async function Regions() {
  const regions = await api.region.getAll();

  return (
    <div className="p-6 space-y-4">
      <BackButton href="/" />
      <p className="text-2xl font-bold">
        Регионы
      </p>
      <CreateRegion />
      <div className="flex flex-col gap-2 w-full">
        {regions.map((r) => (
          <Link href={`/regions/${r.id}`} key={r.id} className="w-full">
            <Button className="w-full">
              {r.name}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
