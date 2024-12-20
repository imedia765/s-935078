import type { Functions } from './functions';
import type { Tables } from './tables.types';
import type { Views, CompositeTypes } from './other';
import type { Enums } from './enums';
import type { Json } from './json';

export type Database = {
  public: {
    Tables: Tables
    Views: Views
    Functions: Functions
    Enums: Enums
    CompositeTypes: CompositeTypes
  }
}

export type { Json, Functions, Tables, Enums };