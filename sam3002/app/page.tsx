'use client';

import { useState } from 'react';

export default function SafetyInvestmentApp() {
  const [formData, setFormData] = useState({
    facilityNo: '',
    facilityName: '',
    location: '',
    workName: '밸브 교체',
    reason: '',
    writer: '',
    remark: '',
  });

  const [fullImage, setFullImage] = useState<string | null>(null);
  const [detailImage, setDetailImage] = useState<string | null>(null);

  const [items, setItems] = useState<any[]>([]);

  // 📍 GPS 현재 위치 주소/좌표 추출
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('GPS를 지원하지 않는 브라우저입니다.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // 깔끔한 좌표 형태로 저장
        setFormData(prev => ({ 
          ...prev, 
          location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` 
        }));
        alert('GPS 좌표 추출 완료!');
      },
      () => alert('위치 정보를 가져올 수 없습니다. GPS 권한을 허용해주세요.')
    );
  };

  // 🗺️ 네이버 지도 검색 (주소/좌표 모두 호환)
  const handleOpenNaverMap = () => {
    if (!formData.location && !formData.facilityName) {
      alert('설치장소(주소) 또는 시설명을 먼저 입력해주세요.');
      return;
    }
    const searchQuery = formData.location || formData.facilityName;
    window.open(`https://map.naver.com/v5/search/${encodeURIComponent(searchQuery)}`, '_blank');
  };

  // 📸 이미지 파일 Base64 변환
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ➕ 리스트 추가
  const handleAddToList = () => {
    if (!formData.facilityNo || !formData.facilityName) {
      alert('시설번호와 시설명을 입력해주세요.');
      return;
    }

    const newItem = {
      id: items.length + 1,
      ...formData,
      date: new Date().toISOString().split('T')[0],
      fullImage,
      detailImage,
    };

    setItems([...items, newItem]);

    // 입력 폼 초기화
    setFormData({
      facilityNo: '',
      facilityName: '',
      location: '',
      workName: '밸브 교체',
      reason: '',
      writer: formData.writer,
      remark: '',
    });
    setFullImage(null);
    setDetailImage(null);
    alert('목록에 성공적으로 추가되었습니다!');
  };

  // 🌐 카카오 static map을 통해 주소/좌표로 지도 이미지 자동 생성 보조 함수
  const fetchStaticMapImage = async (locationStr: string): Promise<string | null> => {
    try {
      // 카카오 정적 지도 API 오픈 URL 활용 (줌 레벨 3)
      const mapUrl = `https://map2.daum.net/map/imageserver/v2/STATICMAP?w=600&h=350&coordX=&coordY=&q=${encodeURIComponent(locationStr)}&level=3`;
      const response = await fetch(mapUrl);
      const blob = await response.blob();
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  // 📊 엑셀 다운로드 (자동 위치도 + 현장사진 2종)
  const exportToExcel = async () => {
    if (items.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    try {
      const ExcelJS = (await import('exceljs')).default;
      const { saveAs } = await import('file-saver');

      const workbook = new ExcelJS.Workbook();

      // 1. [리스트] 시트
      const listSheet = workbook.addWorksheet('리스트');
      listSheet.addRow(['2026년 안전투자 밸브 교체 사업계획 리스트']);
      listSheet.addRow([]);
      listSheet.addRow(['구분', '시설번호', '시설명', '설치장소', '등록일자', '작업명', '사유', '작성자', '비고']);

      items.forEach((item, idx) => {
        listSheet.addRow([
          idx + 1,
          item.facilityNo,
          item.facilityName,
          item.location,
          item.date,
          item.workName,
          item.reason,
          item.writer,
          item.remark,
        ]);
      });

      // 2. 개별 리포트 시트 생성
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const reportSheet = workbook.addWorksheet(`${idx + 1}`);

        reportSheet.addRow(['위 치 도 및 사 진']);
        reportSheet.addRow(['시 설 번 호', item.facilityNo, '', '설 치 장 소', item.location]);
        reportSheet.addRow(['작 업 명', item.workName, '', '사 유', item.reason]);
        reportSheet.addRow([]);

        const addPhotoToSheet = (base64Img: string | null, startRow: number, height: number = 260) => {
          if (!base64Img) return;
          const imageId = workbook.addImage({
            base64: base64Img,
            extension: 'png',
          });
          reportSheet.addImage(imageId, {
            tl: { col: 1, row: startRow },
            ext: { width: 520, height: height },
          });
        };

        // 🗺️ 위치도 지도 이미지 자동 생성 및 삽입
        if (item.location) {
          const autoMapImg = await fetchStaticMapImage(item.location);
          if (autoMapImg) {
            addPhotoToSheet(autoMapImg, 5, 280);
          }
        }

        reportSheet.getCell('B38').value = '현 장 사 진';
        if (item.fullImage) addPhotoToSheet(item.fullImage, 39, 240);
        if (item.detailImage) addPhotoToSheet(item.detailImage, 59, 240);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `안전투자_사업계획_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch {
      alert('엑셀 파일 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 font-sans text-gray-800">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* 헤더 */}
        <div className="bg-white p-5 rounded-3xl shadow-sm text-center border border-slate-200 space-y-2">
          <div className="flex justify-center">
            <img src="/logo.png" alt="삼천리 로고" className="h-10 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">안전투자 사업계획 등록 시스템</h1>
          <p className="text-xs text-gray-500">모바일 현장 조사 및 자동 위치도 엑셀 출력</p>
        </div>

        {/* 입력 폼 */}
        <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-blue-900 border-b pb-2">📋 현장 시설 정보 입력</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">작성자</label>
              <input 
                type="text" 
                value={formData.writer} 
                onChange={e => setFormData({ ...formData, writer: e.target.value })} 
                placeholder="성명" 
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-semibold outline-none focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">시설번호</label>
              <input 
                type="text" 
                value={formData.facilityNo} 
                onChange={e => setFormData({ ...formData, facilityNo: e.target.value })} 
                placeholder="예: AD" 
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-semibold outline-none focus:border-blue-500" 
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">시설명</label>
            <input 
              type="text" 
              value={formData.facilityName} 
              onChange={e => setFormData({ ...formData, facilityName: e.target.value })} 
              placeholder="예: 삼천리 남부 인입" 
              className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-semibold outline-none focus:border-blue-500" 
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-600">설치장소 (주소 또는 좌표)</label>
              <div className="flex gap-1.5">
                <button 
                  type="button" 
                  onClick={handleOpenNaverMap} 
                  className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-200"
                >
                  🗺️ 네이버 지도
                </button>
                <button 
                  type="button" 
                  onClick={handleGetLocation} 
                  className="text-[11px] bg-sky-100 text-sky-800 font-bold px-2.5 py-1 rounded-lg hover:bg-sky-200"
                >
                  📍 GPS 추출
                </button>
              </div>
            </div>
            <input 
              type="text" 
              value={formData.location} 
              onChange={e => setFormData({ ...formData, location: e.target.value })} 
              placeholder="예: 공도읍 서동대로 3948 또는 GPS 클릭" 
              className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-semibold outline-none focus:border-blue-500" 
            />
            <span className="text-[10px] text-gray-400 mt-1 block">💡 위치도는 입력하신 주소/좌표 기반으로 엑셀 출력 시 자동 첨부됩니다.</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">작업명</label>
              <input 
                type="text" 
                value={formData.workName} 
                onChange={e => setFormData({ ...formData, workName: e.target.value })} 
                placeholder="예: 밸브 교체" 
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-semibold outline-none focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">사유</label>
              <input 
                type="text" 
                value={formData.reason} 
                onChange={e => setFormData({ ...formData, reason: e.target.value })} 
                placeholder="예: 누환" 
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-semibold outline-none focus:border-blue-500" 
              />
            </div>
          </div>

          {/* 현장 사진 첨부 2종 */}
          <div className="space-y-3 pt-2 border-t">
            <h3 className="text-xs font-bold text-gray-700">📸 현장 사진 첨부 (2종)</h3>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="border-2 border-dashed border-slate-200 p-3 rounded-2xl bg-slate-50">
                <span className="text-xs font-bold block mb-1.5 text-slate-700">1. 전경 사진</span>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setFullImage)} className="hidden" id="full-upload" />
                <label htmlFor="full-upload" className="cursor-pointer bg-white border text-xs py-2 rounded-xl font-bold block truncate text-blue-600 shadow-sm">
                  {fullImage ? '✅ 등록 완료' : '📸 사진 촬영/선택'}
                </label>
              </div>

              <div className="border-2 border-dashed border-slate-200 p-3 rounded-2xl bg-slate-50">
                <span className="text-xs font-bold block mb-1.5 text-slate-700">2. 상세 사진</span>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setDetailImage)} className="hidden" id="detail-upload" />
                <label htmlFor="detail-upload" className="cursor-pointer bg-white border text-xs py-2 rounded-xl font-bold block truncate text-blue-600 shadow-sm">
                  {detailImage ? '✅ 등록 완료' : '📸 사진 촬영/선택'}
                </label>
              </div>
            </div>
          </div>

          <button 
            onClick={handleAddToList} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-md transition active:scale-[0.98]"
          >
            + 리스트에 추가하기
          </button>
        </div>

        {/* 사업계획 목록 & 엑셀 저장 */}
        <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-200 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-base font-bold text-slate-900">📊 등록 목록 ({items.length}건)</h2>
            <button 
              onClick={exportToExcel} 
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1"
            >
              📥 엑셀 다운로드
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-6">등록된 시설물이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.id} className="p-3 bg-slate-50 border rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-blue-900">[{item.facilityNo}] {item.facilityName}</span>
                    <p className="text-gray-500 mt-0.5">{item.location} | {item.workName}</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg font-bold">#{idx + 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}