/**
 * Utility types to enhance TypeScript functionality
 */

/**
 * Makes specified properties of T required
 */
type RequiredProps<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Makes specified properties of T optional
 */
type OptionalProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extracts the type from a Promise
 */
type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Makes all properties of T nullable
 */
type Nullable<T> = { [P in keyof T]: T[P] | null };

/**
 * Makes all properties of T deeply readonly
 */
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends Record<string, any> 
    ? DeepReadonly<T[P]> 
    : T[P] extends Array<infer U>
      ? ReadonlyArray<DeepReadonly<U>>
      : T[P];
};

/**
 * Extracts non-function properties from T
 */
type DataProperties<T> = {
  [P in keyof T]: T[P] extends Function ? never : P;
}[keyof T];

/**
 * Extracts only the properties with specific value type
 */
type PropertiesOfType<T, ValueType> = {
  [P in keyof T]: T[P] extends ValueType ? P : never;
}[keyof T];

/**
 * Creates a type with only properties that match specific value type
 */
type FilteredProps<T, ValueType> = Pick<T, PropertiesOfType<T, ValueType>>;

/**
 * Creates a dictionary type with specific value type
 */
type Dictionary<T> = { [key: string]: T };

/**
 * Creates a type that requires at least one property from K of T
 */
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> 
  & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys];

/**
 * Creates a type that allows only one property from K of T
 */
type RequireOnlyOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> 
  & {
    [K in Keys]: Required<Pick<T, K>> & { 
      [P in Exclude<Keys, K>]?: never
    }
  }[Keys];

/**
 * Converts string literal types to string enums
 */
type StringEnum<T extends string> = { [K in T]: K };

/**
 * Creates a type for a record of a specific type indexed by ID
 */
type RecordById<T extends { id: string | number }> = {
  [key: string]: T;
};

/**
 * Makes specified function parameters optional
 */
type PartialParameters<T extends (...args: any) => any, K extends number = never> =
  T extends (...args: infer P) => infer R
    ? (...args: { [I in keyof P]: I extends K ? P[I] | undefined : P[I] }) => R
    : never;

/**
 * Makes all properties in T mutable (removes readonly)
 */
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// Extend global namespace with utility types
declare global {
  interface Window {
    __APP_VERSION__: string;
    __STRIPE_PUBLIC_KEY__: string;
    __GOOGLE_MAPS_API_KEY__: string;
  }

  // Export all utility types to global namespace
  export {
    RequiredProps,
    OptionalProps,
    Awaited,
    Nullable,
    DeepReadonly,
    DataProperties,
    PropertiesOfType,
    FilteredProps,
    Dictionary,
    RequireAtLeastOne,
    RequireOnlyOne,
    StringEnum,
    RecordById,
    PartialParameters,
    Mutable
  }
}

// Make this a module
export {};