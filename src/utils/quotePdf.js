import { Capacitor } from '@capacitor/core';

/**
 * Teklif formunu PDF olarak indirir.
 *
 * Onceden window.print() cagriliyordu; bu tarayicinin yazdirma ekranini aciyor,
 * mobil uygulamanin WebView'inde ise hicbir sey yapmiyordu. Burada belge
 * gorunturlenip A4 sayfalara yerlestirilerek gercek bir PDF uretiliyor.
 *
 * Kutuphaneler yalnizca butona basildiginda yukleniyor; boylece uygulamanin
 * acilis paketi buyumuyor.
 */

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/** Belgedeki her .page-wrap ayri bir A4 sayfasi olur. */
const capturePages = async (root, html2canvas) => {
  const pages = Array.from(root.querySelectorAll('.page-wrap'));
  const targets = pages.length > 0 ? pages : [root];

  const canvases = [];
  for (const el of targets) {
    canvases.push(
      await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        // Ekranda gorunmeyen kisimlar da dahil olsun.
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      })
    );
  }
  return canvases;
};

const buildPdf = (canvases, jsPDF) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  canvases.forEach((canvas, index) => {
    if (index > 0) pdf.addPage();

    // Goruntuyu A4 genisligine oturt; tasarsa yukseklige gore kucult.
    let width = A4_WIDTH_MM;
    let height = (canvas.height * width) / canvas.width;
    if (height > A4_HEIGHT_MM) {
      height = A4_HEIGHT_MM;
      width = (canvas.width * height) / canvas.height;
    }
    const x = (A4_WIDTH_MM - width) / 2;

    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.92),
      'JPEG',
      x,
      0,
      width,
      height
    );
  });

  return pdf;
};

/**
 * Mobil uygulamada blob indirmesi calismiyor (WebView'in indirme dinleyicisi
 * yok). PDF once cihazin gecici klasorune yazilip paylasim ekraniyla aciliyor;
 * kullanici oradan kaydedebiliyor veya gonderebiliyor.
 */
const saveOnNative = async (pdf, fileName) => {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');

  const base64 = pdf.output('datauristring').split(',')[1];

  const written = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
  });

  await Share.share({
    title: fileName,
    files: [written.uri],
  });
};

export const downloadQuotePdf = async ({ element, fileName }) => {
  if (!element) throw new Error('Teklif belgesi bulunamadi.');

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const canvases = await capturePages(element, html2canvas);
  const pdf = buildPdf(canvases, jsPDF);

  const safeName = (fileName || 'teklif').replace(/[^\p{L}\p{N}._-]+/gu, '_');
  const fullName = `${safeName}.pdf`;

  if (Capacitor.isNativePlatform()) {
    await saveOnNative(pdf, fullName);
  } else {
    pdf.save(fullName);
  }
};
