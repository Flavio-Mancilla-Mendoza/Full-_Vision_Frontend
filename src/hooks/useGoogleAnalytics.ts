import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    gtag?: (command: string, targetId: string | Date, config?: Record<string, unknown>) => void;
  }
}

export const useGoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page views on route changes
    if (typeof window.gtag !== "undefined") {
      window.gtag("config", "G-XP6HD9CRTD", {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  // Function to track custom events
  const trackEvent = (eventName: string, eventParams?: Record<string, unknown>) => {
    if (typeof window.gtag !== "undefined") {
      window.gtag("event", eventName, eventParams);
    }
  };

  // Track ecommerce events
  const trackPurchase = (transactionData: {
    transaction_id: string;
    value: number;
    currency?: string;
    items: Array<{
      item_id: string;
      item_name: string;
      price: number;
      quantity: number;
    }>;
  }) => {
    if (typeof window.gtag !== "undefined") {
      window.gtag("event", "purchase", {
        ...transactionData,
        currency: transactionData.currency || "PEN",
      });
    }
  };

  const trackAddToCart = (item: { item_id: string; item_name: string; price: number; quantity: number }) => {
    if (typeof window.gtag !== "undefined") {
      window.gtag("event", "add_to_cart", {
        currency: "PEN",
        value: item.price * item.quantity,
        items: [item],
      });
    }
  };

  const trackViewItem = (item: { item_id: string; item_name: string; price: number }) => {
    if (typeof window.gtag !== "undefined") {
      window.gtag("event", "view_item", {
        currency: "PEN",
        value: item.price,
        items: [item],
      });
    }
  };

  const trackBeginCheckout = (
    items: Array<{
      item_id: string;
      item_name: string;
      price: number;
      quantity: number;
    }>,
    totalValue: number
  ) => {
    if (typeof window.gtag !== "undefined") {
      window.gtag("event", "begin_checkout", {
        currency: "PEN",
        value: totalValue,
        items,
      });
    }
  };

  return {
    trackEvent,
    trackPurchase,
    trackAddToCart,
    trackViewItem,
    trackBeginCheckout,
  };
};
