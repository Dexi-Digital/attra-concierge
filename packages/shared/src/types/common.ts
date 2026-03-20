export type Identifier = string;
export type ISODateTimeString = string;
export type Nullable<T> = T | null;

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, string | number | boolean | null>;
}
