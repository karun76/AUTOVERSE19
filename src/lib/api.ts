import type { CarSpec } from '../data/cars';
import type { FinishType, WheelStyle } from '../three/CarModelBuilder';

export interface SavedStudioBuild {
  id: number;
  carId: string;
  buildName: string;
  paintColor: string;
  finish: FinishType;
  wheelStyle: WheelStyle;
  rideHeight: number;
  createdAt: string;
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : 'Request failed. Please try again.';
    throw new Error(message);
  }
  return data as T;
}

export async function fetchCatalogCars(): Promise<CarSpec[]> {
  const res = await fetch('/api/cars');
  const data = await parseJson<{ cars: CarSpec[] }>(res);
  return data.cars;
}

export async function fetchGarageFavorites(token: string): Promise<string[]> {
  const res = await fetch('/api/garage', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJson<{ carIds: string[] }>(res);
  return data.carIds;
}

export async function saveGarageFavorite(
  token: string,
  carId: string,
): Promise<string[]> {
  const res = await fetch('/api/garage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ carId }),
  });
  const data = await parseJson<{ carIds: string[] }>(res);
  return data.carIds;
}

export async function deleteGarageFavorite(
  token: string,
  carId: string,
): Promise<string[]> {
  const res = await fetch(`/api/garage/${encodeURIComponent(carId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJson<{ carIds: string[] }>(res);
  return data.carIds;
}

export async function fetchStudioBuilds(
  token: string,
): Promise<SavedStudioBuild[]> {
  const res = await fetch('/api/studio-builds', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJson<{ builds: SavedStudioBuild[] }>(res);
  return data.builds;
}

export async function createStudioBuild(
  token: string,
  payload: {
    carId: string;
    buildName: string;
    paintColor: string;
    finish: FinishType;
    wheelStyle: WheelStyle;
    rideHeight: number;
  },
): Promise<SavedStudioBuild> {
  const res = await fetch('/api/studio-builds', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJson<{ build: SavedStudioBuild }>(res);
  return data.build;
}

export async function removeStudioBuild(
  token: string,
  buildId: number,
): Promise<void> {
  const res = await fetch(`/api/studio-builds/${buildId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  await parseJson<{ deletedId: number }>(res);
}
