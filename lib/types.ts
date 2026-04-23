// ============================================================
// TYPES
// ============================================================

export interface ServiceLevel {
  id: string;
  item_id: string;
  name: string;
  label: string;
  price_per_unit: number;
  is_active: boolean;
  display_order: number;
}

export interface ServiceItem {
  id: string;
  category_id: string;
  name: string;
  unit_type: "item" | "room" | "sqft";
  is_checkbox: boolean;
  min_quantity: number;
  max_quantity: number;
  is_active: boolean;
  display_order: number;
  levels: ServiceLevel[];
}

export interface ServiceCategory {
  id: string;
  name: string;
  is_active: boolean;
  display_order: number;
  items: ServiceItem[];
}

export interface Special {
  id: string;
  title: string;
  description: string | null;
  badge_text: string;
  promo_code: string | null;
  is_active: boolean;
  display_order: number;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order: number;
  is_active: boolean;
  expires_at: string | null;
  usage_count: number;
}

// Quote builder state
export interface SelectedService {
  category_id: string;
  category_name: string;
  item_id: string;
  item_name: string;
  quantity: number;
  level_id: string;
  level_name: string;
  price_per_unit: number;
  subtotal: number;
  is_checkbox: boolean;
}

export interface QuoteState {
  selected: SelectedService[];
  promo_code: string;
  applied_promo: PromoCode | null;
  subtotal: number;
  discount_amount: number;
  total: number;
}

// Booking
export interface BookingFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  zip_code: string;
  service_address: string;
  preferred_date: string;
  preferred_time: string;
  notes: string;
}

export interface Booking {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  zip_code: string | null;
  service_address: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  selected_services: SelectedService[];
  subtotal: number;
  discount_amount: number;
  promo_code_used: string | null;
  total: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  payment_method: "stripe" | "cash" | "card";
  payment_status: "paid" | "unpaid" | "pending";
  stripe_payment_intent_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Multi-step form
export type QuoteStep = "services" | "scheduling" | "contact" | "review";
