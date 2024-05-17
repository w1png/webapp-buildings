import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { userRouter } from "./routers/user";
import { regionRouter } from "./routers/region";
import { addressRouter } from "./routers/address";
import { imageRouter } from "./routers/images";

export const appRouter = createTRPCRouter({
  user: userRouter,
  region: regionRouter,
  address: addressRouter,
  image: imageRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
