export interface PeopleAttributes {
  id: number;
  firstName: string;
  lastName: string;
  birthday: Date;
  yearMet: number;
  phoneNumber: string;
  email?: string;
  location?: string;
}

export type Profile = Omit<PeopleAttributes, "id">;
