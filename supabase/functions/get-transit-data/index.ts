import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TRANSIT_API_BASE_URL = 'https://api.tranzy.ai/v1/opendata';
const TRANSIT_API_KEY = Deno.env.get('TRANSIT_API_KEY');
const AGENCY_ID = '1'; // Iași agency ID

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 DEBUG: Starting Tranzy API fetch');
    console.log('🔍 API Base URL:', TRANSIT_API_BASE_URL);
    console.log('🔍 Agency ID:', AGENCY_ID);
    console.log('🔍 API Key exists:', !!TRANSIT_API_KEY);
    console.log('🔍 API Key length:', TRANSIT_API_KEY?.length || 0);

    let vehiclesData = [];
    let stopsData = [];
    let routesData = [];
    let shapesData = [];

    const headers = {
      'X-API-KEY': TRANSIT_API_KEY || '',
      'X-Agency-Id': AGENCY_ID,
      'Content-Type': 'application/json',
    };

    console.log('🔍 Request headers:', JSON.stringify({
      'X-API-KEY': TRANSIT_API_KEY?.substring(0, 10) + '...',
      'X-Agency-Id': AGENCY_ID,
    }));

    // First, test if API key works by getting agencies list
    try {
      console.log('📋 Step 1: Fetching available agencies...');
      const agenciesResponse = await fetch(
        `${TRANSIT_API_BASE_URL}/agency`,
        { 
          headers: {
            'X-API-KEY': TRANSIT_API_KEY || '',
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('📋 Agencies response status:', agenciesResponse.status);
      
      if (agenciesResponse.ok) {
        const agencies = await agenciesResponse.json();
        console.log('✅ Available agencies:', JSON.stringify(agencies, null, 2));
      } else {
        const errorText = await agenciesResponse.text();
        console.error('❌ Agencies error:', errorText);
        console.error('❌ THIS MEANS YOUR API KEY IS INVALID OR HAS NO PERMISSIONS!');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Agencies fetch error:', errorMessage);
    }

    // Fetch vehicles
    try {
      console.log('🚌 Step 2: Fetching vehicles...');
      const vehiclesResponse = await fetch(
        `${TRANSIT_API_BASE_URL}/vehicles`,
        { headers }
      );

      console.log('🚌 Vehicles response status:', vehiclesResponse.status);
      console.log('🚌 Vehicles response headers:', JSON.stringify([...vehiclesResponse.headers.entries()]));
      
      if (vehiclesResponse.ok) {
        vehiclesData = await vehiclesResponse.json();
        console.log(`✅ SUCCESS! Fetched ${vehiclesData.length} vehicles`);
        if (vehiclesData.length > 0) {
          console.log('🚌 Sample vehicle:', JSON.stringify(vehiclesData[0], null, 2));
        }
      } else {
        const errorText = await vehiclesResponse.text();
        console.error('❌ Vehicles error:', errorText);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Vehicles fetch error:', errorMessage);
    }

    // Fetch stops
    try {
      console.log('🛑 Step 3: Fetching stops...');
      const stopsResponse = await fetch(
        `${TRANSIT_API_BASE_URL}/stops`,
        { headers }
      );

      console.log('🛑 Stops response status:', stopsResponse.status);
      
      if (stopsResponse.ok) {
        stopsData = await stopsResponse.json();
        console.log(`✅ SUCCESS! Fetched ${stopsData.length} stops`);
        if (stopsData.length > 0) {
          console.log('🛑 Sample stop:', JSON.stringify(stopsData[0], null, 2));
        }
      } else {
        const errorText = await stopsResponse.text();
        console.error('❌ Stops error:', errorText);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Stops fetch error:', errorMessage);
    }

    // Fetch routes
    try {
      console.log('🛣️ Step 4: Fetching routes...');
      const routesResponse = await fetch(
        `${TRANSIT_API_BASE_URL}/routes`,
        { headers }
      );

      console.log('🛣️ Routes response status:', routesResponse.status);
      
      if (routesResponse.ok) {
        routesData = await routesResponse.json();
        console.log(`✅ SUCCESS! Fetched ${routesData.length} routes`);
        if (routesData.length > 0) {
          console.log('🛣️ Sample route:', JSON.stringify(routesData[0], null, 2));
        }
      } else {
        const errorText = await routesResponse.text();
        console.error('❌ Routes error:', errorText);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Routes fetch error:', errorMessage);
    }

    // Fetch shapes
    try {
      console.log('🗺️ Step 5: Fetching shapes...');
      const shapesResponse = await fetch(
        `${TRANSIT_API_BASE_URL}/shapes`,
        { headers }
      );

      console.log('🗺️ Shapes response status:', shapesResponse.status);
      
      if (shapesResponse.ok) {
        shapesData = await shapesResponse.json();
        console.log(`✅ SUCCESS! Fetched ${shapesData.length} shapes`);
        if (shapesData.length > 0) {
          console.log('🗺️ Sample shape:', JSON.stringify(shapesData[0], null, 2));
        }
      } else {
        const errorText = await shapesResponse.text();
        console.error('❌ Shapes error:', errorText);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Shapes fetch error:', errorMessage);
    }

    // Format the data
    const formattedVehicles = vehiclesData.map((vehicle: any) => ({
      id: vehicle.id,
      routeId: vehicle.route_id,
      routeShortName: vehicle.label || 'N/A',
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
      bearing: 0, // API doesn't provide bearing directly
      speed: vehicle.speed || 0,
      timestamp: vehicle.timestamp,
      vehicleType: vehicle.vehicle_type === 0 ? 'tram' : 'bus',
    }));

    const formattedStops = stopsData.map((stop: any) => ({
      id: stop.stop_id,
      name: stop.stop_name,
      latitude: stop.stop_lat,
      longitude: stop.stop_lon,
      code: stop.stop_code,
    }));

    // Group shapes by shape_id
    const shapesByShapeId: Record<string, any[]> = {};
    shapesData.forEach((point: any) => {
      const shapeId = point.shape_id;
      if (!shapesByShapeId[shapeId]) {
        shapesByShapeId[shapeId] = [];
      }
      shapesByShapeId[shapeId].push({
        lat: point.shape_pt_lat,
        lon: point.shape_pt_lon,
        sequence: point.shape_pt_sequence,
      });
    });

    // Sort shapes by sequence and attach to routes
    Object.keys(shapesByShapeId).forEach(shapeId => {
      shapesByShapeId[shapeId].sort((a, b) => a.sequence - b.sequence);
    });

    const routesWithShapes = routesData.map((route: any) => ({
      ...route,
      shapes: shapesByShapeId[route.shape_id] || [],
    }));

    return new Response(
      JSON.stringify({
        vehicles: formattedVehicles,
        stops: formattedStops,
        routes: routesWithShapes,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in get-transit-data function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        vehicles: [],
        stops: [],
        routes: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
