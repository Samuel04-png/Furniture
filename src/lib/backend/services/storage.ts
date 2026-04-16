import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase';

const allowedImageTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').toLowerCase();
}

function ensureImageFile(file: File) {
  if (!allowedImageTypes.has(file.type)) {
    throw new Error('Please upload a JPEG, PNG, WebP, or HEIC image.');
  }
}

function dataUrlToBlob(dataUrl: string) {
  const [header, content] = dataUrl.split(',');
  const mimeMatch = /data:(.*?);base64/.exec(header);
  const mimeType = mimeMatch?.[1] ?? 'image/jpeg';
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

export async function uploadPublicSubmissionFile(
  file: File,
  folder: 'visualiser' | 'configurator',
  fileId: string,
) {
  ensureImageFile(file);
  const path = `submissions/${folder}/${fileId}/${sanitizeName(file.name)}`;
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      purpose: folder,
      originalName: file.name,
    },
  });

  return {
    path,
    url: await getDownloadURL(snapshot.ref),
  };
}

export async function uploadPublicSubmissionDataUrl(
  dataUrl: string,
  folder: 'visualiser' | 'configurator',
  fileId: string,
  filename = 'upload.jpg',
) {
  const blob = dataUrlToBlob(dataUrl);
  const path = `submissions/${folder}/${fileId}/${sanitizeName(filename)}`;
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, blob, {
    contentType: blob.type || 'image/jpeg',
    customMetadata: {
      purpose: folder,
      source: 'data-url',
    },
  });

  return {
    path,
    url: await getDownloadURL(snapshot.ref),
  };
}

export async function uploadProductMedia(
  productId: string,
  slot: 'hero' | 'card' | 'gallery',
  file: File,
) {
  ensureImageFile(file);
  const path = `products/${productId}/${slot}/${Date.now()}-${sanitizeName(file.name)}`;
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      productId,
      slot,
      originalName: file.name,
    },
  });

  return {
    path,
    url: await getDownloadURL(snapshot.ref),
  };
}

export async function uploadWebsiteMedia(
  folder: 'materials' | 'sample-rooms' | 'testimonials' | 'portfolio' | 'team-profiles',
  recordId: string,
  slot: string,
  file: File,
) {
  ensureImageFile(file);
  const path = `website/${folder}/${recordId}/${sanitizeName(slot)}/${Date.now()}-${sanitizeName(file.name)}`;
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      folder,
      recordId,
      slot,
      originalName: file.name,
    },
  });

  return {
    path,
    url: await getDownloadURL(snapshot.ref),
  };
}
