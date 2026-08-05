import QRCode from "qrcode";

export async function generateQrCodeDataUri(verificationUrl: string): Promise<string> {
  return QRCode.toDataURL(verificationUrl, { margin: 1, width: 160 });
}
