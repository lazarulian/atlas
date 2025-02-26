export interface PeopleAttributes {
  id: number;
  name: string;
  active: boolean;
  birthday: Date;
  yearMet: number;
  phoneNumber: string;
  email?: string;
  location?: string[];
  affiliation?: string[];
  lastContacted: Date;
  contactFrequency: number;
  chatReminder: number;
}

export type Profile = Omit<PeopleAttributes, "id">;
