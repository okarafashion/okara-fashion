import ProductDetailView from '../../../components/products/ProductDetailView';
import { fetchProductBySlug, fetchProducts } from '../../../lib/supabaseClient';

export async function generateStaticParams() {
  try {
    const products = await fetchProducts(true);
    if (!products || products.length === 0) return [];
    return products.map((p) => ({
      slug: p.slug,
    }));
  } catch (err) {
    return [];
  }
}

export default async function ProductPage({ params }) {
  const { slug } = params;
  let initialProduct = null;

  try {
    initialProduct = await fetchProductBySlug(slug);
  } catch (err) {
    console.error('Error loading product page:', err);
  }

  return <ProductDetailView initialProduct={initialProduct} slug={slug} />;
}
