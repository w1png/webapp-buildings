import { TRPCError } from "@trpc/server";
import fs from "fs";
import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import archiver from "archiver";
import { bot } from "~/app/api/telegram/route";
import { Input } from "telegraf";
import { eq } from "drizzle-orm";
import { addresses, regions } from "~/server/db/schema";


async function ArchiveDir(path: string) {
  const archivePath = `${path}.zip`
  console.log(archivePath)
  const output = fs.createWriteStream(archivePath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });
  const stream = archive.pipe(output);
  archive.directory(path, false);
  await archive.finalize();

  return archivePath;
}

async function SendFile(userId: number, path: string) {
  await bot.telegram.sendDocument(userId, Input.fromLocalFile(path))
}

export const imageRouter = createTRPCRouter({
  downloadAddress: adminProcedure
    .input(z.object({
      addressId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const address = await ctx.db.query.addresses.findFirst({
        where: eq(addresses.id, input.addressId),
        columns: {
          name: true,
          type: true,
        },
        with: {
          region: {
            columns: {
              name: true
            }
          }
        }
      })

      if (!address) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Адрес не найден"
        })
      }

      const path = `./images/${address.region.name}/${address.type === "ASSEMBLY" ? "Монтаж" : "Демонтаж"}/${address.name}`
      if (!fs.existsSync(path)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "В адрес не добавлены фотографии"
        })
      }

      Promise.resolve().then(async () => {
        try {
          const archive = await ArchiveDir(path)
          await SendFile(ctx.user!.id, archive)
          fs.rmSync(archive);
        } catch (err) {
          console.error(err);

          await bot.telegram.sendMessage(ctx.user!.id, "Произошла ошибка при архивации адреса")
        }
      })
    }),
  downloadRegion: adminProcedure
    .input(z.object({
      regionId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const regionName = await ctx.db.query.regions.findFirst({
        columns: {
          name: true
        },
        where: eq(regions.id, input.regionId)
      })

      if (!regionName) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Округ не найден"
        })
      }

      const path = `./images/${regionName.name}`
      if (!fs.existsSync(path)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "В округ не добавлены фотографии"
        })
      }

      Promise.resolve().then(async () => {
        try {
          const archive = await ArchiveDir(path)
          await SendFile(ctx.user!.id, archive)
          fs.rmSync(archive);
        } catch (err) {
          console.error(err);

          await bot.telegram.sendMessage(ctx.user!.id, "Произошла ошибка при архивации округа")
        }
      })
    }),
});
