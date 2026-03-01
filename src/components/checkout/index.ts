// src/components/checkout/index.ts
export { StepIndicator } from "./StepIndicator";
export { ShippingForm } from "./ShippingForm";
export { OrderConfirmStep } from "./OrderConfirmStep";
export { OrderSidebar } from "./OrderSidebar";
export {
  type CheckoutStep,
  type DeliveryMethod,
  type PaymentMethodType,
  type ShippingInfo,
  INITIAL_SHIPPING_INFO,
  validateShippingInfo,
} from "./types";
