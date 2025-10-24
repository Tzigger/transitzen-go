/**
 * Proximity Detector with geofencing capabilities
 * Uses Turf.js for accurate geospatial calculations
 */

import distance from '@turf/distance';
import { point } from '@turf/helpers';
import bearing from '@turf/bearing';

export interface ProximityZone {
  id: string;
  center: { lat: number; lng: number };
  radius: number; // meters
  type: 'stop' | 'destination' | 'transfer';
  name: string;
  metadata?: any;
}

export interface ProximityAlert {
  zone: ProximityZone;
  distance: number; // meters
  bearing: number; // degrees
  alertLevel: 'approaching' | 'near' | 'arrived';
  timestamp: number;
}

export type ProximityCallback = (alert: ProximityAlert) => void;

/**
 * Alert thresholds in meters
 */
const ALERT_THRESHOLDS = {
  approaching: 500, // 500m - "Approaching stop"
  near: 200, // 200m - "Prepare to alight"
  arrived: 50, // 50m - "Arrived at stop"
};

export class ProximityDetector {
  private zones: Map<string, ProximityZone> = new Map();
  private activeAlerts: Map<string, 'approaching' | 'near' | 'arrived'> = new Map();
  private callbacks: ProximityCallback[] = [];
  private alertHistory: Set<string> = new Set(); // Prevent duplicate alerts

  /**
   * Add a proximity zone to monitor
   */
  addZone(zone: ProximityZone): void {
    this.zones.set(zone.id, zone);
    console.log(`🎯 Added proximity zone: ${zone.name} (${zone.type})`);
  }

  /**
   * Remove a proximity zone
   */
  removeZone(zoneId: string): void {
    this.zones.delete(zoneId);
    this.activeAlerts.delete(zoneId);
    console.log(`🎯 Removed proximity zone: ${zoneId}`);
  }

  /**
   * Clear all zones
   */
  clearZones(): void {
    this.zones.clear();
    this.activeAlerts.clear();
    this.alertHistory.clear();
    console.log('🎯 Cleared all proximity zones');
  }

  /**
   * Add multiple zones at once
   */
  addZones(zones: ProximityZone[]): void {
    zones.forEach((zone) => this.addZone(zone));
  }

  /**
   * Register a callback for proximity alerts
   */
  onProximity(callback: ProximityCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Remove a callback
   */
  removeCallback(callback: ProximityCallback): void {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);
  }

  /**
   * Check current position against all zones
   */
  checkPosition(currentLat: number, currentLng: number): ProximityAlert[] {
    const alerts: ProximityAlert[] = [];
    const currentPoint = point([currentLng, currentLat]);

    this.zones.forEach((zone) => {
      const zonePoint = point([zone.center.lng, zone.center.lat]);

      // Calculate distance in kilometers, then convert to meters
      const distanceKm = distance(currentPoint, zonePoint, { units: 'kilometers' });
      const distanceM = distanceKm * 1000;

      // Calculate bearing from current position to zone
      const bearingDeg = bearing(currentPoint, zonePoint);

      // Determine alert level
      let alertLevel: 'approaching' | 'near' | 'arrived' | null = null;

      if (distanceM <= ALERT_THRESHOLDS.arrived) {
        alertLevel = 'arrived';
      } else if (distanceM <= ALERT_THRESHOLDS.near) {
        alertLevel = 'near';
      } else if (distanceM <= ALERT_THRESHOLDS.approaching) {
        alertLevel = 'approaching';
      }

      // Emit alert if level changed or if first time in range
      if (alertLevel) {
        const previousAlert = this.activeAlerts.get(zone.id);
        const alertKey = `${zone.id}-${alertLevel}`;

        // Only emit alert if:
        // 1. It's a new zone (not previously alerted)
        // 2. Alert level has progressed (approaching -> near -> arrived)
        // 3. Alert hasn't been sent before
        if (
          !previousAlert ||
          this.isAlertProgression(previousAlert, alertLevel)
        ) {
          if (!this.alertHistory.has(alertKey)) {
            const alert: ProximityAlert = {
              zone,
              distance: distanceM,
              bearing: bearingDeg,
              alertLevel,
              timestamp: Date.now(),
            };

            alerts.push(alert);
            this.activeAlerts.set(zone.id, alertLevel);
            this.alertHistory.add(alertKey);

            // Trigger callbacks
            this.callbacks.forEach((callback) => callback(alert));

            console.log(`🔔 Proximity alert: ${zone.name} - ${alertLevel} (${distanceM.toFixed(0)}m)`);
          }
        }
      } else {
        // Out of range - remove active alert
        if (this.activeAlerts.has(zone.id)) {
          this.activeAlerts.delete(zone.id);
          console.log(`🎯 Left proximity zone: ${zone.name}`);
        }
      }
    });

    return alerts;
  }

  /**
   * Check if alert represents a progression (approaching -> near -> arrived)
   */
  private isAlertProgression(
    previous: 'approaching' | 'near' | 'arrived',
    current: 'approaching' | 'near' | 'arrived'
  ): boolean {
    const levels = ['approaching', 'near', 'arrived'];
    const prevIndex = levels.indexOf(previous);
    const currIndex = levels.indexOf(current);
    return currIndex > prevIndex;
  }

  /**
   * Get distance to a specific zone
   */
  getDistanceToZone(zoneId: string, currentLat: number, currentLng: number): number | null {
    const zone = this.zones.get(zoneId);
    if (!zone) return null;

    const currentPoint = point([currentLng, currentLat]);
    const zonePoint = point([zone.center.lng, zone.center.lat]);

    const distanceKm = distance(currentPoint, zonePoint, { units: 'kilometers' });
    return distanceKm * 1000; // Return in meters
  }

  /**
   * Get bearing to a specific zone
   */
  getBearingToZone(zoneId: string, currentLat: number, currentLng: number): number | null {
    const zone = this.zones.get(zoneId);
    if (!zone) return null;

    const currentPoint = point([currentLng, currentLat]);
    const zonePoint = point([zone.center.lng, zone.center.lat]);

    return bearing(currentPoint, zonePoint);
  }

  /**
   * Get all zones sorted by distance from current position
   */
  getZonesByDistance(currentLat: number, currentLng: number): Array<{
    zone: ProximityZone;
    distance: number;
  }> {
    const currentPoint = point([currentLng, currentLat]);
    const zonesWithDistance: Array<{ zone: ProximityZone; distance: number }> = [];

    this.zones.forEach((zone) => {
      const zonePoint = point([zone.center.lng, zone.center.lat]);
      const distanceKm = distance(currentPoint, zonePoint, { units: 'kilometers' });
      zonesWithDistance.push({
        zone,
        distance: distanceKm * 1000, // meters
      });
    });

    // Sort by distance (closest first)
    zonesWithDistance.sort((a, b) => a.distance - b.distance);

    return zonesWithDistance;
  }

  /**
   * Get current active alerts
   */
  getActiveAlerts(): Map<string, 'approaching' | 'near' | 'arrived'> {
    return new Map(this.activeAlerts);
  }

  /**
   * Reset alert history (useful when starting a new journey leg)
   */
  resetAlertHistory(): void {
    this.alertHistory.clear();
    this.activeAlerts.clear();
    console.log('🎯 Reset alert history');
  }

  /**
   * Check if user is within a zone
   */
  isInZone(zoneId: string, currentLat: number, currentLng: number): boolean {
    const dist = this.getDistanceToZone(zoneId, currentLat, currentLng);
    if (dist === null) return false;

    const zone = this.zones.get(zoneId);
    return zone ? dist <= zone.radius : false;
  }

  /**
   * Get closest zone to current position
   */
  getClosestZone(currentLat: number, currentLng: number): {
    zone: ProximityZone;
    distance: number;
  } | null {
    const zones = this.getZonesByDistance(currentLat, currentLng);
    return zones.length > 0 ? zones[0] : null;
  }

  /**
   * Get all zones
   */
  getAllZones(): ProximityZone[] {
    return Array.from(this.zones.values());
  }
}

/**
 * Singleton instance for global proximity detection
 */
export const proximityDetector = new ProximityDetector();
