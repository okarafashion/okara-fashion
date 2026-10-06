import ProductDetailView from '../../../components/products/ProductDetailView';
import { fetchProductBySlug } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
