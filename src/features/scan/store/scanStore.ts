import { create } from 'zustand';
import type { ScanResult } from '../mocks/scanMocks';

export type { ScanResult };

interface ScanState {
  // Current scan result (set after processing)
  scanResult: ScanResult | null;
  // URI of the image captured in this session (camera or gallery)
  capturedImageUri: string | null;
  isScanning: boolean;
  pendingNickname: string | null;

  setScanResult: (result: ScanResult | null) => void;
  setCapturedImageUri: (uri: string | null) => void;
  setScanning: (v: boolean) => void;
  setPendingNickname: (name: string | null) => void;
  reset: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  scanResult: null,
  capturedImageUri: null,
  isScanning: false,
  pendingNickname: null,

  setScanResult: (result) => set({ scanResult: result }),
  setCapturedImageUri: (uri) => set({ capturedImageUri: uri }),
  setScanning: (v) => set({ isScanning: v }),
  setPendingNickname: (name) => set({ pendingNickname: name }),

  reset: () =>
    set({
      scanResult: null,
      capturedImageUri: null,
      isScanning: false,
      pendingNickname: null,
    }),
}));
