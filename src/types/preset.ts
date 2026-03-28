export interface Preset {
  name: string;
  description: string;
  category: 'accounting' | 'invoices' | 'expenses' | 'hr' | 'advanced';
  version: string;
  resources: PresetResource[];
}

export interface PresetResource {
  type: 'deals' | 'manual_journals' | 'walletables' | 'account_items' | 'partners';
  file: string;
  count: number;
}

export type PresetCategory = 'accounting' | 'invoices' | 'expenses' | 'hr' | 'advanced';
