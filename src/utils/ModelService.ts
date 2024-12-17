import { PeopleAttributes } from "../types/models/PeopleInterface";

export function createPerson(
  overrides: Partial<PeopleAttributes> = {}
): PeopleAttributes {
  const defaults: PeopleAttributes = {
    id: 1,
    name: "Default Person",
    active: true,
    birthday: new Date("2000-01-01"),
    yearMet: 2002,
    phoneNumber: "000-000-0000",
    email: "sample@gmail.com",
    location: ["default"],
    affiliation: ["default"],
    lastContacted: new Date(),
    contactFrequency: 30,
    chatReminder: 1,
  };

  return { ...defaults, ...overrides };
}
