// Database Types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  invoice_count?: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  project_id?: string;
  original_filename: string;
  file_path?: string;
  file_type: string;
  file_size: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  page_count?: number;
  created_at: string;
  updated_at: string;
  projects?: Project;
  invoice_data?: InvoiceData[];
}

export interface InvoiceData {
  id: string;
  invoice_id: string;
  invoice_number: string;
  vendor_name: string;
  total_amount: number;
  subtotal?: number;
  tax_amount?: number;
  currency: string;
  invoice_date?: string;
  due_date?: string;
  customer_name?: string;
  customer_address?: string;
  vendor_address?: string;
  payment_terms?: string;
  raw_ocr_data: any;
  confidence_score: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  invoice_line_items?: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  invoice_data_id: string;
  item_number: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

export interface UsageResponse {
  success: boolean;
  remaining?: number;
  limit?: number;
  error?: string;
  upgrade_required?: boolean;
}

export interface OCRProcessingResponse {
  success: boolean;
  data?: {
    invoice_data_id: string;
    extracted: any;
    confidence_score: number;
    pages_processed: number;
    method?: string;
  };
  error?: string;
  details?: string;
  remaining?: number;
  limit?: number;
  upgrade_required?: boolean;
}

// Analysis Types
export interface ExpenseAnalysis {
  totalExpenses: number;
  totalInvoices: number;
  averageAmount: number;
  currency: string;
  monthlyData: MonthlyExpenseData[];
  topVendors: VendorExpense[];
  expensesByProject: ProjectExpense[];
  recentInvoices: Invoice[];
}

export interface MonthlyExpenseData {
  month: string;
  total: number;
  count: number;
}

export interface VendorExpense {
  vendor_name: string;
  total: number;
  count: number;
}

export interface ProjectExpense {
  project_name: string;
  total: number;
  count: number;
}

// Auth Types
export interface AuthUser {
  id: string;
  email: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  subscription_tier?: string;
  usage_count?: number;
  usage_limit?: number;
}

// Mobile-specific Types
export interface CameraResult {
  uri: string;
  type: string;
  fileName?: string;
}

export interface DocumentUploadProgress {
  invoiceId: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
}

// Navigation Types (for React Navigation)
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  Projects: undefined;
  ProjectDetail: { projectId: string };
  Documents: undefined;
  DocumentDetail: { invoiceId: string };
  Analysis: undefined;
  Settings: undefined;
  Camera: { projectId?: string };
  Profile: undefined;
};

// Form Types
export interface CreateProjectForm {
  name: string;
  description?: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}