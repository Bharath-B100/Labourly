import { apiJson, apiFetch } from './client';

export interface WorkerCard {
  id: string;
  name: string;
  profilePhotoUrl?: string;
  workerType: string;
  trade: string;
  skills: string[];
  experienceYears: number;
  teamSize?: number;
  availability: string;
  district: string;
  city: string;
  state: string;
  verificationStatus: string;
}

export interface MatchReason {
  type: string;
  explanation: string;
}

export interface MatchedWorker {
  worker: WorkerCard;
  reasons: MatchReason[];
  score: number;
}

export interface RequirementView {
  id: string;
  title: string;
  description: string;
  trade: string;
  skills: string[];
  workerCount: number;
  startsAt: string;
  endsAt: string;
  city: string;
  district: string;
  state: string;
  status: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface Skill {
  id: string;
  name: string;
}

export interface Trade {
  id: string;
  code: string;
  name: string;
  skills: Skill[];
}

export interface RequirementFormPayload {
  title: string;
  description: string;
  tradeId: string;
  skillIds: string[];
  workerCount: number;
  startsAt: string;
  endsAt: string;
  city: string;
  district: string;
  stateCode: string;
  lat: number;
  lng: number;
  locationSource: 'GPS' | 'CITY_CENTRE';
  locationStateId: string | null;
  locationCityId: string | null;
}

export async function searchWorkers(params: {
  tradeId?: string;
  availability?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  cityId?: string;
  page?: number;
  size?: number;
}): Promise<Paginated<WorkerCard>> {
  const query = new URLSearchParams();
  if (params.cityId) query.append('cityId', params.cityId);
  if (params.tradeId) query.append('tradeId', params.tradeId);
  if (params.availability) query.append('availability', params.availability);
  if (params.lat !== undefined) query.append('lat', String(params.lat));
  if (params.lng !== undefined) query.append('lng', String(params.lng));
  if (params.radiusKm !== undefined)
    query.append('radiusKm', String(params.radiusKm));
  if (params.page !== undefined) query.append('page', String(params.page));
  if (params.size !== undefined) query.append('size', String(params.size));

  return apiJson<Paginated<WorkerCard>>(
    `/api/v1/marketplace/workers?${query.toString()}`,
  );
}

export async function getWorkerDetails(id: string): Promise<WorkerCard> {
  return apiJson<WorkerCard>(`/api/v1/marketplace/workers/${id}`);
}

export async function getSavedWorkerIds(page = 0): Promise<string[]> {
  return apiJson<string[]>(`/api/v1/saved-workers?page=${page}`);
}

export async function getTrades(): Promise<Trade[]> {
  const data = await apiJson<{ trades: Trade[] }>(
    '/api/v1/onboarding/catalogue',
  );
  return data.trades;
}

export async function postRequirement(
  payload: RequirementFormPayload,
): Promise<{ requirementId: string }> {
  return apiJson<{ requirementId: string }>('/api/v1/requirements', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMyRequirements(
  page = 0,
  size = 20,
): Promise<Paginated<RequirementView>> {
  return apiJson<Paginated<RequirementView>>(
    `/api/v1/requirements/me?page=${page}&size=${size}`,
  );
}

export async function getRequirement(id: string): Promise<RequirementView> {
  return apiJson<RequirementView>(`/api/v1/requirements/${id}`);
}

export async function getRequirementMatches(
  requirementId: string,
): Promise<MatchedWorker[]> {
  return apiJson<MatchedWorker[]>(
    `/api/v1/requirements/${requirementId}/matches`,
  );
}

export async function updateRequirementStatus(
  requirementId: string,
  status: string,
): Promise<void> {
  await apiFetch(
    `/api/v1/requirements/${requirementId}/status?status=${encodeURIComponent(status)}`,
    {
      method: 'PATCH',
    },
  );
}

export async function getOpportunities(
  page = 0,
  size = 20,
): Promise<Paginated<RequirementView>> {
  return apiJson<Paginated<RequirementView>>(
    `/api/v1/marketplace/opportunities?page=${page}&size=${size}`,
  );
}

export async function updateWorkerAvailability(
  availability: string,
): Promise<void> {
  await apiFetch(
    `/api/v1/marketplace/workers/me/availability?availability=${encodeURIComponent(availability)}`,
    {
      method: 'PATCH',
    },
  );
}
