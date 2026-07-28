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
    // 카카오/네이버 주소 검색 패턴 대응 다중 후보군
    const searchCandidates = [
      cleanedLoc,
      `대한민국 ${cleanedLoc}`,
      `경기도 ${cleanedLoc}`,
      cleanedLoc.split(' ')[0] + ' ' + (cleanedLoc.split(' ')[1] || ''),
    ];

    let lat = 36.9921;
    let lon = 127.1128;
    let found = false;

    for (const query of searchCandidates) {
      if (!query.trim()) continue;
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=kr&limit=1`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'SamchullySafetyApp/1.0',
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
        console.warn('Geocode search failed:', query, e);
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
    return NextResponse.json({
      success: true,
      lat: 36.9921,
      lon: 127.1128,
      found: false,
      location: rawLocation,
    });
  }
}