import type { CarSpec } from '../data/cars';

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

export async function syncUserProfile(token: string): Promise<void> {
  const res = await fetch('/api/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  await parseJson<{ user: { id: number; uid: string; email: string } }>(res);
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
