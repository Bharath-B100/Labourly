import data from './india-cities.json';

export const indiaStates = data.states;
export function citiesForState(stateCode: string) {
  return data.cities.filter((city) => city.stateCode === stateCode);
}
