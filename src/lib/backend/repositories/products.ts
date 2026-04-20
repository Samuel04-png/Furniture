import type { Product } from '../../../types';
import type { UserIdentity } from '../firestore';
import { normalizeProductRecord } from '../models/products';
import {
  createDocument,
  removeDocument,
  subscribeMergedCollections,
  upsertDocument,
} from '../firestore';

function normalizeProductForWrite(product: Product) {
  const publishedToWebsite =
    product.publishedToWebsite ??
    product.website?.isPublished ??
    false;

  return {
    ...product,
    publishedToWebsite,
    website: {
      isPublished: product.website?.isPublished ?? publishedToWebsite,
      visibility: product.website?.visibility ?? (publishedToWebsite ? 'public' : 'internal'),
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
  return subscribeMergedCollections<Product>(
    [
      {
        key: 'products',
        path: 'products',
        priority: 2,
        map: (product) => normalizeProductRecord(product.id, product),
      },
      {
        key: 'publishedProducts',
        path: 'publishedProducts',
        priority: 1,
        map: (product) => normalizeProductRecord(product.id, product),
      },
    ],
    (products) =>
      onData(
        products
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
  const nextPublishedToWebsite =
    patch.publishedToWebsite ??
    patch.website?.isPublished;
  const normalizedPatch = {
    ...patch,
    publishedToWebsite: nextPublishedToWebsite,
    website: patch.website
      ? {
          isPublished: patch.website.isPublished ?? nextPublishedToWebsite,
          visibility:
            patch.website.visibility ??
            (typeof nextPublishedToWebsite === 'boolean'
              ? nextPublishedToWebsite
                ? 'public'
                : 'internal'
              : undefined),
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

  await upsertDocument<Product>('products', productId, normalizedPatch, user);
}

export async function deleteProduct(productId: string) {
  await removeDocument('products', productId);
}
