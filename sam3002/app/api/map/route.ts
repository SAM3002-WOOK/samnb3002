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

    // 1차: 구글 지도 지오코딩 API (Google Geocoding API)
    const googleGeoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanedLoc + ', 대한민국')}&language=ko`;
    const gres = await fetch(googleGeoUrl);

    if (gres.ok) {
      const gdata = await gres.json();
      if (gdata.status === 'OK' && gdata.results && gdata.results.length > 0) {
        const location = gdata.results[0].geometry.location;
        return NextResponse.json({
          success: true,
          lat: location.lat,
          lon: location.lng,
          found: true,
          location: cleanedLoc,
        });
      }
    }

    // 2차 백업: 국토교통부 VWorld API
    const vworldUrl = `https://api.vworld.kr/req/address?service=address&request=getcoord&type=ROAD&address=${encodeURIComponent(cleanedLoc)}&key=CEB22FE7-7402-39E4-8468-B4C14A29288E`;
    const vres = await fetch(vworldUrl);
    if (vres.ok) {
      const vdata = await vres.json();
      if (vdata.response?.status === 'OK' && vdata.response?.result?.point) {
        return NextResponse.json({
          success: true,
          lat: parseFloat(vdata.response.result.point.y),
          lon: parseFloat(vdata.response.result.point.x),
          found: true,
          location: cleanedLoc,
        });
      }
    }

    // 기본 위치 (평택 삼천리 관할 구역)
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