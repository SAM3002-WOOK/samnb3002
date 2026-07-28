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

    // 1. 카카오/네이버와 동일한 한국 도로명 주소 정밀 검색 (Kakao/Daum Geocode Public Endpoint)
    const kakaoGeoUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(cleanedLoc)}`;
    const kres = await fetch(kakaoGeoUrl, {
      headers: {
        Authorization: 'KakaoAK 117c2f1f50a8a6552a420b9e86095368', // 공용 REST Key
      },
    });

    if (kres.ok) {
      const kdata = await kres.json();
      if (kdata.documents && kdata.documents.length > 0) {
        const doc = kdata.documents[0];
        return NextResponse.json({
          success: true,
          lat: parseFloat(doc.y), // 위도
          lon: parseFloat(doc.x), // 경도
          found: true,
          location: cleanedLoc,
        });
      }
    }

    // 2. 카카오 키워드 장소 검색 백업
    const kakaoKeywordUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(cleanedLoc)}`;
    const kres2 = await fetch(kakaoKeywordUrl, {
      headers: {
        Authorization: 'KakaoAK 117c2f1f50a8a6552a420b9e86095368',
      },
    });

    if (kres2.ok) {
      const kdata2 = await kres2.json();
      if (kdata2.documents && kdata2.documents.length > 0) {
        const doc2 = kdata2.documents[0];
        return NextResponse.json({
          success: true,
          lat: parseFloat(doc2.y),
          lon: parseFloat(doc2.x),
          found: true,
          location: cleanedLoc,
        });
      }
    }

    // 3. 브이월드(VWorld) 국토교통부 백업
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

    return NextResponse.json({
      success: false,
      error: '주소를 정확히 찾을 수 없습니다.',
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: '주소 검색 처리 중 에러가 발생했습니다.',
    });
  }
}