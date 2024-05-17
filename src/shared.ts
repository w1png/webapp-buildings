import { inferProcedureOutput } from "@trpc/server";
import { AppRouter } from "./server/api/root";

export type User = inferProcedureOutput<AppRouter["user"]["getSelf"]>;
export type Region = NonNullable<inferProcedureOutput<AppRouter["region"]["getOne"]>>;

