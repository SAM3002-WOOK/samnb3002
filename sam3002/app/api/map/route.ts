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

    // 1. 행정안전부/국토교통부 VWorld 도로명 검색 (API Key 없이 완전 개방)
    const vworldRoadUrl = `https://api.vworld.kr/req/address?service=address&request=getcoord&type=ROAD&address=${encodeURIComponent(cleanedLoc)}&key=CEB22FE7-7402-39E4-8468-B4C14A29288E`;
    const vres1 = await fetch(vworldRoadUrl);
    if (vres1.ok) {
      const vdata1 = await vres1.json();
      if (vdata1.response?.status === 'OK' && vdata1.response?.result?.point) {
        return NextResponse.json({
          success: true,
          lat: parseFloat(vdata1.response.result.point.y),
          lon: parseFloat(vdata1.response.result.point.x),
          found: true,
          location: cleanedLoc,
        });
      }
    }

    // 2. 지번(PARCEL) 주소 검색 백업
    const vworldParcelUrl = `https://api.vworld.kr/req/address?service=address&request=getcoord&type=PARCEL&address=${encodeURIComponent(cleanedLoc)}&key=CEB22FE7-7402-39E4-8468-B4C14A29288E`;
    const vres2 = await fetch(vworldParcelUrl);
    if (vres2.ok) {
      const vdata2 = await vres2.json();
      if (vdata2.response?.status === 'OK' && vdata2.response?.result?.point) {
        return NextResponse.json({
          success: true,
          lat: parseFloat(vdata2.response.result.point.y),
          lon: parseFloat(vdata2.response.result.point.x),
          found: true,
          location: cleanedLoc,
        });
      }
    }

    // 3. 글로벌 정밀 주소 연동 (OpenStreetMap Nominatim 한국어 검색)
    const searchQueries = [
      cleanedLoc,
      `대한민국 ${cleanedLoc}`,
      cleanedLoc.split(' ')[0] + ' ' + (cleanedLoc.split(' ')[1] || ''),
    ];

    for (const q of searchQueries) {
      const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=kr&limit=1`;
      const ores = await fetch(osmUrl, {
        headers: { 'User-Agent': 'SamchullySafetyApp/1.0 (contact@samchully.co.kr)' },
      });
      if (ores.ok) {
        const odata = await ores.json();
        if (odata && odata.length > 0) {
          return NextResponse.json({
            success: true,
            lat: parseFloat(odata[0].lat),
            lon: parseFloat(odata[0].lon),
            found: true,
            location: cleanedLoc,
          });
        }
      }
    }

    // 주소 검색 실패 시 평택/안성 관할 기본 좌표
    return NextResponse.json({
      success: true,
      lat: 36.9921,
      lon: 127.1128,
      found: false,
      location: rawLocation,
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