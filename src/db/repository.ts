import { and, asc, count, desc, eq, like, notLike, or, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { cars, garageFavorites, users } from './schema.ts';
import { CARS } from '../data/cars.ts';

export async function ensureCarsSeeded(): Promise<void> {
  try {
    const [{ total }] = await db.select({ total: count() }).from(cars);
    const stalePrice = await db
      .select({ id: cars.id })
      .from(cars)
      .where(or(notLike(cars.price, '$%'), like(cars.price, 'Approx.%')))
      .limit(1);

    if (total >= CARS.length && stalePrice.length === 0) return;

    const rows = CARS.map((car, idx) => ({
      id: car.id,
      brand: car.brand,
      model: car.model,
      year: car.year,
      type: car.type,
      archetype: car.archetype,
      hp: car.hp,
      torque: car.torque,
      top: car.top,
      acc: car.acc,
      engine: car.engine,
      fuel: car.fuel,
      price: car.price,
      defaultColor: car.defaultColor,
      image: car.image,
      description: car.description,
      sortOrder: idx,
    }));

    const CHUNK_SIZE = 200;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      await db
        .insert(cars)
        .values(rows.slice(i, i + CHUNK_SIZE))
        .onConflictDoUpdate({
          target: cars.id,
          set: {
            price: sql`excluded.price`,
            sortOrder: sql`excluded.sort_order`,
          },
        });
    }
  } catch (error) {
    console.error('Database seed failed:', error);
    throw new Error('Failed to initialize vehicle catalog.', { cause: error });
  }
}

export async function getAllCatalogCars() {
  try {
    await ensureCarsSeeded();
    return await db.select().from(cars).orderBy(asc(cars.sortOrder));
  } catch (error) {
    console.error('Database query failed (getAllCatalogCars):', error);
    throw new Error('Unable to load vehicle catalog right now.', { cause: error });
  }
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string | null,
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName ?? null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName ?? null,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database upsert failed (getOrCreateUser):', error);
    throw new Error('Unable to sync user profile.', { cause: error });
  }
}

export async function getUserFavoriteCarIds(
  uid: string,
  email: string,
  displayName?: string | null,
): Promise<string[]> {
  try {
    const user = await getOrCreateUser(uid, email, displayName);
    const rows = await db
      .select({ carId: garageFavorites.carId })
      .from(garageFavorites)
      .where(eq(garageFavorites.userId, user.id))
      .orderBy(desc(garageFavorites.createdAt));

    return rows.map((r) => r.carId);
  } catch (error) {
    console.error('Database query failed (getUserFavoriteCarIds):', error);
    throw new Error('Unable to load saved garage vehicles.', { cause: error });
  }
}

export async function addUserFavorite(
  uid: string,
  email: string,
  displayName: string | null | undefined,
  carId: string,
): Promise<string[]> {
  try {
    await ensureCarsSeeded();
    const user = await getOrCreateUser(uid, email, displayName);

    const carExists = await db
      .select({ id: cars.id })
      .from(cars)
      .where(eq(cars.id, carId))
      .limit(1);

    if (carExists.length === 0) {
      throw new Error('Vehicle not found.');
    }

    await db
      .insert(garageFavorites)
      .values({
        userId: user.id,
        carId,
      })
      .onConflictDoNothing();

    return await getUserFavoriteCarIds(uid, email, displayName);
  } catch (error) {
    console.error('Database insert failed (addUserFavorite):', error);
    throw new Error('Unable to save vehicle to your garage.', { cause: error });
  }
}

export async function removeUserFavorite(
  uid: string,
  email: string,
  displayName: string | null | undefined,
  carId: string,
): Promise<string[]> {
  try {
    const user = await getOrCreateUser(uid, email, displayName);
    await db
      .delete(garageFavorites)
      .where(
        and(
          eq(garageFavorites.userId, user.id),
          eq(garageFavorites.carId, carId),
        ),
      );

    return await getUserFavoriteCarIds(uid, email, displayName);
  } catch (error) {
    console.error('Database delete failed (removeUserFavorite):', error);
    throw new Error('Unable to remove vehicle from your garage.', {
      cause: error,
    });
  }
}
