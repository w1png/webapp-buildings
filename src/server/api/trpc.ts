import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { validate } from '@tma.js/init-data-node';

import { db } from "~/server/db";
import { env } from "~/env";
import { parseInitData, type InitDataParsed } from "@tma.js/sdk";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { AwaitedReactNode } from "react";


export async function InitializeUser(initData: {
  user: {
    id: number
    firstName: string
    username: string | undefined
    photoUrl: string | undefined
  }
}) {
  if (!initData.user) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Отсутсвуют данные пользователя"
    })
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, initData.user.id)
  })

  if (user) {
    return user;
  }

  const newUser = (await db.insert(users).values({
    id: initData.user.id,
    firstName: initData.user.firstName,
    username: initData.user.username,
    image: initData.user.photoUrl,
    role: initData.user.id.toString() === env.MAIN_ADMIN_ID ? "ADMIN" : "USER"
  }).returning())[0];

  if (!newUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Ошибка создания пользователя"
    })
  }

  return newUser;
}

export const createTRPCContext = async (opts: { headers: Headers }) => {
  var user: Awaited<ReturnType<typeof InitializeUser>> | null = null;

  const initDataRaw = opts.headers.get("x-trpc-init-data");
  if (initDataRaw) {
    try {
      validate(initDataRaw ?? "", env.TELEGRAM_TOKEN)

      const initData = parseInitData(initDataRaw);

      if (!initData?.user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Некорректные параметры запуска"
        })
      }

      user = await InitializeUser({
        user: {
          id: initData.user.id,
          firstName: initData.user.firstName,
          username: initData.user.username,
          photoUrl: initData.user.photoUrl
        }
      });

      return {
        db,
        user,
        ...opts,
      };
    } catch (e: any) {
      console.error(e)

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Ошибка валидации параметров запуска"
      })
    }
  }

  return {
    db,
    user,
    ...opts,
  }
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== "ADMIN") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Недостаточно прав"
    })
  }

  return next();
})
