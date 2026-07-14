"use client";

import { useEffect, useRef } from "react";
import type { PlaceCandidate } from "@/modules/plans/types";

declare global {
  interface Window {
    kakao?: {
      maps: {
        load(callback: () => void): void;
        LatLng: new (latitude: number, longitude: number) => unknown;
        Map: new (
          element: HTMLElement,
          options: { center: unknown; level: number },
        ) => unknown;
        Marker: new (options: {
          map: unknown;
          position: unknown;
          title: string;
        }) => object;
        event: {
          addListener(
            target: object,
            eventName: "click",
            listener: () => void,
          ): void;
        };
      };
    };
  }
}

export function MapCanvas({
  places,
  selectedPlaceId,
  selectedPlaceIds = [],
  onSelect,
}: {
  places: PlaceCandidate[];
  selectedPlaceId?: string;
  selectedPlaceIds?: string[];
  onSelect: (id: string) => void;
}) {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!appKey || !mapRef.current || places.length === 0) return;
    const render = () => {
      if (!window.kakao || !mapRef.current) return;
      window.kakao.maps.load(() => {
        if (!window.kakao || !mapRef.current) return;
        const center = new window.kakao.maps.LatLng(
          places[0].latitude,
          places[0].longitude,
        );
        const map = new window.kakao.maps.Map(mapRef.current, {
          center,
          level: 6,
        });
        for (const place of places) {
          const marker = new window.kakao.maps.Marker({
            map,
            position: new window.kakao.maps.LatLng(
              place.latitude,
              place.longitude,
            ),
            title: place.name,
          });
          window.kakao.maps.event.addListener(marker, "click", () =>
            onSelect(place.id),
          );
        }
      });
    };
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-supro-kakao]",
    );
    if (existing) {
      render();
      return;
    }
    const script = document.createElement("script");
    script.dataset.suproKakao = "true";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.onload = render;
    document.head.appendChild(script);
  }, [appKey, onSelect, places]);

  if (appKey) {
    return (
      <>
        <div
          className="map-canvas"
          ref={mapRef}
          role="img"
          aria-label="Kakao 지도 위 체험학습 장소"
        />
        <AccessiblePlaceList
          places={places}
          selectedPlaceId={selectedPlaceId}
          selectedPlaceIds={selectedPlaceIds}
          onSelect={onSelect}
        />
      </>
    );
  }

  const latitudes = places.map((place) => place.latitude);
  const longitudes = places.map((place) => place.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const position = (place: PlaceCandidate) => ({
    left: `${15 + ((place.longitude - minLng) / Math.max(maxLng - minLng, 0.001)) * 70}%`,
    top: `${82 - ((place.latitude - minLat) / Math.max(maxLat - minLat, 0.001)) * 65}%`,
  });

  return (
    <>
      <div
        className="map-canvas"
        role="img"
        aria-label="시연용 대한민국 지도 개념도. 아래 장소 목록으로도 같은 정보를 확인할 수 있습니다."
      >
        <svg viewBox="0 0 700 580" aria-hidden="true">
          <defs>
            <pattern
              id="grid"
              width="42"
              height="42"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M42 0H0V42"
                fill="none"
                stroke="#cad8d0"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="700" height="580" fill="url(#grid)" />
          <path
            d="M15 430 C160 360, 245 475, 390 380 S590 300, 705 360"
            fill="none"
            stroke="#b8d4dd"
            strokeWidth="35"
            opacity=".65"
          />
          <path
            d="M40 90 C170 170, 275 115, 410 205 S585 245, 680 190"
            fill="none"
            stroke="#bfd7c5"
            strokeWidth="70"
            opacity=".45"
          />
          <path
            d="M110 455 L305 282 L475 118"
            fill="none"
            stroke="#f2b44a"
            strokeWidth="7"
            strokeDasharray="12 8"
          />
        </svg>
        <div className="map-label">
          <b>접근 가능한 fixture 지도</b>
          <br />
          실제 위치·경로가 아닌 시연 개념도
        </div>
        {places.map((place, index) => (
          <button
            key={place.id}
            type="button"
            className={`marker ${selectedPlaceIds.includes(place.id) ? "planned" : ""} ${selectedPlaceId === place.id ? "selected" : ""}`}
            style={position(place)}
            aria-label={`${place.name} 선택`}
            onClick={() => onSelect(place.id)}
          >
            <span>{index + 1}</span>
          </button>
        ))}
      </div>
      <AccessiblePlaceList
        places={places}
        selectedPlaceId={selectedPlaceId}
        selectedPlaceIds={selectedPlaceIds}
        onSelect={onSelect}
      />
    </>
  );
}

function AccessiblePlaceList({
  places,
  selectedPlaceId,
  selectedPlaceIds,
  onSelect,
}: {
  places: PlaceCandidate[];
  selectedPlaceId?: string;
  selectedPlaceIds: string[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="place-list" aria-label="지도 대체 장소 목록">
      {places.map((place, index) => (
        <button
          key={place.id}
          type="button"
          aria-pressed={selectedPlaceId === place.id}
          onClick={() => onSelect(place.id)}
        >
          {index + 1}. {place.name}
          {selectedPlaceIds.includes(place.id) ? " · ✓ 일정 선택" : ""} —{" "}
          {place.address}
        </button>
      ))}
    </div>
  );
}
