import { and, asc, count, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { cars, garageFavorites, studioBuilds, users } from './schema.ts';
import { CARS } from '../data/cars.ts';

export interface StudioBuildRecord {
  id: number;
  carId: string;
  buildName: string;
  paintColor: string;
  finish: string;
  wheelStyle: string;
  rideHeight: number;
  createdAt: Date;
}

export interface CreateStudioBuildInput {
  carId: string;
  buildName: string;
  paintColor: string;
  finish: 'metallic' | 'matte';
  wheelStyle: 'normal' | 'sport' | 'luxury';
  rideHeight: number;
}

export async function ensureCarsSeeded(): Promise<void> {
  try {
    const [{ total }] = await db.select({ total: count() }).from(cars);
    if (total >= CARS.length) return;

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
        .onConflictDoNothing();
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

export async function getUserStudioBuilds(
  uid: string,
  email: string,
  displayName?: string | null,
): Promise<StudioBuildRecord[]> {
  try {
    const user = await getOrCreateUser(uid, email, displayName);
    return await db
      .select({
        id: studioBuilds.id,
        carId: studioBuilds.carId,
        buildName: studioBuilds.buildName,
        paintColor: studioBuilds.paintColor,
        finish: studioBuilds.finish,
        wheelStyle: studioBuilds.wheelStyle,
        rideHeight: studioBuilds.rideHeight,
        createdAt: studioBuilds.createdAt,
      })
      .from(studioBuilds)
      .where(eq(studioBuilds.userId, user.id))
      .orderBy(desc(studioBuilds.createdAt));
  } catch (error) {
    console.error('Database query failed (getUserStudioBuilds):', error);
    throw new Error('Unable to load saved 3D studio builds.', { cause: error });
  }
}

export async function createUserStudioBuild(
  uid: string,
  email: string,
  displayName: string | null | undefined,
  input: CreateStudioBuildInput,
): Promise<StudioBuildRecord> {
  try {
    await ensureCarsSeeded();
    const user = await getOrCreateUser(uid, email, displayName);

    const carExists = await db
      .select({ id: cars.id })
      .from(cars)
      .where(eq(cars.id, input.carId))
      .limit(1);

    if (carExists.length === 0) {
      throw new Error('Vehicle not found.');
    }

    const inserted = await db
      .insert(studioBuilds)
      .values({
        userId: user.id,
        carId: input.carId,
        buildName: input.buildName,
        paintColor: input.paintColor,
        finish: input.finish,
        wheelStyle: input.wheelStyle,
        rideHeight: input.rideHeight,
      })
      .returning({
        id: studioBuilds.id,
        carId: studioBuilds.carId,
        buildName: studioBuilds.buildName,
        paintColor: studioBuilds.paintColor,
        finish: studioBuilds.finish,
        wheelStyle: studioBuilds.wheelStyle,
        rideHeight: studioBuilds.rideHeight,
        createdAt: studioBuilds.createdAt,
      });

    return inserted[0];
  } catch (error) {
    console.error('Database insert failed (createUserStudioBuild):', error);
    throw new Error('Unable to save your 3D studio build.', { cause: error });
  }
}

export async function deleteUserStudioBuild(
  uid: string,
  email: string,
  displayName: string | null | undefined,
  buildId: number,
): Promise<void> {
  try {
    const user = await getOrCreateUser(uid, email, displayName);
    await db
      .delete(studioBuilds)
      .where(
        and(eq(studioBuilds.id, buildId), eq(studioBuilds.userId, user.id)),
      );
  } catch (error) {
    console.error('Database delete failed (deleteUserStudioBuild):', error);
    throw new Error('Unable to delete saved 3D build.', { cause: error });
  }
}
