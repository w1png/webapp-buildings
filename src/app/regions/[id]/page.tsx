import BackButton from "~/components/backButton"
import NotFoundPage from "~/not-found"
import { api } from "~/trpc/server"
import CreateAddress from "./create_address"
import DeleteRegion from "./delete"
import { Separator } from "~/components/ui/separator"
import DeleteAddress from "./delete_address"
import Link from "next/link"
import { Button } from "~/components/ui/button"
import { Download } from "lucide-react"
import DownloadRegion from "./download"

export default async function RegionPage({
  params
}: {
  params: {
    id: string
  }
}) {
  const region = await api.region.getOne({ id: params.id })

  if (!region) {
    return <NotFoundPage />
  }

  return (
    <div className="p-6 space-y-4">
      <BackButton href="/regions" />
      <p className="text-2xl font-bold">
        {region.name}
      </p>
      <div className="flex flex-row gap-2">
        <DeleteRegion region={region} />
        <DownloadRegion regionId={region.id} />
      </div>
      <Separator />
      <CreateAddress regionId={region.id} />
      <div className="flex flex-col gap-2">
        {region.addresses.map((a) => (
          <div className="space-y-4" key={a.id}>
            <div className="flex flex-row gap-2 justify-between items-center">
              <p>{a.name}</p>
              <DeleteAddress addressId={a.id} regionId={region.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
