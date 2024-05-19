import { eq } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { addressTypeEnumSchema, addresses, regions } from "~/server/db/schema";

export const regionRouter = createTRPCRouter({
  create: adminProcedure
    .input(z.object({
      name: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(regions).values(input)
    }),
  delete: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(regions).where(eq(regions.id, input.id))
    }),
  getOne: publicProcedure
    .input(z.object({
      id: z.string(),
      type: addressTypeEnumSchema,
    }))
    .query(({ ctx, input }) => {
      return ctx.db.query.regions.findFirst({
        where: eq(regions.id, input.id),
        with: {
          addresses: {
            where: eq(addresses.type, input.type),
          }
        }
      })
    }),
  getAll: publicProcedure
    .query(({ ctx }) => {
      return ctx.db.query.regions.findMany()
    }),

});
