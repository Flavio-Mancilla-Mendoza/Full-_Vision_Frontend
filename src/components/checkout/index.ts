// src/components/checkout/index.ts
export { StepIndicator } from "./StepIndicator";
export { ShippingForm } from "./ShippingForm";
export { PaymentMethodSelector } from "./PaymentMethodSelector";
export { OrderConfirmStep } from "./OrderConfirmStep";
export { OrderSidebar } from "./OrderSidebar";
export {
  type CheckoutStep,
  type DeliveryMethod,
  type PaymentMethodType,
  type ShippingInfo,
  INITIAL_SHIPPING_INFO,
  PAYMENT_METHOD_LABELS,
  validateShippingInfo,
} from "./types";
