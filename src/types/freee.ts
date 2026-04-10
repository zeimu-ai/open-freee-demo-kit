// freee REST API response types

export interface FreeeCompany {
  id: number;
  name: string;
  display_name: string;
}

export interface FreeeUser {
  id: number;
  email: string;
  display_name: string;
  companies: FreeeCompany[];
}

export interface FreeeTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: number; // Unix timestamp (ms)
  company_id?: number;
}

// Walletable (口座)
export type WalletableType = 'bank_account' | 'credit_card' | 'wallet' | 'other';

export interface WalletableData {
  type: WalletableType;
  name: string;
  bank_code?: string;
  bank_branch_code?: string;
  account_number?: string;
}

export interface FreeeWalletable {
  id: number;
  type: WalletableType;
  name: string;
  company_id: number;
}

// Deal (取引)
export interface DealDetail {
  account_item_id?: number;
  account_item_name?: string; // resolved to id at load time
  tax_code: number;
  amount: number;
  description?: string;
  entry_side?: 'credit' | 'debit';
}

export interface DealData {
  issue_date: string; // YYYY-MM-DD
  type: 'income' | 'expense';
  amount?: number;
  partner_name?: string;
  details: DealDetail[];
}

export interface FreeeDeal {
  id: number;
  company_id: number;
  issue_date: string;
  type: 'income' | 'expense';
  amount: number;
}

// ManualJournal (手動仕訳)
export interface ManualJournalDetail {
  entry_side: 'credit' | 'debit';
  account_item_id?: number;
  account_item_name?: string; // resolved to id at load time
  tax_code: number;
  amount: number;
  description?: string;
}

export interface ManualJournalData {
  issue_date: string;
  details: ManualJournalDetail[];
}

export interface FreeeManualJournal {
  id: number;
  company_id: number;
  issue_date: string;
}

// Receipt (証憑ファイル)
export interface ReceiptData {
  filename: string;
  mimeType: string;
  contentBase64: string;
  description?: string;
  document_type?: string;
  qualified_invoice?: string;
  receipt_metadatum_issue_date?: string;
  receipt_metadatum_amount?: number;
  receipt_metadatum_partner_name?: string;
}

export interface FreeeReceipt {
  id: number;
  company_id: number;
  description?: string;
}

// AccountItem (勘定科目)
export interface FreeeAccountItem {
  id: number;
  name: string;
  account_category: string;
}

// Tax
export interface FreeeTax {
  id: number;
  code: number;
  name: string;
}

// ErrorManifest (意図的なエラーの記述)
export interface ErrorManifestItem {
  rule: string;
  location: string;
  description: string;
  expected_fix: string;
}

// Preset
export interface PresetDefinition {
  name: string;
  description: string;
  version: string;
  expected: {
    walletables: number;
    deals: number;
    manualJournals: number;
    receipts?: number;
    plTotal?: number;
  };
  data: {
    walletables: WalletableData[];
    deals: DealData[];
    manualJournals: ManualJournalData[];
    receipts: ReceiptData[];
  };
  error_manifest?: ErrorManifestItem[];
}

// State
export interface PresetState {
  preset: string;
  loadedAt: string;
  walletableIds: number[];
  reusedWalletableIds?: number[];
  dealIds: number[];
  manualJournalIds: number[];
  receiptIds: number[];
}
