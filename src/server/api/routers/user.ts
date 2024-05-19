import { eq } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { userRoleEnumSchema, users } from "~/server/db/schema";

export const userRouter = createTRPCRouter({
  getSelf: publicProcedure
    .query(({ ctx }) => {
      return ctx.user;
    }),
  getAll: adminProcedure
    .query(({ ctx }) => {
      return ctx.db.query.users.findMany()
    }),
  updateRole: adminProcedure
    .input(z.object({
      id: z.number(),
      role: userRoleEnumSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(users).set({
        role: input.role
      })
        .where(eq(users.id, input.id))
    })
});
