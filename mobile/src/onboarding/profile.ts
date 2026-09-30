export type ProfileRole = 'CUSTOMER' | 'WORKER';
export type ProfileData = {
  fullName: string;
  customerType: string;
  companyName: string;
  workerType: string;
  profilePhotoUrl: string;
  tradeId: string | null;
  skillIds: string[];
  experienceYears: number | null;
  state: string;
  district: string;
  city: string;
  postalCode: string;
  availability: string;
  teamName: string;
  teamSize: number | null;
};
export type Draft = {
  role: ProfileRole | null;
  state: string;
  step: number;
  data: Partial<ProfileData>;
};
export type Catalogue = {
  customerTypes: { code: string; name: string }[];
  trades: {
    id: string;
    code: string;
    name: string;
    skills: { id: string; name: string }[];
  }[];
};
export const emptyProfile: ProfileData = {
  fullName: '',
  customerType: '',
  companyName: '',
  workerType: '',
  profilePhotoUrl: '',
  tradeId: null,
  skillIds: [],
  experienceYears: null,
  state: '',
  district: '',
  city: '',
  postalCode: '',
  availability: '',
  teamName: '',
  teamSize: null,
};
export function hydrateProfile(value: Partial<ProfileData>): ProfileData {
  const data = { ...emptyProfile };
  for (const key of Object.keys(data) as (keyof ProfileData)[])
    if (value[key] !== null && value[key] !== undefined)
      Object.assign(data, { [key]: value[key] });
  return data;
}
export function validateStep(
  data: ProfileData,
  role: ProfileRole,
  step: number,
): string | null {
  if (step >= 1) {
    if (!data.fullName.trim() || data.fullName.length > 120)
      return 'Enter your full name (up to 120 characters).';
    if (role === 'CUSTOMER' && !data.customerType)
      return 'Choose your customer type.';
    if (role === 'WORKER') {
      if (!['INDIVIDUAL', 'TEAM'].includes(data.workerType))
        return 'Choose individual or team.';
      if (
        data.workerType === 'TEAM' &&
        (!data.teamName.trim() ||
          !Number.isInteger(data.teamSize) ||
          data.teamSize! < 2 ||
          data.teamSize! > 1000)
      )
        return 'Enter your team name and a team size between 2 and 1000.';
      if (
        data.profilePhotoUrl &&
        !/^https:\/\/[^/\s]+\/.+/.test(data.profilePhotoUrl)
      )
        return 'Enter a valid HTTPS photo link, or leave it blank.';
    }
  }
  if (
    role === 'WORKER' &&
    step >= 2 &&
    (!data.tradeId ||
      !data.skillIds.length ||
      !Number.isInteger(data.experienceYears) ||
      data.experienceYears! < 0 ||
      data.experienceYears! > 80)
  )
    return 'Select your trade, at least one skill, and experience from 0 to 80 years.';
  if (step >= (role === 'CUSTOMER' ? 2 : 3)) {
    if (
      !data.state.trim() ||
      !data.district.trim() ||
      !data.city.trim() ||
      !/^[1-9][0-9]{5}$/.test(data.postalCode)
    )
      return 'Enter state code, district, city, and a six-digit postal code.';
    if (
      role === 'WORKER' &&
      !['AVAILABLE', 'BUSY', 'UNAVAILABLE'].includes(data.availability)
    )
      return 'Choose your availability.';
  }
  return null;
}
