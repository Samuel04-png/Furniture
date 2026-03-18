import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { DimensionSet } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-ZM', {
    style: 'currency',
    currency: 'ZMW',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateLike: string) {
  return new Intl.DateTimeFormat('en-ZM', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateLike));
}

export function formatDateTime(dateLike: string) {
  return new Intl.DateTimeFormat('en-ZM', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateLike));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createWhatsAppLink(message: string, number = '260766439896') {

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function dimensionsLabel(dimensions: DimensionSet) {
  return `${dimensions.width} x ${dimensions.depth} x ${dimensions.height} cm`;
}

export function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  return Promise.resolve();
}

export function downloadCsv(filename: string, rows: Record<string, string | number | undefined>[]) {
  if (!rows.length) {
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`)
        .join(','),
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The selected image could not be processed.'));
    image.src = dataUrl;
  });
}

export async function prepareRoomImage(file: File) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);

  if (image.width < 800 || image.height < 600) {
    throw new Error('Please use a photo that is at least 800 x 600 pixels.');
  }

  const maxWidth = 1600;
  const shouldCompress =
    /image\/(jpeg|jpg|png|webp)/.test(file.type) && (image.width > maxWidth || file.size > 2_000_000);

  if (!shouldCompress) {
    return {
      dataUrl,
      width: image.width,
      height: image.height,
    };
  }

  const ratio = Math.min(1, maxWidth / image.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * ratio);
  canvas.height = Math.round(image.height * ratio);
  const context = canvas.getContext('2d');

  if (!context) {
    return {
      dataUrl,
      width: image.width,
      height: image.height,
    };
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const compressed = canvas.toDataURL('image/jpeg', 0.82);

  return {
    dataUrl: compressed,
    width: canvas.width,
    height: canvas.height,
  };
}
