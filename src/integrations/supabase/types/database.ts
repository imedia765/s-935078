import { Json } from './json';
import { Tables, TablesInsert, TablesUpdate } from './tables';
import { Enums } from './enums';
import { Functions } from './functions';
import { Views, CompositeTypes } from './other';

export type Database = {
  public: {
    Tables: Tables
    Views: Views
    Functions: Functions
    Enums: Enums
    CompositeTypes: CompositeTypes
  }
}

export type { Json, Tables, TablesInsert, TablesUpdate, Enums };