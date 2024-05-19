import BackButton from "~/components/backButton"
import NotFoundPage from "~/not-found"
import { api } from "~/trpc/server"
import CreateAddress from "./create_address"
import DeleteRegion from "./delete"
import { Separator } from "~/components/ui/separator"
import DeleteAddress from "./delete_address"
import DownloadRegion from "./download"
import { AddressType } from "~/server/db/schema"
import DownloadAddress from "./download_address"

export default async function RegionPage({
  params
}: {
  params: {
    id: string;
    type: string;
  }
}) {
  const type = params.type.toUpperCase() as AddressType;
  const region = await api.region.getOne({
    id: params.id,
    type: type
  })

  if (!region) {
    return <NotFoundPage />
  }

  return (
    <div className="p-6 space-y-4">
      <BackButton href={`/regions/${region.id}`} />
      <p className="text-2xl font-bold">
        {region.name}
      </p>
      <div className="flex flex-row gap-2">
        <DeleteRegion region={region} />
        <DownloadRegion regionId={region.id} />
      </div>
      <Separator />
      <CreateAddress type={type} regionId={region.id} />
      <div className="flex flex-col gap-2">
        {region.addresses.map((a) => (
          <div className="space-y-4" key={a.id}>
            <div className="flex flex-row gap-2 justify-between items-center">
              <p>{a.name}</p>
              <div className="gap-1 flex flex-row">
                <DownloadAddress addressId={a.id} />
                <DeleteAddress addressId={a.id} regionId={region.id} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
