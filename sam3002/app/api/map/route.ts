// @ts-nocheck
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');

  if (!location) {
    return NextResponse.json({ error: '설치장소(주소)를 먼저 입력해 주세요.' }, { status: 400 });
  }

  try {
    // 1. 서버 단에서 주소를 위도/경도로 변환 (Nominatim OpenGeocoding)
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&countrycodes=kr`;
    const geoRes = await fetch(geocodeUrl, {
      headers: { 'User-Agent': 'SamchullySafetyApp/1.0' },
    });
    const geoData = await geoRes.json();

    let lat = 37.5665;
    let lon = 126.9780;

    if (geoData && geoData.length > 0) {
      lat = parseFloat(geoData[0].lat);
      lon = parseFloat(geoData[0].lon);
    } else {
      // 한국어 보완 검색
      const fallbackGeoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent('대한민국 ' + location)}`;
      const fallbackRes = await fetch(fallbackGeoUrl, {
        headers: { 'User-Agent': 'SamchullySafetyApp/1.0' },
      });
      const fallbackData = await fallbackRes.json();
      if (fallbackData && fallbackData.length > 0) {
        lat = parseFloat(fallbackData[0].lat);
        lon = parseFloat(fallbackData[0].lon);
      }
    }

    // 2. 서버 단에서 지도 이미지 Fetch (CORS 차단 완전 우회!)
    let staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=17&size=800x500&markers=${lat},${lon},ol-marker`;

    let imgRes = await fetch(staticMapUrl);

    if (!imgRes.ok) {
      // 백업 지도 서버
      staticMapUrl = `https://static-maps.yandex.ru/1.x/?l=map&pt=${lon},${lat},pm2rdm&z=17&size=650,450&lang=en_US`;
      imgRes = await fetch(staticMapUrl);
    }

    const arrayBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      base64: `data:image/png;base64,${base64}`,
      lat,
      lon,
    });
  } catch (error) {
    console.error('지도 자동 생성 실패:', error);
    return NextResponse.json({ error: '지도 자동 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}