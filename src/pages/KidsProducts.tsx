import React from "react";
import ProductsPage from "@/components/products/ProductsPage";

const KidsProducts: React.FC = () => {
  return (
    <ProductsPage
      gender="niños"
      title="Lentes para Niños"
      description="Encuentra los lentes perfectos para niños con descuentos especiales"
      keywords="lentes niños, gafas infantiles, lentes sol niños, marcos niños"
      breadcrumbLabel="Niños"
    />
  );
};

export default KidsProducts;
