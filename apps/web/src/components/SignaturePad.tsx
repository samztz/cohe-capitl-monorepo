'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import SignaturePadLib from 'signature_pad';

/**
 * SignaturePad Component
 *
 * A reusable signature pad component built on top of signature_pad library.
 * Supports mouse and touch input for handwritten signatures.
 *
 * @example
 * const signaturePadRef = useRef<SignaturePadHandle>(null);
 *
 * <SignaturePad
 *   ref={signaturePadRef}
 *   onChange={(signed) => console.log('Signed:', signed)}
 *   height={200}
 *   className="border rounded"
 * />
 */

export interface SignaturePadHandle {
  /** Check if signature pad is empty (no signature drawn) */
  isEmpty: () => boolean;
  /** Check if signature is confirmed (locked) */
  isConfirmed: () => boolean;
  /** Clear the signature pad */
  clear: () => void;
  /** Get PNG data URL (base64) of the signature */
  getPNGDataURL: () => string;
}

interface SignaturePadProps {
  /** Callback fired when signature state changes (signed/not signed) */
  onChange?: (signed: boolean) => void;
  /** Callback fired when signature is confirmed */
  onConfirm?: (confirmed: boolean) => void;
  /** Canvas height in pixels */
  height?: number;
  /** Additional CSS classes for the canvas container */
  className?: string;
}

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ onChange, onConfirm, height = 200, className = '' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const signaturePadRef = useRef<SignaturePadLib | null>(null);
    const [isSigned, setIsSigned] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

    // Initialize canvas and signature pad only once
    useEffect(() => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;

      // Initialize canvas size
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
      }

      // Create signature pad instance
      const signaturePad = new SignaturePadLib(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
      });

      signaturePadRef.current = signaturePad;

      return () => {
        signaturePad.off();
      };
    }, []); // Only run once on mount

    // Handle signature changes separately
    useEffect(() => {
      const signaturePad = signaturePadRef.current;
      if (!signaturePad) return;

      const handleEnd = () => {
        const isEmpty = signaturePad.isEmpty();
        setIsSigned(!isEmpty);
        onChange?.(!isEmpty);
      };

      signaturePad.addEventListener('endStroke', handleEnd);

      return () => {
        signaturePad.removeEventListener('endStroke', handleEnd);
      };
    }, [onChange]);

    // Handle confirm signature
    const handleConfirm = () => {
      if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) return;

      // Save signature data and lock the pad
      const dataUrl = signaturePadRef.current.toDataURL('image/png');
      setSignatureDataUrl(dataUrl);
      setIsConfirmed(true);
      onConfirm?.(true);
    };

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      isEmpty: () => {
        return signaturePadRef.current?.isEmpty() ?? true;
      },
      isConfirmed: () => {
        return isConfirmed;
      },
      clear: () => {
        signaturePadRef.current?.clear();
        setIsSigned(false);
        setIsConfirmed(false);
        setSignatureDataUrl(null);
        onChange?.(false);
        onConfirm?.(false);
      },
      getPNGDataURL: () => {
        // Return saved data URL if confirmed, otherwise current canvas
        if (isConfirmed && signatureDataUrl) {
          return signatureDataUrl;
        }
        if (!signaturePadRef.current) return '';
        return signaturePadRef.current.toDataURL('image/png');
      },
    }));

    return (
      <div className={`relative ${className}`}>
        {/* Canvas or Confirmed Signature Image */}
        {isConfirmed && signatureDataUrl ? (
          // Show locked signature image
          <div
            className="w-full border-2 border-green-500 rounded bg-white flex items-center justify-center"
            style={{ height: `${height}px` }}
          >
            <img
              src={signatureDataUrl}
              alt="Confirmed Signature"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          // Show editable canvas
          <canvas
            ref={canvasRef}
            className={`w-full border rounded touch-none ${
              isConfirmed
                ? 'border-gray-300 cursor-not-allowed opacity-50'
                : 'border-gray-300 cursor-crosshair'
            }`}
            style={{ height: `${height}px` }}
          />
        )}

        {/* Status indicator */}
        <div className="absolute top-2 right-2 text-xs bg-white/90 px-2 py-1 rounded shadow-sm">
          {isConfirmed ? (
            <span className="text-green-600 font-semibold">🔒 Confirmed</span>
          ) : isSigned ? (
            <span className="text-blue-600">✓ Signed</span>
          ) : (
            <span className="text-gray-500">○ Not Signed</span>
          )}
        </div>

        {/* Action buttons */}
        {!isConfirmed && (
          <div className="absolute bottom-2 right-2 flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={!isSigned}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors shadow-sm ${
                isSigned
                  ? 'text-white bg-green-600 hover:bg-green-700'
                  : 'text-gray-400 bg-gray-200 cursor-not-allowed'
              }`}
            >
              ✓ Confirm
            </button>
          </div>
        )}
      </div>
    );
  }
);

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
