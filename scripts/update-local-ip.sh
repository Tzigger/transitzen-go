#!/bin/bash

# Script to automatically update local IP addresses in configuration files
# This is useful when your local IP changes (e.g., switching WiFi networks)

echo "🔍 Detecting local IP address..."

# Detect local IP address (macOS/Linux compatible)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
else
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Could not detect local IP address"
    echo "Please ensure you are connected to a network"
    exit 1
fi

echo "✅ Detected local IP: $LOCAL_IP"

# Update .env.local
echo "📝 Updating .env.local..."
sed -i.bak "s|CONVEX_SELF_HOSTED_URL=http://.*:3210|CONVEX_SELF_HOSTED_URL=http://$LOCAL_IP:3210|g" .env.local
sed -i.bak "s|VITE_CONVEX_URL=http://.*:3210|VITE_CONVEX_URL=http://$LOCAL_IP:3210|g" .env.local
rm -f .env.local.bak

# Update network_security_config.xml - add new IP if not exists
NETWORK_CONFIG="android/app/src/main/res/xml/network_security_config.xml"
echo "📝 Updating network_security_config.xml..."

# Check if IP already exists in config
if grep -q "<domain includeSubdomains=\"true\">$LOCAL_IP</domain>" "$NETWORK_CONFIG"; then
    echo "✅ IP $LOCAL_IP already in network security config"
else
    # Add new IP before the closing domain-config tag
    sed -i.bak "s|</domain-config>|        <domain includeSubdomains=\"true\">$LOCAL_IP</domain>\n    </domain-config>|g" "$NETWORK_CONFIG"
    rm -f "${NETWORK_CONFIG}.bak"
    echo "✅ Added IP $LOCAL_IP to network security config"
fi

echo ""
echo "✅ All configuration files updated!"
echo "📱 Local IP: $LOCAL_IP"
echo ""
echo "Next steps:"
echo "1. Run: npx cap sync android"
echo "2. Rebuild the app: npx cap run android"
echo ""
