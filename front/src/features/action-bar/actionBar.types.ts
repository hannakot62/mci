import type { MciProductPalette } from '@/features/mci/mciGraphTheme';

export type MciChipData = {
  id: string;
  status: string;
  route: string;
  kind: 'packaging' | 'goods';
  title: string;
  productSku: string;
  palette: MciProductPalette;
};
