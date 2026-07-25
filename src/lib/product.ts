/**
 * Product identity — the single source of the user-facing product name.
 *
 * Every surface that prints the product name to a user (browser title, error
 * footers, wordmark copy) reads this constant. Before it existed the string was
 * hand-typed in five places, and three of them still carried the pre-rebrand
 * name after the 2026-07-25 Kopi Studio rename — which is why it is a constant
 * now and not a string literal per callsite.
 *
 * NOT the package name — `package.json` stays `prospect-profiler`. This is the
 * user-facing brand only.
 */
export const PRODUCT_NAME = 'The Kopi Studio';
