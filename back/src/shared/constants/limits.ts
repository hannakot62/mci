/** In-memory ring buffer for timing metrics */
export const TIMINGS_MAX_ENTRIES = 100;

/** POST /api/setup — packaging depth */
export const SETUP_DEFAULT_PACKING_DEPTH = 2;
export const SETUP_MIN_PACKING_DEPTH = 1;
export const SETUP_MAX_PACKING_DEPTH = 20;

/** POST /api/setup — goods volume */
export const SETUP_MIN_GOODS_COUNT = 1;
export const SETUP_MAX_GOODS_COUNT = 50_000;

/**
 * SQLite bind-parameter budget (~999). Goods rows use 4 fields → keep batches small.
 */
export const SETUP_GOODS_INSERT_BATCH_SIZE = 200;

/**
 * GET /api/transport/:id — return full goods payloads only below this total.
 * Above: nodes expose `goodsCount`, optional `goodsPreview`, tree stays responsive.
 */
export const TRANSPORT_TREE_INLINE_GOODS_MAX = 1_000;

/** Max goods returned per packaging node when the tree is in preview mode */
export const TRANSPORT_TREE_GOODS_PREVIEW_PER_NODE = 24;
