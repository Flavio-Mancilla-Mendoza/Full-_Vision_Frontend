import React from "react";
import ProductsPage from "@/components/products/ProductsPage";

const MujerProducts: React.FC = () => {
  return (
    <ProductsPage
      gender="mujer"
      title="Lentes para Mujeres"
      description="Encuentra los lentes perfectos para mujeres con descuentos especiales"
      keywords="lentes mujer, gafas femeninas, lentes sol mujer, marcos mujer"
      breadcrumbLabel="Mujer"
    />
  );
};

export default MujerProducts;
