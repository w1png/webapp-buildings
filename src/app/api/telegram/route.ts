import { NextRequest } from "next/server"
import { env } from "~/env"
import { Context, Telegraf, session } from 'telegraf'
import { db } from "~/server/db"
import { message } from "telegraf/filters";
import { eq } from "drizzle-orm";
import { addresses } from "~/server/db/schema";
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
  type: "assembly" | "disassembly";
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
  ctx.reply("Список регионов:", {
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
  if (!ctx.session) return;

  let imageId = ctx.message.photo.pop()?.file_id;
  if (imageId) {
    await ctx.telegram.getFileLink(imageId).then(async (link) => {
      ctx.session?.photos?.push(link.href)

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
          name: true
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

      const path = `./images/${address.region.name}/${address.name}/${ctx.session.type === "assembly" ? "Монтаж" : "Демонтаж"}`
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
      ctx.reply("Список регионов:", {
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
    case "region": {
      const region = await db.query.regions.findFirst({
        with: {
          addresses: true
        }
      })

      if (!region) {
        ctx.reply("Не удалось найти регион")
        return;
      }

      ctx.deleteMessage();
      ctx.reply(region.name, {
        reply_markup: {
          inline_keyboard: [
            ...region.addresses.map((a) => [
              {
                text: a.name,
                callback_data: `address:${a.id}`
              }
            ]),
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
      ctx.deleteMessage();

      const address = await db.query.addresses.findFirst({
        where: eq(addresses.id, data ?? ""),
        with: {
          region: {
            columns: {
              id: true
            }
          }
        }
      })

      if (!address) {
        ctx.reply("Адрес не найден")
        return;
      }

      // Монтаж/демонтаж
      ctx.reply("Выберите тип", {
        reply_markup: {
          inline_keyboard: [
            [{
              text: "Монтаж",
              callback_data: `addressAssembly:${data}`
            }, {
              text: "Демонтаж",
              callback_data: `addressDisassembly:${data}`
            }],
            [{
              text: "Назад",
              callback_data: `region:${address.region.id}`
            }]
          ]
        }
      })
      break;
    }
    case "addressDisassembly":
    case "addressAssembly": {
      ctx.session ??= {
        addressId: "",
        lastMessageId: 0,
        photos: [],
        isDownloading: false,
        type: command === "addressDisassembly" ? "disassembly" : "assembly"
      }
      ctx.session.addressId = data;

      ctx.deleteMessage();
      const m = await ctx.reply("Отправьте фотографии чтобы продолжить\nЗагружено 0 фото", {
        reply_markup: {
          inline_keyboard: [
            [{
              text: "Отмена",
              callback_data: `address:${data}`
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
