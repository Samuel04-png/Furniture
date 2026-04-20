import { useEffect, useState } from 'react';
import { Copy, ExternalLink, Printer } from 'lucide-react';
import { toDataURL } from 'qrcode';
import { copyText } from '../../lib/utils';
import { toAbsolutePublicUrl } from '../../lib/websiteMedia';
import { AdminAnchorButton, AdminButton } from './AdminUi';

type PublicShareToolsProps = {
  title: string;
  url: string;
  secondaryUrl?: string;
  secondaryLabel?: string;
};

export function PublicShareTools({
  title,
  url,
  secondaryUrl,
  secondaryLabel = 'Copy image link',
}: PublicShareToolsProps) {
  const publicUrl = toAbsolutePublicUrl(url);
  const secondaryLink = secondaryUrl ? toAbsolutePublicUrl(secondaryUrl) : '';
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  useEffect(() => {
    let active = true;

    void toDataURL(publicUrl, {
      margin: 1,
      width: 220,
      color: {
        dark: '#1f1914',
        light: '#0000',
      },
    })
      .then((dataUrl) => {
        if (!active) return;
        setQrCodeDataUrl(dataUrl);
      })
      .catch((error) => {
        console.error('Failed to generate QR code:', error);
        if (!active) return;
        setQrCodeDataUrl('');
      });

    return () => {
      active = false;
    };
  }, [publicUrl]);

  const printQrCode = () => {
    if (!qrCodeDataUrl) return;

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=540,height=720');
    if (!printWindow) return;

    printWindow.document.write(`<!doctype html>
<html>
  <head>
    <title>${title}</title>
    <style>
      body {
        font-family: "DM Sans", Arial, sans-serif;
        margin: 0;
        padding: 32px;
        color: #1f1914;
      }
      .sheet {
        border: 1px solid rgba(31, 25, 20, 0.16);
        border-radius: 24px;
        padding: 32px;
        text-align: center;
      }
      h1 {
        margin: 0 0 12px;
        font-size: 28px;
      }
      p {
        margin: 0;
        font-size: 14px;
        line-height: 1.7;
        word-break: break-word;
      }
      img {
        display: block;
        width: 240px;
        height: 240px;
        margin: 28px auto;
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <h1>${title}</h1>
      <p>${publicUrl}</p>
      <img src="${qrCodeDataUrl}" alt="QR code for ${title}" />
      <p>Scan or visit the link above.</p>
    </div>
    <script>
      window.addEventListener('load', () => {
        window.print();
      });
    </script>
  </body>
</html>`);
    printWindow.document.close();
  };

  return (
    <div className="rounded-[1.25rem] border border-black/7 bg-[#fffdf9] p-4">
      <div className="grid gap-4 lg:grid-cols-[120px_minmax(0,1fr)]">
        <div className="flex items-center justify-center rounded-[1rem] border border-black/6 bg-[#f6efe3] p-3">
          {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt={`QR code for ${title}`} className="h-24 w-24 object-contain" />
          ) : (
            <div className="text-center text-xs uppercase tracking-[0.18em] text-tm-warm-gray">
              QR loading
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-tm-warm-gray">Share and print</p>
          <p className="mt-2 break-all text-sm leading-6 text-tm-warm-gray">{publicUrl}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <AdminButton type="button" tone="ghost" onClick={() => void copyText(publicUrl)}>
              <Copy className="h-4 w-4 text-tm-gold" />
              Copy link
            </AdminButton>
            <AdminAnchorButton href={publicUrl} target="_blank" rel="noreferrer" tone="ghost">
              <ExternalLink className="h-4 w-4" />
              Open
            </AdminAnchorButton>
            <AdminButton type="button" tone="secondary" onClick={printQrCode}>
              <Printer className="h-4 w-4" />
              Print QR
            </AdminButton>
            {secondaryLink ? (
              <AdminButton type="button" tone="ghost" onClick={() => void copyText(secondaryLink)}>
                <Copy className="h-4 w-4 text-tm-gold" />
                {secondaryLabel}
              </AdminButton>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
