/**
 * LeafBurst — Skia leaf-particle burst when the native module is available,
 * else a no-op (the celebration is purely decorative). The Skia impl is
 * require()'d lazily so its native import never evaluates in Expo Go.
 *
 * Public contract unchanged: <LeafBurst playKey={n} origin={{x,y}} onDone? />.
 */

import React from 'react';
import { isSkiaAvailable } from './skiaSafe';

interface Props {
  playKey: number;
  origin?: { x: number; y: number };
  onDone?: () => void;
}

const Impl: React.FC<Props> | null = isSkiaAvailable
  ? require('./LeafBurst.skia').LeafBurst
  : null;

export const LeafBurst: React.FC<Props> = (props) =>
  Impl ? <Impl {...props} /> : null;
