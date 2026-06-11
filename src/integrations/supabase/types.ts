/* eslint-disable @typescript-eslint/no-explicit-any */
//
// Placeholder Supabase `Database` type for the EMPTY BASE.
//
// The real project ships a generated type here. Regenerate it for YOUR project:
//   npm run db:types     (writes supabase/remote_types.ts via `supabase gen types`)
// then replace the `Database` export below with the generated one (or re-point
// this file at it).
//
// Until then this permissive shape lets every `supabase.from(<table>)` and
// `supabase.rpc(<fn>)` call in the foundation (AuthContext, chrome hooks,
// lib/supabase/typed-client) type-check against arbitrary table/function names.
// It deliberately types rows as `any` — replace it with real generated types
// before relying on column-level type safety.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type LooseTable = {
  Row: { [column: string]: any };
  Insert: { [column: string]: any };
  Update: { [column: string]: any };
  Relationships: [];
};

type LooseFunction = {
  Args: { [arg: string]: any };
  Returns: any;
};

export type Database = {
  public: {
    Tables: { [table: string]: LooseTable };
    Views: { [view: string]: LooseTable };
    Functions: { [fn: string]: LooseFunction };
    Enums: { [name: string]: string };
    CompositeTypes: { [name: string]: { [field: string]: any } };
  };
};
