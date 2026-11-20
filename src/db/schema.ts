import { relations } from 'drizzle-orm';
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const cars = pgTable('cars', {
  id: text('id').primaryKey(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  type: text('type').notNull(),
  archetype: text('archetype').notNull(),
  hp: integer('hp').notNull(),
  torque: integer('torque').notNull(),
  top: integer('top').notNull(),
  acc: text('acc').notNull(),
  engine: text('engine').notNull(),
  fuel: text('fuel').notNull(),
  price: text('price').notNull(),
  defaultColor: text('default_color').notNull(),
  image: text('image').notNull(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').notNull(),
});

export const garageFavorites = pgTable(
  'garage_favorites',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    carId: text('car_id')
      .references(() => cars.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('garage_favorites_user_car_idx').on(table.userId, table.carId),
  ],
);

export const studioBuilds = pgTable('studio_builds', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  carId: text('car_id')
    .references(() => cars.id, { onDelete: 'cascade' })
    .notNull(),
  buildName: text('build_name').notNull(),
  paintColor: text('paint_color').notNull(),
  finish: text('finish').notNull(),
  wheelStyle: text('wheel_style').notNull(),
  rideHeight: integer('ride_height').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  favorites: many(garageFavorites),
  studioBuilds: many(studioBuilds),
}));

export const carsRelations = relations(cars, ({ many }) => ({
  favoritedBy: many(garageFavorites),
  studioBuilds: many(studioBuilds),
}));

export const garageFavoritesRelations = relations(garageFavorites, ({ one }) => ({
  user: one(users, {
    fields: [garageFavorites.userId],
    references: [users.id],
  }),
  car: one(cars, {
    fields: [garageFavorites.carId],
    references: [cars.id],
  }),
}));

export const studioBuildsRelations = relations(studioBuilds, ({ one }) => ({
  user: one(users, {
    fields: [studioBuilds.userId],
    references: [users.id],
  }),
  car: one(cars, {
    fields: [studioBuilds.carId],
    references: [cars.id],
  }),
}));
