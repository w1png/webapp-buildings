import {
  integer,
  pgEnum,
  pgTableCreator,
  text,
} from "drizzle-orm/pg-core";
import { createId } from '@paralleldrive/cuid2';
import { z } from "zod";
import { relations } from "drizzle-orm";

export const createTable = pgTableCreator((name) => `webapp-images_${name}`);

export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN"]);
export const userRoleEnumSchema = z.enum(userRoleEnum.enumValues);
export type UserRole = z.infer<typeof userRoleEnumSchema>;

export const users = createTable("users", {
  id: integer("id").primaryKey().notNull(),
  firstName: text("first_name").notNull(),
  username: text("username"),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("USER"),
});

export const regions = createTable("regions", {
  id: text('id').$defaultFn(() => createId()).unique().primaryKey(),
  name: text("name").notNull(),
})

export const regionsRelations = relations(regions, ({ many }) => ({
  addresses: many(addresses),
}))


export const addressTypeEnum = pgEnum("address_type", ["ASSEMBLY", "DISASSEMBLY"]);
export const addressTypeEnumSchema = z.enum(addressTypeEnum.enumValues);
export type AddressType = z.infer<typeof addressTypeEnumSchema>;

export const addresses = createTable("addresses", {
  id: text('id').$defaultFn(() => createId()).unique().primaryKey(),
  name: text("name").notNull(),
  regionId: text("region_id").notNull(),
  type: addressTypeEnum("type").notNull().default("ASSEMBLY"),
})

export const addressesRelations = relations(addresses, ({ one }) => ({
  region: one(regions, {
    fields: [addresses.regionId],
    references: [regions.id],
  }),
}))
