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
    
    // 1차: 대한민국 국토교통부 브이월드(VWorld) 주소 검색 엔진 API
    const vworldUrl = `https://api.vworld.kr/req/address?service=address&request=getcoord&type=ROAD&address=${encodeURIComponent(cleanedLoc)}&key=CEB22FE7-7402-39E4-8468-B4C14A29288E`;
    const vres = await fetch(vworldUrl);
    
    if (vres.ok) {
      const vdata = await vres.json();
      if (vdata.response?.status === 'OK' && vdata.response?.result?.point) {
        const x = parseFloat(vdata.response.result.point.x); // 경도 lon
        const y = parseFloat(vdata.response.result.point.y); // 위도 lat
        return NextResponse.json({
          success: true,
          lat: y,
          lon: x,
          found: true,
          location: cleanedLoc,
        });
      }
    }

    // 1차 도로명 실패 시 지번(PARCEL) 검색
    const vworldParcelUrl = `https://api.vworld.kr/req/address?service=address&request=getcoord&type=PARCEL&address=${encodeURIComponent(cleanedLoc)}&key=CEB22FE7-7402-39E4-8468-B4C14A29288E`;
    const vres2 = await fetch(vworldParcelUrl);
    if (vres2.ok) {
      const vdata2 = await vres2.json();
      if (vdata2.response?.status === 'OK' && vdata2.response?.result?.point) {
        const x = parseFloat(vdata2.response.result.point.x);
        const y = parseFloat(vdata2.response.result.point.y);
        return NextResponse.json({
          success: true,
          lat: y,
          lon: x,
          found: true,
          location: cleanedLoc,
        });
      }
    }

    // 2차 백업: OpenStreetMap
    const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent('대한민국 ' + cleanedLoc)}&limit=1`;
    const ores = await fetch(osmUrl, {
      headers: { 'User-Agent': 'SamchullySafetyApp/1.0' },
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

    // 기본 위치 (평택 삼천리 관할 구역 중심)
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