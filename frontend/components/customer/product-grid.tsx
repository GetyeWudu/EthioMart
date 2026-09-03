import { ProductCard, ProductCardProps } from "./product-card";

interface ProductGridProps {
  products: ProductCardProps[];
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  emptyStateMessage?: string;
}

export function ProductGrid({ 
  products, 
  columns = { sm: 2, md: 3, lg: 4, xl: 4 },
  emptyStateMessage = "No products found matching your criteria."
}: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="text-4xl mb-4 opacity-50">🛒</div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Products Found</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">{emptyStateMessage}</p>
      </div>
    );
  }

  // Generate grid class string based on columns prop
  const gridClasses = [
    "grid gap-4 sm:gap-6",
    "grid-cols-1",
    columns.sm ? `sm:grid-cols-${columns.sm}` : "sm:grid-cols-2",
    columns.md ? `md:grid-cols-${columns.md}` : "md:grid-cols-3",
    columns.lg ? `lg:grid-cols-${columns.lg}` : "lg:grid-cols-4",
    columns.xl ? `xl:grid-cols-${columns.xl}` : "xl:grid-cols-4",
  ].join(" ");

  return (
    <div className={gridClasses}>
      {products.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
}
