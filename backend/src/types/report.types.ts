export interface Report {
  id: bigint;
  word_id: bigint;
  user_id?: string | null; // uuid can be represented as string
  report_reason: string;
  report_details?: string | null;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected' | 'failed'; // Added more specific statuses
  created_at: string; // timestamp with time zone can be represented as string (ISO 8601)
  admin_notes?: string | null;
  ai_check?: boolean;
  admin_check?: boolean;
  processed_at?: string | null; // timestamp with time zone
}

// Optional: If you need a type for creating a new report (without id, created_at, and possibly status)
export type NewReport = Omit<Report, 'id' | 'created_at' | 'status' | 'ai_check' | 'admin_check'> & {
  status?: Report['status']; // Allow optional status override on creation
  ai_check?: boolean;
  admin_check?: boolean;
};