/** In-memory ring buffer for timing metrics */
export const TIMINGS_MAX_ENTRIES = 100;

/** POST /api/setup — goods volume per product group */
export const SETUP_MIN_GOODS_COUNT = 1;
export const SETUP_MAX_GOODS_COUNT = 50_000;

/** Top-level packaging trees per product group */
export const SETUP_MAX_ROOT_PACKAGING_COUNT = 5_000;

/** Child packaging units per parent at each nesting level */
export const SETUP_MAX_NESTING_CHILD_COUNT = 100;

/** Nesting depth levels below each root */
export const SETUP_MAX_NESTING_LEVELS = 30;

/** Max packaging nodes per transport (roots + all nested children) */
export const SETUP_MAX_PACKAGING_UNITS = 10_000;

/**
 * SQLite bind-parameter budget (~999). Goods rows use 4 fields → keep batches small.
 */
export const SETUP_GOODS_INSERT_BATCH_SIZE = 140;

/**
 * Packaging rows use 9 bound fields in raw bulk insert.
 */
export const SETUP_PACKAGING_INSERT_BATCH_SIZE = 100;

/** Bulk updateMany `IN (...)` batches for MCI marking */
export const MCI_MARK_BATCH_SIZE = 500;

/**
 * GET /api/transport/:id — return full goods payloads only below this total.
 * Above: nodes expose `goodsCount`, optional `goodsPreview`, tree stays responsive.
 */
export const TRANSPORT_TREE_INLINE_GOODS_MAX = 1_000;

/** Max goods returned per packaging node when the tree is in preview mode */
export const TRANSPORT_TREE_GOODS_PREVIEW_PER_NODE = 24;
