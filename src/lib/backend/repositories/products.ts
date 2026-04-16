import type { Product } from '../../../types';
import type { UserIdentity } from '../firestore';
import { normalizeProductRecord } from '../models/products';
import {
  createDocument,
  patchDocument,
  removeDocument,
  subscribeCollection,
} from '../firestore';

function normalizeProductForWrite(product: Product) {
  return {
    ...product,
    website: {
      isPublished: product.website?.isPublished ?? product.status === 'Live',
      visibility: product.website?.visibility ?? (product.status === 'Live' ? 'public' : 'internal'),
      featured: product.website?.featured ?? false,
      featuredOrder: product.website?.featuredOrder ?? 999,
      storeTitle: product.website?.storeTitle ?? product.name,
      storeSummary: product.website?.storeSummary ?? product.summary,
      storeDescription: product.website?.storeDescription ?? product.description,
      seoTitle: product.website?.seoTitle ?? product.name,
      seoDescription: product.website?.seoDescription ?? product.summary,
      publishedAt: product.website?.publishedAt ?? null,
      publishedBy: product.website?.publishedBy ?? null,
    },
  };
}

export function subscribeAdminProducts(
  onData: (products: Product[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<Product>(
    'products',
    [],
    (products) =>
      onData(
        products
          .map((product) => normalizeProductRecord(product.id, product))
          .sort((left, right) => {
            const leftUpdated = left.updatedAt ? Date.parse(left.updatedAt) : 0;
            const rightUpdated = right.updatedAt ? Date.parse(right.updatedAt) : 0;
            if (rightUpdated !== leftUpdated) {
              return rightUpdated - leftUpdated;
            }
            return left.name.localeCompare(right.name);
          }),
      ),
    (error) => {
      console.error('Failed to subscribe to admin products:', error);
      onError?.('Unable to load products right now.');
    },
  );
}

export async function createProduct(product: Product, user?: UserIdentity | null) {
  await createDocument('products', product.id, normalizeProductForWrite(product), user);
}

export async function updateProduct(
  productId: string,
  patch: Partial<Product>,
  user?: UserIdentity | null,
) {
  const normalizedPatch = {
    ...patch,
    website: patch.website
      ? {
          isPublished: patch.website.isPublished,
          visibility: patch.website.visibility,
          featured: patch.website.featured,
          featuredOrder: patch.website.featuredOrder,
          storeTitle: patch.website.storeTitle,
          storeSummary: patch.website.storeSummary,
          storeDescription: patch.website.storeDescription,
          seoTitle: patch.website.seoTitle,
          seoDescription: patch.website.seoDescription,
          publishedAt: patch.website.publishedAt,
          publishedBy: patch.website.publishedBy,
        }
      : undefined,
  };

  await patchDocument<Product>('products', productId, normalizedPatch, user);
}

export async function deleteProduct(productId: string) {
  await removeDocument('products', productId);
}
