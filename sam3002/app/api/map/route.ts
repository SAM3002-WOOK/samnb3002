// @ts-nocheck
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawLocation = searchParams.get('location') || '';

  if (!rawLocation.trim()) {
    return NextResponse.json({ error: '설치장소(주소)를 먼저 입력해 주세요.' }, { status: 400 });
  }

  try {
    const cleanedLoc = rawLocation.trim();
    // 동/도로명 단위 추출 (예: "용이동 750-6" -> "용이동")
    const parts = cleanedLoc.split(' ');
    const mainDong = parts[0] || cleanedLoc;

    const searchCandidates = [
      cleanedLoc,
      `대한민국 ${cleanedLoc}`,
      `대한민국 경기도 ${cleanedLoc}`,
      `대한민국 ${mainDong}`,
    ];

    let lat = 37.5665;
    let lon = 126.9780;
    let found = false;

    for (const query of searchCandidates) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'SamchullySafetyApp/1.0 (contact@samchully.co.kr)',
            'Accept-Language': 'ko-KR,ko;q=0.9',
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0 && data[0].lat && data[0].lon) {
            lat = parseFloat(data[0].lat);
            lon = parseFloat(data[0].lon);
            found = true;
            break;
          }
        }
      } catch (e) {
        console.warn('Geocode candidate search warning:', query, e);
      }
    }

    return NextResponse.json({
      success: true,
      lat,
      lon,
      found,
      location: cleanedLoc,
    });
  } catch (error) {
    console.error('API Error:', error);
    // 서버 에러로 튕기지 않고 평택/기본 좌표로 안전 반환
    return NextResponse.json({
      success: true,
      lat: 36.9921,
      lon: 127.1128,
      found: false,
      location: rawLocation,
    });
  }
}