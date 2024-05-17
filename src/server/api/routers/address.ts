import { eq } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { addresses } from "~/server/db/schema";

export const addressRouter = createTRPCRouter({
  getOne: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(({ ctx, input }) => {
      return ctx.db.query.addresses.findFirst({
        where: eq(addresses.id, input.id),
      })
    }),
  getAll: publicProcedure
    .input(z.object({
      regionId: z.string(),
    }))
    .query(({ ctx, input }) => {
      return ctx.db.query.addresses.findMany({
        where: eq(addresses.regionId, input.regionId),
      })
    }),
  create: adminProcedure
    .input(z.object({
      regionId: z.string(),
      name: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(addresses).values(input)
    }),
  delete: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(addresses).where(eq(addresses.id, input.id))
    })
});
