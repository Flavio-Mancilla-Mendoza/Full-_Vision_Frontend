// src/components/orders/WhatsAppLensUpsell.tsx
// Pure UI component: post-purchase CTA for lens upsell via WhatsApp.
// All business logic (config, visibility rules, URL building) lives in useWhatsAppUpsell hook.
// Config (phone, texts, allowed categories) comes from backend via site_content table.
import { MessageCircle, Glasses } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useWhatsAppUpsell,
  buildWhatsAppUrl,
  shouldShowUpsell,
} from "@/hooks/useWhatsAppUpsell";

interface WhatsAppLensUpsellProps {
  orderNumber?: string;
  /** Product names from the order — used in the WhatsApp message */
  productNames?: string[];
  /** Category slugs of products in the order — used to decide visibility */
  orderCategorySlugs?: (string | null | undefined)[];
  className?: string;
}

/**
 * Renders a CTA card inviting the customer to contact an advisor via WhatsApp
 * to purchase prescription lenses for their frame.
 *
 * Configuration (phone, texts, allowed categories) comes from the backend
 * via `site_content` table, section `whatsapp_upsell`.
 */
export default function WhatsAppLensUpsell({
  orderNumber,
  productNames = [],
  orderCategorySlugs = [],
  className = "",
}: WhatsAppLensUpsellProps) {
  const { config, loading } = useWhatsAppUpsell();

  // Don't render while loading config or if feature is disabled
  if (loading || !config.enabled) return null;

  // Only show when the order contains frame-related products
  const hasFrameProducts = shouldShowUpsell(config.categorySlugs, orderCategorySlugs);
  if (!hasFrameProducts) return null;

  const whatsappUrl = buildWhatsAppUrl(
    config.phoneNumber,
    config.messageTemplate,
    orderNumber,
    productNames
  );

  return (
    <Card
      className={`border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden ${className}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Glasses className="w-6 h-6 text-green-700" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-lg text-green-900">
                {config.title}
              </h3>
              <p className="text-sm text-green-800 mt-1">
                {config.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                asChild
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  {config.buttonText}
                </a>
              </Button>
            </div>

            <p className="text-xs text-green-700/70">
              {config.responseTimeText}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
