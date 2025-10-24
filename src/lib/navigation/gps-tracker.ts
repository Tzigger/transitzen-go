/**
 * GPS Tracker with high-accuracy location tracking and Kalman filtering
 * Provides smooth, battery-efficient location updates for real-time navigation
 */

export interface GPSPosition {
  lat: number;
  lng: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface GPSOptions {
  highAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  minAccuracy?: number; // Minimum accuracy in meters
  updateInterval?: number; // Milliseconds between updates
}

export type GPSCallback = (position: GPSPosition) => void;
export type GPSErrorCallback = (error: GeolocationPositionError) => void;

/**
 * Simple Kalman filter for GPS position smoothing
 */
class KalmanFilter {
  private processNoise = 0.000001; // Q - Process noise
  private measurementNoise = 0.0001; // R - Measurement noise
  private estimationError = 1; // P - Estimation error
  private kalmanGain = 0; // K - Kalman gain
  private currentEstimate = 0;

  filter(measurement: number, accuracy: number): number {
    // Update measurement noise based on GPS accuracy
    this.measurementNoise = Math.max(0.0001, accuracy / 1000000);

    // Prediction update
    this.estimationError = this.estimationError + this.processNoise;

    // Measurement update
    this.kalmanGain =
      this.estimationError / (this.estimationError + this.measurementNoise);
    this.currentEstimate =
      this.currentEstimate + this.kalmanGain * (measurement - this.currentEstimate);
    this.estimationError = (1 - this.kalmanGain) * this.estimationError;

    return this.currentEstimate;
  }

  reset(initialValue: number) {
    this.currentEstimate = initialValue;
    this.estimationError = 1;
  }
}

export class GPSTracker {
  private watchId: number | null = null;
  private isTracking = false;
  private callback: GPSCallback | null = null;
  private errorCallback: GPSErrorCallback | null = null;
  private options: GPSOptions;
  
  // Kalman filters for lat and lng
  private latFilter = new KalmanFilter();
  private lngFilter = new KalmanFilter();
  
  // Previous position for calculating heading and speed
  private previousPosition: GPSPosition | null = null;
  private lastUpdateTime = 0;

  constructor(options: GPSOptions = {}) {
    this.options = {
      highAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      minAccuracy: 100, // Only accept positions with <100m accuracy
      updateInterval: 1000, // Update every second
      ...options,
    };
  }

  /**
   * Start tracking user location
   */
  start(callback: GPSCallback, errorCallback?: GPSErrorCallback): void {
    if (this.isTracking) {
      console.warn('🗺️ GPS tracking already started');
      return;
    }

    if (!navigator.geolocation) {
      const error = new Error('Geolocation is not supported by this browser');
      if (errorCallback) {
        errorCallback(error as any);
      }
      return;
    }

    this.callback = callback;
    this.errorCallback = errorCallback || null;
    this.isTracking = true;

    console.log('🗺️ Starting GPS tracking with options:', this.options);

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePosition(position),
      (error) => this.handleError(error),
      {
        enableHighAccuracy: this.options.highAccuracy,
        timeout: this.options.timeout,
        maximumAge: this.options.maximumAge,
      }
    );
  }

  /**
   * Stop tracking user location
   */
  stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
    this.callback = null;
    this.errorCallback = null;
    this.previousPosition = null;
    console.log('🗺️ GPS tracking stopped');
  }

  /**
   * Get current tracking status
   */
  getStatus(): { isTracking: boolean; lastUpdate: number } {
    return {
      isTracking: this.isTracking,
      lastUpdate: this.lastUpdateTime,
    };
  }

  /**
   * Get a single position update (not continuous tracking)
   */
  getCurrentPosition(): Promise<GPSPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gpsPosition = this.processPosition(position);
          resolve(gpsPosition);
        },
        (error) => reject(error),
        {
          enableHighAccuracy: this.options.highAccuracy,
          timeout: this.options.timeout,
          maximumAge: this.options.maximumAge,
        }
      );
    });
  }

  /**
   * Handle incoming position from geolocation API
   */
  private handlePosition(position: GeolocationPosition): void {
    const now = Date.now();
    
    // Throttle updates based on updateInterval
    if (now - this.lastUpdateTime < (this.options.updateInterval || 1000)) {
      return;
    }

    // Check accuracy threshold
    if (
      this.options.minAccuracy &&
      position.coords.accuracy > this.options.minAccuracy
    ) {
      console.warn(
        `🗺️ Position rejected due to low accuracy: ${position.coords.accuracy}m`
      );
      return;
    }

    this.lastUpdateTime = now;
    const gpsPosition = this.processPosition(position);

    if (this.callback) {
      this.callback(gpsPosition);
    }
  }

  /**
   * Process raw position data with Kalman filtering and heading calculation
   */
  private processPosition(position: GeolocationPosition): GPSPosition {
    const rawLat = position.coords.latitude;
    const rawLng = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    // Initialize filters on first position
    if (!this.previousPosition) {
      this.latFilter.reset(rawLat);
      this.lngFilter.reset(rawLng);
    }

    // Apply Kalman filter
    const filteredLat = this.latFilter.filter(rawLat, accuracy);
    const filteredLng = this.lngFilter.filter(rawLng, accuracy);

    // Calculate heading and speed
    let heading: number | undefined;
    let speed: number | undefined;

    if (this.previousPosition) {
      // Calculate heading (bearing) between previous and current position
      heading = this.calculateHeading(
        this.previousPosition.lat,
        this.previousPosition.lng,
        filteredLat,
        filteredLng
      );

      // Calculate speed (m/s)
      const distance = this.calculateDistance(
        this.previousPosition.lat,
        this.previousPosition.lng,
        filteredLat,
        filteredLng
      );
      const timeDiff = (Date.now() - this.previousPosition.timestamp) / 1000; // seconds
      speed = timeDiff > 0 ? distance / timeDiff : 0;
    }

    // Use HTML5 heading if available and more reliable
    if (position.coords.heading !== null && position.coords.heading >= 0) {
      heading = position.coords.heading;
    }

    // Use HTML5 speed if available
    if (position.coords.speed !== null && position.coords.speed >= 0) {
      speed = position.coords.speed;
    }

    const gpsPosition: GPSPosition = {
      lat: filteredLat,
      lng: filteredLng,
      accuracy,
      heading,
      speed,
      timestamp: Date.now(),
    };

    this.previousPosition = gpsPosition;

    console.log('📍 GPS position updated:', {
      lat: filteredLat.toFixed(8),
      lng: filteredLng.toFixed(8),
      accuracy: `${accuracy.toFixed(1)}m`,
      heading: heading ? `${heading.toFixed(1)}°` : 'N/A',
      speed: speed ? `${speed.toFixed(1)}m/s` : 'N/A',
    });

    return gpsPosition;
  }

  /**
   * Calculate heading/bearing between two coordinates (in degrees)
   */
  private calculateHeading(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    bearing = (bearing + 360) % 360; // Normalize to 0-360

    return bearing;
  }

  /**
   * Calculate distance between two coordinates (in meters) using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Handle geolocation errors
   */
  private handleError(error: GeolocationPositionError): void {
    console.error('🗺️ GPS error:', error.message);

    if (this.errorCallback) {
      this.errorCallback(error);
    }
  }
}

/**
 * Singleton instance for global GPS tracking
 */
export const gpsTracker = new GPSTracker({
  highAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
  minAccuracy: 100,
  updateInterval: 1000,
});
