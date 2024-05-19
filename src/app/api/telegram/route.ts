import { NextRequest } from "next/server"
import { env } from "~/env"
import { Context, Telegraf, session } from 'telegraf'
import { db } from "~/server/db"
import { message } from "telegraf/filters";
import { eq } from "drizzle-orm";
import { AddressType, addresses, regions } from "~/server/db/schema";
import fs from "fs";
import axios from "axios";
import { createId } from "@paralleldrive/cuid2";
import sharp from "sharp";
import { InitializeUser } from "~/server/api/trpc";

interface Session {
  addressId?: string;
  lastMessageId?: number;
  photos?: string[];
  isDownloading?: boolean;
}

interface CustomContext extends Context {
  session?: Session
}

export const bot = new Telegraf<CustomContext>(env.TELEGRAM_TOKEN)

bot.use(session())

bot.start(async (ctx) => {
  const regions = await db.query.regions.findMany()

  console.log("state:", ctx.state)
  const user = await InitializeUser({
    user: {
      id: ctx.from.id,
      firstName: ctx.from.first_name,
      username: ctx.from.username,
      photoUrl: ""
    }
  })

  if (user.role === "ADMIN") {
    ctx.setChatMenuButton({
      text: "Админ панель",
      type: "web_app",
      web_app: {
        url: env.WEBAPP_URL
      }
    })
  }
  ctx.reply("Список округов:", {
    reply_markup: {
      inline_keyboard: regions.map((r) => [
        {
          text: r.name,
          callback_data: `region:${r.id}`
        }
      ])
    }
  })
})

bot.on(message("photo"), async (ctx) => {
  console.log(ctx.session)
  if (!ctx.session) return;

  let imageId = ctx.message.photo.pop()?.file_id;
  if (imageId) {
    await ctx.telegram.getFileLink(imageId).then(async (link) => {
      ctx.session?.photos?.push(link.href)

      ctx.deleteMessage();
      ctx.deleteMessage(ctx.session?.lastMessageId);
      const m = await ctx.reply(`Загружено ${ctx.session?.photos?.length} фото`, {
        reply_markup: {
          inline_keyboard: [
            [{
              text: "Отправить",
              callback_data: "submit:photos"
            }],
            [{
              text: "Отмена",
              callback_data: `region:${ctx.state.regionId}`
            }]
          ]
        }
      })

      ctx.session!.lastMessageId = m.message_id;
    });
  }
});

bot.on("callback_query", async (ctx) => {
  const [command, data] = (ctx.callbackQuery.data as string).split(":")

  switch (command) {
    case "submit": {
      if (!ctx.session?.addressId || !ctx.session.photos || ctx.session.isDownloading) {
        return;
      }
      ctx.session.isDownloading = true;
      ctx.deleteMessage(ctx.session.lastMessageId);

      const address = await db.query.addresses.findFirst({
        where: eq(addresses.id, ctx.session.addressId),
        columns: {
          name: true,
          type: true
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
        ctx.reply("Адрес не найден")
        return;
      }

      const path = `./images/${address.region.name}/${address.type === "ASSEMBLY" ? "Монтаж" : "Демонтаж"}/${address.name}`
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true })
      }

      await ctx.reply("Скачиваем фотографии...");
      await ctx.sendChatAction("typing");
      await Promise.all(ctx.session.photos.map(async (p) => {
        const response = await axios.get(p, { responseType: "arraybuffer" });
        await sharp(response.data)
          .png()
          .toFile(`${path}/${createId()}.png`);
      }))

      ctx.session = undefined;

      await ctx.reply("Фотографии загружены", {
        reply_markup: {
          inline_keyboard: [
            [{
              text: "Продолжить",
              callback_data: "start"
            }]
          ]
        }
      })
      break;
    }
    case "start": {
      const regions = await db.query.regions.findMany()
      ctx.state.addressId = undefined

      ctx.deleteMessage();
      ctx.reply("Список округов:", {
        reply_markup: {
          inline_keyboard: regions.map((r) => [
            {
              text: r.name,
              callback_data: `region:${r.id}`
            }
          ])
        }
      })
      break;
    }
    case "regionASSEMBLY":
    case "regionDISASSEMBLY":
      {
        const type: AddressType = command === "regionASSEMBLY" ? "ASSEMBLY" : "DISASSEMBLY"
        console.log(type)

        const region = await db.query.regions.findFirst({
          where: eq(regions.id, data ?? ""),
          columns: {
            name: true,
            id: true,
          },
          with: {
            addresses: {
              where: eq(addresses.type, type)
            }
          }
        })

        if (!region) {
          ctx.reply("Округ не найден")
          return
        }

        ctx.deleteMessage();
        ctx.reply(`${region?.name} (${type === "ASSEMBLY" ? "Монтаж" : "Демонтаж"})`, {
          reply_markup: {
            inline_keyboard: [
              ...region.addresses.map((a) => [{ text: a.name, callback_data: `address:${a.id}` }]),
              [{ text: "Назад", callback_data: `region:${region.id}` }]
            ]
          }
        })
        break;
      }
    case "region": {
      const region = await db.query.regions.findFirst({
        where: eq(regions.id, data ?? ""),
        columns: {
          name: true,
          id: true,
        }
      });

      if (!region) {
        ctx.reply("Не удалось найти округ")
        return;
      }

      ctx.deleteMessage();
      ctx.reply(region.name, {
        reply_markup: {
          inline_keyboard: [
            [{
              text: "Монтаж",
              callback_data: `regionASSEMBLY:${region.id}`
            }],
            [{
              text: "Демонтаж",
              callback_data: `regionDISASSEMBLY:${region.id}`
            }],
            [{
              text: "Назад",
              callback_data: `start`
            }]
          ]
        }
      })

      break;
    }
    case "address": {
      const address = await db.query.addresses.findFirst({
        where: eq(addresses.id, data ?? ""),
        columns: {
          regionId: true,
          type: true,
          id: true,
        }
      })

      if (!address) {
        ctx.reply("Адрес не найден")
        return
      }

      ctx.session ??= {
        addressId: "",
        lastMessageId: 0,
        photos: [],
        isDownloading: false,
      }
      ctx.session.addressId = address.id;


      ctx.deleteMessage();
      const m = await ctx.reply("Отправьте фотографии чтобы продолжить\nЗагружено 0 фото", {
        reply_markup: {
          inline_keyboard: [
            [{
              text: "Отмена",
              callback_data: `region${address.type}:${address.regionId}`
            }]
          ]
        }
      })

      ctx.session.lastMessageId = m.message_id;
      break;
    }
  }
});

export async function POST(req: NextRequest) {
  const body = await req.json()
  await bot.handleUpdate(body as any)
  return Response.json("ok", { status: 200 })
}
