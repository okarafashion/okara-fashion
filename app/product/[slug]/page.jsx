import ProductDetailView from '../../../components/products/ProductDetailView';
import { MOCK_PRODUCTS } from '../../../data/mockProducts';

export async function generateStaticParams() {
  return MOCK_PRODUCTS.map((product) => ({
    slug: product.slug,
  }));
}

export default function ProductPage({ params }) {
  const { slug } = params;
  const initialProduct = MOCK_PRODUCTS.find((p) => p.slug === slug) || null;

  return <ProductDetailView initialProduct={initialProduct} slug={slug} />;
}
