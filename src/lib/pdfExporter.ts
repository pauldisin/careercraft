import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface PDFExportOptions {
  filename: string;
  onStart?: () => void;
  onProgress?: (progress: number, status: string) => void;
  onComplete?: () => void;
  onError?: (error: any) => void;
  showPageNumbers?: boolean;
  watermark?: 'none' | 'draft' | 'careercraft';
}

/**
 * Generates a high-quality PDF on the client from any HTML element container.
 * Temporarily disables dark mode for perfect high-contrast white pages with dark text.
 * 
 * @param element The target container element to render
 * @param options Export configuration and lifecycle callbacks
 */
export async function exportElementToPDF(
  element: HTMLElement | null,
  options: PDFExportOptions
) {
  if (!element) {
    options.onError?.(new Error("Target document element not found for capturing."));
    return;
  }

  const { filename, onStart, onProgress, onComplete, onError, showPageNumbers, watermark } = options;
  onStart?.();
  onProgress?.(10, "Preparing page layouts and styles...");

  // 1. Temporarily pause dark mode class to output clean light backgrounds
  const docHtml = document.documentElement;
  const existedDark = docHtml.classList.contains("dark");
  
  if (existedDark) {
    docHtml.classList.remove("dark");
  }

  // 2. Hide any print-hidden buttons, shadows, border highlights, or scroll bars we don't want in the final PDF
  const styleText = `
    .print-hidden, [class*="print-hidden"] { display: none !important; }
    .no-select { user-select: none !important; }
    input { outline: none !important; border: none !important; background: transparent !important; }
  `;
  const styleElement = document.createElement("style");
  styleElement.textContent = styleText;
  document.head.appendChild(styleElement);

  const originalGetComputedStyle = window.getComputedStyle;

  // Optimized static variables for lightning fast color conversion caching
  const colorCache = (window as any)._colorCache || new Map<string, string>();
  if (!(window as any)._colorCache) {
    (window as any)._colorCache = colorCache;
  }
  let sharedCanvas: HTMLCanvasElement | null = (window as any)._sharedOklchCanvas || null;
  let sharedCtx: CanvasRenderingContext2D | null = (window as any)._sharedOklchCtx || null;

  const convertColorToRgba = (colorStr: string): string => {
    if (colorCache.has(colorStr)) {
      return colorCache.get(colorStr)!;
    }
    try {
      if (!sharedCanvas) {
        sharedCanvas = document.createElement('canvas');
        sharedCanvas.width = 1;
        sharedCanvas.height = 1;
        (window as any)._sharedOklchCanvas = sharedCanvas;
        sharedCtx = sharedCanvas.getContext('2d', { willReadFrequently: true });
        (window as any)._sharedOklchCtx = sharedCtx;
      }
      if (!sharedCtx) {
        return 'rgba(0, 0, 0, 0)';
      }
      sharedCtx.clearRect(0, 0, 1, 1);
      sharedCtx.fillStyle = colorStr;
      sharedCtx.fillRect(0, 0, 1, 1);
      const data = sharedCtx.getImageData(0, 0, 1, 1).data;
      const rgba = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;
      colorCache.set(colorStr, rgba);
      return rgba;
    } catch (e) {
      return 'rgba(0, 0, 0, 0)';
    }
  };

  const replaceUnsupportedColorsInString = (str: string): string => {
    if (!str || typeof str !== 'string') return str;
    if (!str.includes('oklch') && !str.includes('oklab')) return str;
    return str.replace(/(oklch|oklab)\([^)]+\)/g, (match) => {
      return convertColorToRgba(match);
    });
  };

  const originalGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;
  const originalStyleGetter = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "style")?.get;

  try {
    // Intercept CSSStyleDeclaration.prototype.getPropertyValue globally
    CSSStyleDeclaration.prototype.getPropertyValue = function(propertyName: string) {
      const val = originalGetPropertyValue.call(this, propertyName);
      if (typeof val === "string" && (val.includes("oklch") || val.includes("oklab"))) {
        return replaceUnsupportedColorsInString(val);
      }
      return val;
    };

    // Intercept HTMLElement.prototype.style getter temporarily for inline style access conversion
    if (originalStyleGetter) {
      Object.defineProperty(HTMLElement.prototype, "style", {
        get() {
          const style = originalStyleGetter.call(this);
          return new Proxy(style, {
            get(target, prop) {
              if (prop === "getPropertyValue") {
                return function(propertyName: string) {
                  const val = target.getPropertyValue(propertyName);
                  if (typeof val === "string" && (val.includes("oklch") || val.includes("oklab"))) {
                    return replaceUnsupportedColorsInString(val);
                  }
                  return val;
                };
              }
              const val = Reflect.get(target, prop);
              if (typeof val === "function") {
                return val.bind(target);
              }
              if (typeof val === "string" && (val.includes("oklch") || val.includes("oklab"))) {
                return replaceUnsupportedColorsInString(val);
              }
              return val;
            }
          });
        },
        configurable: true
      });
    }

    // Intercept window.getComputedStyle temporarily for html2canvas
    window.getComputedStyle = function(el, pseudoElt) {
      const style = originalGetComputedStyle.call(this, el, pseudoElt);
      return new Proxy(style, {
        get(target, prop) {
          if (prop === "getPropertyValue") {
            return function(propertyName: string) {
              const val = target.getPropertyValue(propertyName);
              if (typeof val === "string" && (val.includes("oklch") || val.includes("oklab"))) {
                return replaceUnsupportedColorsInString(val);
              }
              return val;
            };
          }
          const val = Reflect.get(target, prop);
          if (typeof val === "function") {
            return val.bind(target);
          }
          if (typeof val === "string" && (val.includes("oklch") || val.includes("oklab"))) {
            return replaceUnsupportedColorsInString(val);
          }
          return val;
        }
      });
    };

    // 3. Render HTML to canvas with CORS support and high resolution scale
    onProgress?.(30, "Analyzing styles and capturing canvas elements...");
    const canvas = await html2canvas(element, {
      scale: 2, // Sharp high-resolution vector representation
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    onProgress?.(65, "Canvas captured. Converting to high-quality image data...");

    // Restore original structures immediately after canvas generation
    window.getComputedStyle = originalGetComputedStyle;
    CSSStyleDeclaration.prototype.getPropertyValue = originalGetPropertyValue;
    if (originalStyleGetter) {
      Object.defineProperty(HTMLElement.prototype, "style", {
        get: originalStyleGetter,
        configurable: true
      });
    }

    // 4. Restore dark mode setting to browser if it existed before
    if (existedDark) {
      docHtml.classList.add("dark");
    }

    // 5. Cleanup temporary style element
    if (styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }

    // 6. Partition high-res canvas into A4 dimensions inside jsPDF
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    
    // A4 Portrait specifications in points (72 points / inch, 25.4 mm / inch)
    // A4 size: 210mm x 297mm approx. 595.28 pt x 841.89 pt
    onProgress?.(75, "Structuring document pages and formatting margins...");
    const pdf = new jsPDF("p", "pt", "a4");
    
    const rawPageWidth = pdf.internal.pageSize.getWidth();
    const rawPageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = (isNaN(rawPageWidth) || !isFinite(rawPageWidth) || rawPageWidth <= 0) ? 595.28 : rawPageWidth;
    const pageHeight = (isNaN(rawPageHeight) || !isFinite(rawPageHeight) || rawPageHeight <= 0) ? 841.89 : rawPageHeight;
    
    // Determine safe canvas dimensions
    const canvasWidth = canvas && canvas.width > 0 ? canvas.width : 794;
    const canvasHeight = canvas && canvas.height > 0 ? canvas.height : 1123;
    
    // Determine the proportional height scaling
    const imgWidth = pageWidth;
    let imgHeight = (canvasHeight * imgWidth) / canvasWidth;
    if (isNaN(imgHeight) || !isFinite(imgHeight) || imgHeight <= 0) {
      imgHeight = pageHeight;
    }
    
    let heightLeft = imgHeight;
    let position = 0;

    const safePosition = (p: number): number => {
      if (isNaN(p) || !isFinite(p)) return 0;
      return p;
    };

    const safeSizeVal = (val: number, fallback: number): number => {
      if (isNaN(val) || !isFinite(val) || val <= 0) return fallback;
      return val;
    };

    // Output visual canvas onto PDF pages recursively
    pdf.addImage(
      imgData, 
      "JPEG", 
      0, 
      safePosition(position), 
      safeSizeVal(imgWidth, pageWidth), 
      safeSizeVal(imgHeight, pageHeight), 
      undefined, 
      "FAST"
    );
    heightLeft -= pageHeight;

    let pageSafetyCounter = 0;
    while (heightLeft > 0 && pageSafetyCounter < 50) {
      pageSafetyCounter++;
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(
        imgData, 
        "JPEG", 
        0, 
        safePosition(position), 
        safeSizeVal(imgWidth, pageWidth), 
        safeSizeVal(imgHeight, pageHeight), 
        undefined, 
        "FAST"
      );
      heightLeft -= pageHeight;
    }

    // Add watermark if enabled
    onProgress?.(85, "Securing document layers with authentic watermarks...");
    if (watermark && watermark !== "none") {
      const totalPages = pdf.getNumberOfPages();
      const label = watermark === "draft" ? "DRAFT" : "CAREERCRAFT";
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(54);
        pdf.setTextColor(235, 238, 243); // Extremely light slate gray, matches theme beautifully
        
        let x = pageWidth / 2;
        let y = pageHeight / 2;
        if (isNaN(x) || !isFinite(x) || x <= 0) x = 297.64;
        if (isNaN(y) || !isFinite(y) || y <= 0) y = 420.94;
        
        // Draw diagonal watermark in the center of the sheet
        pdf.text(label, x, y, {
          align: "center",
          angle: 45
        });
      }
    }

    // Add page numbers if enabled
    onProgress?.(92, "Injecting responsive footer page numbering...");
    if (showPageNumbers) {
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139); // Slate 500 gray equivalent
        
        const label = `${i} of ${totalPages}`;
        let textWidth = pdf.getStringUnitWidth(label) * 8;
        if (isNaN(textWidth) || !isFinite(textWidth) || textWidth <= 0) {
          textWidth = 30;
        }
        
        let x = (pageWidth - textWidth) / 2;
        let y = pageHeight - 24; // 24pt from the bottom line
        
        if (isNaN(x) || !isFinite(x) || x <= 0) x = pageWidth / 2;
        if (isNaN(y) || !isFinite(y) || y <= 0) y = pageHeight - 24;
        
        // Draw a tiny white pillow around the page number so content text doesn't overlap tags
        pdf.setFillColor(255, 255, 255);
        pdf.rect(x - 6, y - 8, textWidth + 12, 12, "F");
        
        // Draw page label text
        pdf.text(label, x, y);
      }
    }

    // 7. Prompt download on client browser
    onProgress?.(97, "Compressing document package and establishing browser stream...");
    pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
    
    onProgress?.(100, "Inbound delivery complete!");
    onComplete?.();
  } catch (err: any) {
    // Gracefully restore original window structures first
    window.getComputedStyle = originalGetComputedStyle;
    CSSStyleDeclaration.prototype.getPropertyValue = originalGetPropertyValue;
    if (originalStyleGetter) {
      Object.defineProperty(HTMLElement.prototype, "style", {
        get: originalStyleGetter,
        configurable: true
      });
    }
    
    // Gracefully restore visual environment in case of any crashes
    if (existedDark && !docHtml.classList.contains("dark")) {
      docHtml.classList.add("dark");
    }
    if (styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }
    console.error("PDF Client Generator error:", err);
    onError?.(err);
  }
}
