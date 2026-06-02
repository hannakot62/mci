import React, { useMemo, useState } from 'react';
import { FreeMode, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { deliver, dispatch, type PackagingTreeNode, type TransportDetail } from '../api/client';
import 'swiper/css';
import 'swiper/css/navigation';
import {
  buildProductPaletteMap,
  collectMciProductSkus,
  MCI_STATUS_COLORS,
  resolveProductSkuInSubtree,
  shortSku,
  type MciProductPalette,
} from './mciGraphTheme';

interface ActionBarProps {
  transport: TransportDetail | null;
  onUpdated: () => void;
}

export type MciChipData = {
  id: string;
  status: string;
  route: string;
  kind: 'packaging' | 'goods';
  title: string;
  productSku: string;
  palette: MciProductPalette;
};

function collectMciChips(
  nodes: PackagingTreeNode[],
  paletteMap: Map<string, MciProductPalette>
): MciChipData[] {
  return nodes.flatMap((n) => {
    const packaging: MciChipData[] = n.isMci
      ? [
          {
            id: n.id,
            status: n.status,
            route: `${n.firstLocation.code} → ${n.lastLocation.code}`,
            kind: 'packaging',
            title: n.packagingType.name,
            productSku: resolveProductSkuInSubtree(n),
            palette: paletteMap.get(resolveProductSkuInSubtree(n)) ?? MCI_FALLBACK_PALETTE,
          },
        ]
      : [];

    const goods: MciChipData[] = n.goods
      .filter((g) => g.isMci)
      .map((g) => ({
        id: g.id,
        status: g.status,
        route: `${g.firstLocation.code} → ${g.lastLocation.code}`,
        kind: 'goods' as const,
        title: shortSku(g.product.sku),
        productSku: g.product.sku,
        palette: paletteMap.get(g.product.sku) ?? MCI_FALLBACK_PALETTE,
      }));

    return [...packaging, ...goods, ...collectMciChips(n.children, paletteMap)];
  });
}

const MCI_FALLBACK_PALETTE = {
  accent: '#fbbf24',
  soft: 'rgba(251, 191, 36, 0.35)',
  label: 'default',
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

function MciChip({ mci }: { mci: MciChipData }): React.ReactElement {
  const statusColor = MCI_STATUS_COLORS[mci.status] ?? '#94a3b8';

  return (
    <article
      className={`mci-chip mci-chip--${mci.status.replace(/[^a-z0-9_-]/gi, '_')}`}
      style={
        {
          '--chip-accent': mci.palette.accent,
          '--chip-soft': mci.palette.soft,
          '--chip-status': statusColor,
        } as React.CSSProperties
      }
      title={`${mci.title} · ${mci.route}`}
    >
      <div className="mci-chip__row mci-chip__row--meta">
        <span className="mci-chip__tag">MCI</span>
        <span className="mci-chip__kind">{mci.kind === 'goods' ? 'goods' : 'packaging'}</span>
      </div>
      <div className="mci-chip__row mci-chip__title">{mci.title.toUpperCase()}</div>
      <div className="mci-chip__row mci-chip__route">{mci.route}</div>
      <div className="mci-chip__row">
        <span className="mci-chip__status">{formatStatus(mci.status)}</span>
      </div>
    </article>
  );
}

export function ActionBar({ transport, onUpdated }: ActionBarProps): React.ReactElement | null {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mcis = useMemo(() => {
    if (!transport) return [];
    const paletteMap = buildProductPaletteMap(collectMciProductSkus(transport.packagingTree));
    return collectMciChips(transport.packagingTree, paletteMap);
  }, [transport]);

  if (!transport) return null;

  const allDelivered = mcis.length > 0 && mcis.every((m) => m.status === 'delivered');
  const anyInTransit = mcis.some((m) => m.status === 'in_transit');

  const runAction = async (action: 'dispatch' | 'deliver'): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      if (action === 'dispatch') {
        await dispatch(transport.id);
      } else {
        await deliver(transport.id);
      }
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="action-bar">
      <div className="action-bar__slider-wrap">
        <span className="action-bar__slider-label">MCI</span>
        {mcis.length === 0 ? (
          <p className="action-bar__empty">No MCI found — check routes in subtrees</p>
        ) : (
          <Swiper
            className="action-bar__swiper"
            modules={[Navigation, FreeMode]}
            spaceBetween={8}
            slidesPerView="auto"
            freeMode={{ enabled: true, sticky: false }}
            navigation
            watchOverflow
            grabCursor
            observer
            observeParents
            aria-label="MCI units"
          >
            {mcis.map((mci) => (
              <SwiperSlide key={mci.id} className="action-bar__slide">
                <MciChip mci={mci} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>

      <div className="action-bar__actions">
        <button
          type="button"
          disabled={loading || mcis.length === 0 || allDelivered || anyInTransit}
          onClick={() => void runAction('dispatch')}
        >
          Dispatch all
        </button>
        <button
          type="button"
          disabled={loading || mcis.length === 0 || allDelivered || !anyInTransit}
          onClick={() => void runAction('deliver')}
        >
          Deliver all
        </button>
        {error && <span className="error-text action-bar__error">{error}</span>}
      </div>
    </header>
  );
}
