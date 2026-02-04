import React from "react";
import ProductsPage from "@/components/products/ProductsPage";

const HombresProducts: React.FC = () => {
  return (
    <ProductsPage
      gender="hombre"
      title="Lentes para Hombres"
      description="Encuentra los lentes perfectos para hombres con descuentos especiales"
      keywords="lentes hombres, gafas masculinas, lentes sol hombres, marcos hombres"
      breadcrumbLabel="Hombre"
    />
  );
};

export default HombresProducts;
