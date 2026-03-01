// src/components/admin/SiteContentManager.tsx
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import { useSiteContentAdmin } from "@/hooks/useSiteContentAdmin";
import { ContentItemList } from "./site-content";

const SiteContentManager = () => {
  const {
    content,
    loading,
    uploading,
    editing,
    setEditing,
    loadContent,
    handleImageUpload,
    handleContentUpdate,
    toggleActiveStatus,
    getContentBySection,
  } = useSiteContentAdmin();

  /** Props compartidas que se pasan a cada ContentItemList */
  const listProps = {
    editing,
    uploading,
    onEdit: setEditing,
    onUpload: handleImageUpload,
    onUpdate: handleContentUpdate,
    onToggleActive: toggleActiveStatus,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Gestión de Contenido del Sitio</h2>
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Cargando contenido...</p>
        </div>
      </div>
    );
  }

  const bannerItems = getContentBySection("banner");
  const promoBanner = bannerItems.find((i) => i.key === "promo_banner");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestión de Contenido del Sitio</h2>
        <Button onClick={loadContent} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Recargar
        </Button>
      </div>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList>
          <TabsTrigger value="hero">Hero Principal</TabsTrigger>
          <TabsTrigger value="banner">Banners</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp Upsell</TabsTrigger>
          <TabsTrigger value="all">Todo el Contenido</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sección Hero - Página Principal</CardTitle>
              <CardDescription>Gestiona la imagen y textos principales de la homepage</CardDescription>
            </CardHeader>
          </Card>
          <ContentItemList items={getContentBySection("hero")} {...listProps} />
        </TabsContent>

        <TabsContent value="banner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Banners y Promociones</CardTitle>
              <CardDescription>
                Gestiona banners promocionales. El banner "promo_banner" se mostrará como pop-up modal al ingresar a la página.
                {promoBanner?.is_active
                  ? " ✅ Modal promocional ACTIVO - Se mostrará al entrar al sitio"
                  : " ⚠️ Modal promocional INACTIVO - No se mostrará"}
              </CardDescription>
            </CardHeader>
          </Card>
          <ContentItemList items={bannerItems} {...listProps} />
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          {(() => {
            const whatsappItems = getContentBySection("whatsapp_upsell");
            const enabledItem = whatsappItems.find((i) => i.key === "enabled");
            const isEnabled = enabledItem?.value === "true";
            return (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>WhatsApp - Venta de Lunas</CardTitle>
                    <CardDescription>
                      Configura el mensaje y CTA de WhatsApp que aparece después de una compra, invitando al cliente a consultar por lunas oftálmicas.
                      {isEnabled
                        ? " ✅ Upsell ACTIVO - Se mostrará en confirmación de pedido"
                        : " ⚠️ Upsell INACTIVO - No se mostrará"}
                    </CardDescription>
                  </CardHeader>
                </Card>
                <ContentItemList items={whatsappItems} {...listProps} />
              </>
            );
          })()}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todo el Contenido</CardTitle>
              <CardDescription>Vista completa de todo el contenido del sitio</CardDescription>
            </CardHeader>
          </Card>
          <ContentItemList items={content} {...listProps} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SiteContentManager;
