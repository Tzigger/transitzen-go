#!/bin/bash
# Script to manually trigger transit data sync for testing

echo "🔧 Manual Transit Data Sync Script"
echo "==================================="
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Menu
echo "Select sync type:"
echo "1. Sync vehicle positions only (fast, ~30s)"
echo "2. Sync static data (stops, routes, trips) (slow, ~3-5 min)"
echo "3. Sync everything (vehicles + static data)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚗 Syncing vehicle positions..."
        npx convex run transitSync:syncVehiclePositions
        ;;
    2)
        echo ""
        echo "🚏 Syncing static transit data (this may take a few minutes)..."
        echo "📊 Fetching stops, routes, shapes, trips, and stop times..."
        npx convex run transitSync:syncStaticTransitData
        ;;
    3)
        echo ""
        echo "🔄 Syncing everything..."
        echo ""
        echo "Step 1/2: Syncing vehicle positions..."
        npx convex run transitSync:syncVehiclePositions
        echo ""
        echo "Step 2/2: Syncing static data..."
        npx convex run transitSync:syncStaticTransitData
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Sync completed!"
echo ""
echo "💡 Tip: Check Convex Dashboard logs for detailed information"
echo "   https://dashboard.convex.dev"
