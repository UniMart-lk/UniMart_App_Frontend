import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

const MapView = forwardRef((props, ref) => {
  const { onMapReady, children, style, ...rest } = props;

  useImperativeHandle(ref, () => ({
    animateToRegion: () => {},
    animateCamera: () => {},
    fitToCoordinates: () => {},
    fitToElements: () => {},
    fitToSuppliedMarkers: () => {},
    setCamera: () => {},
    setIndoorActiveLevelIndex: () => {},
  }));

  useEffect(() => {
    if (typeof onMapReady === 'function') {
      const timer = setTimeout(() => {
        onMapReady();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [onMapReady]);

  return (
    <View style={[styles.mapFallback, style]} {...rest}>
      {children}
    </View>
  );
});

MapView.displayName = 'MapViewWebMock';

export const Marker = forwardRef((props, ref) => {
  const { children, style, ...rest } = props;
  useImperativeHandle(ref, () => ({
    showCallout: () => {},
    hideCallout: () => {},
    redraw: () => {},
  }));
  return children ? <View style={style} {...rest}>{children}</View> : null;
});
Marker.displayName = 'MarkerWebMock';

export const Callout = ({ children, style, ...rest }) => (
  children ? <View style={style} {...rest}>{children}</View> : null
);
Callout.displayName = 'CalloutWebMock';

export const Overlay = ({ children, style, ...rest }) => (
  children ? <View style={style} {...rest}>{children}</View> : null
);
Overlay.displayName = 'OverlayWebMock';

export const Polyline = () => null;
export const Polygon = () => null;
export const Circle = () => null;
export const UrlTile = () => null;
export const WMSTile = () => null;
export const LocalTile = () => null;
export const CalloutSubview = ({ children }) => children || null;

export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';
export const MAP_TYPES = {
  STANDARD: 'standard',
  SATELLITE: 'satellite',
  HYBRID: 'hybrid',
  TERRAIN: 'terrain',
  NONE: 'none',
  MUTEDSTANDARD: 'mutedStandard',
};

export class AnimatedRegion {
  constructor(value) {
    Object.assign(this, value);
  }
  setValue(value) {
    Object.assign(this, value);
  }
  setOffset() {}
  flattenOffset() {}
  extractOffset() {}
  addListener() { return ''; }
  removeListener() {}
  removeAllListeners() {}
  stopAnimation() {}
  timing() { return { start: (cb) => cb && cb({ finished: true }) }; }
  spring() { return { start: (cb) => cb && cb({ finished: true }) }; }
}

export const Animated = MapView;
export const MarkerAnimated = Marker;
export const OverlayAnimated = Overlay;

const styles = StyleSheet.create({
  mapFallback: {
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
});

export default MapView;
