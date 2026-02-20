"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Loader2 } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  scale?: number;
  onLoadSuccess?: (data: { numPages: number }) => void;
  pageNumber?: number;
}

export function PdfViewer({
  url,
  scale = 1.0,
  onLoadSuccess,
  pageNumber = 1,
}: PdfViewerProps) {
  return (
    <Document
      file={url}
      onLoadSuccess={onLoadSuccess}
      loading={
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium animate-pulse">
            Loading Document...
          </p>
        </div>
      }
    >
      <Page
        pageNumber={pageNumber}
        scale={scale}
        className="max-w-full h-auto"
        renderAnnotationLayer={false}
        renderTextLayer={true}
      />
    </Document>
  );
}
