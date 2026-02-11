import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Location, Player } from '../types';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom chicken icon
const chickenIcon = L.divIcon({
    className: 'custom-chicken-icon',
    html: '<div style="font-size: 32px;">🐔</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

// Custom player icon
const playerIcon = L.divIcon({
    className: 'custom-player-icon',
    html: '<div style="font-size: 24px;">👤</div>',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
});

// Current user location icon (blue dot)
const myLocationIcon = L.divIcon({
    className: 'custom-my-location-icon',
    html: '<div style="width: 16px; height: 16px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

interface MapUpdaterProps {
    center: Location;
}

const MapUpdater: React.FC<MapUpdaterProps> = ({ center }) => {
    const map = useMap();

    useEffect(() => {
        map.setView([center.lat, center.lng], map.getZoom());
    }, [center.lat, center.lng, map]);

    return null;
};

interface GameMapProps {
    centerLocation: Location;
    chickenLocation?: Location | null;
    playerLocations?: Map<string, Player>;
    circleRadius?: number;
    showChicken?: boolean;
    showPlayers?: boolean;
    showCircle?: boolean;
    showMyLocation?: boolean;
}

export const GameMap: React.FC<GameMapProps> = ({
    centerLocation,
    chickenLocation,
    playerLocations,
    circleRadius,
    showChicken = false,
    showPlayers = false,
    showCircle = false,
    showMyLocation = true,
}) => {
    return (
        <MapContainer
            center={[centerLocation.lat, centerLocation.lng]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapUpdater center={centerLocation} />

            {/* Show circle around chicken */}
            {showCircle && chickenLocation && circleRadius !== undefined && (
                <Circle
                    center={[chickenLocation.lat, chickenLocation.lng]}
                    radius={circleRadius}
                    pathOptions={{
                        color: '#ff6b6b',
                        fillColor: '#ff6b6b',
                        fillOpacity: 0.1,
                        weight: 2,
                    }}
                />
            )}

            {/* Show chicken marker */}
            {showChicken && chickenLocation && (
                <Marker
                    position={[chickenLocation.lat, chickenLocation.lng]}
                    icon={chickenIcon}
                >
                    <Popup>
                        🐔 Chicken is here!
                    </Popup>
                </Marker>
            )}

            {/* Show player markers */}
            {showPlayers && playerLocations && Array.from(playerLocations.values()).map((player) => {
                if (!player.location) return null;
                return (
                    <Marker
                        key={player.userId}
                        position={[player.location.lat, player.location.lng]}
                        icon={playerIcon}
                    >
                        <Popup>
                            👤 {player.displayName}
                            {player.foundChicken && ' ✓ Found!'}
                        </Popup>
                    </Marker>
                );
            })}

            {/* Show my location marker */}
            {showMyLocation && centerLocation && (
                <Marker
                    position={[centerLocation.lat, centerLocation.lng]}
                    icon={myLocationIcon}
                >
                    <Popup>📍 You are here</Popup>
                </Marker>
            )}
        </MapContainer>
    );
};
