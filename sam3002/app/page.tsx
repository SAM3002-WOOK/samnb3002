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

  const [mapImage, setMapImage] = useState<string | null>(null);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [detailImage, setDetailImage] = useState<string | null>(null);

  const [items, setItems] = useState<any[]>([]);

  // 📍 GPS 현재 위치 주소 자동 등록
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('GPS를 지원하지 않는 브라우저입니다.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({ 
          ...prev, 
          location: `위도: ${latitude.toFixed(5)}, 경도: ${longitude.toFixed(5)}` 
        }));
        alert('GPS 좌표를 성공적으로 가져왔습니다!');
      },
      () => alert('위치 정보를 가져올 수 없습니다. GPS 권한을 허용해주세요.')
    );
  };

  // 📸 이미지 선택 처리 (Base64 변환)
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

  // ➕ 리스트에 데이터 추가
  const handleAddToList = () => {
    if (!formData.facilityNo || !formData.facilityName) {
      alert('시설번호와 시설명을 입력해주세요.');
      return;
    }

    const newItem = {
      id: items.length + 1,
      ...formData,
      date: new Date().toISOString().split('T')[0],
      mapImage,
      fullImage,
      detailImage,
    };

    setItems([...items, newItem]);

    // 폼 입력값 초기화
    setFormData({
      facilityNo: '',
      facilityName: '',
      location: '',
      workName: '밸브 교체',
      reason: '',
      writer: formData.writer, // 작성자 이름은 유지
      remark: '',
    });
    setMapImage(null);
    setFullImage(null);
    setDetailImage(null);
    alert('목록에 성공적으로 추가되었습니다!');
  };

  // 📊 안전투자 양식 엑셀(사진 및 시트 생성) 동적 다운로드
  const exportToExcel = async () => {
    if (items.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    try {
      // 빌드 오류 방지를 위한 동적 임포트
      const ExcelJS = (await import('exceljs')).default;
      const { saveAs } = await import('file-saver');

      const workbook = new ExcelJS.Workbook();

      // 1. [리스트] 시트 생성
      const listSheet = workbook.addWorksheet('리스트');
      listSheet.addRow(['2026년 안전투자 밸브 교체 사업계획 리스트']);
      listSheet.addRow([]);
      listSheet.addRow(['구분', '시설번호', '시설명', '시설위치', '등록일자', '작업명', '사유', '작성자', '비고']);

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

      // 2. 각 항목별 개별 사진 보고서 시트 생성 (시트명: 1, 2, 3...)
      items.forEach((item, idx) => {
        const reportSheet = workbook.addWorksheet(`${idx + 1}`);

        reportSheet.addRow(['위 치 도 및 사 진']);
        reportSheet.addRow([]);
        reportSheet.addRow(['시 설 번 호', item.facilityNo, '', '설 치 장 소', item.location]);
        reportSheet.addRow(['작 업 명', item.workName, '', '사 유', item.reason]);
        reportSheet.addRow([]);

        // 이미지 추가 보조 함수
        const addPhotoToSheet = (base64Img: string | null, startRow: number) => {
          if (!base64Img) return;
          const imageId = workbook.addImage({
            base64: base64Img,
            extension: 'png',
          });
          reportSheet.addImage(imageId, {
            tl: { col: 1, row: startRow },
            ext: { width: 450, height: 280 },
          });
        };

        if (item.mapImage) addPhotoToSheet(item.mapImage, 5);
        if (item.fullImage) addPhotoToSheet(item.fullImage, 21);
        if (item.detailImage) addPhotoToSheet(item.detailImage, 37);
      });

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
          <p className="text-xs text-gray-500">모바일 현장 조사 및 사진 엑셀 출력</p>
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
                placeholder="예: VPTX0001-1" 
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
              <label className="text-xs font-bold text-gray-600">시설 위치 (주소/위치)</label>
              <button 
                type="button" 
                onClick={handleGetLocation} 
                className="text-[11px] bg-sky-100 text-sky-800 font-bold px-2.5 py-1 rounded-lg hover:bg-sky-200"
              >
                📍 GPS 현위치 추출
              </button>
            </div>
            <input 
              type="text" 
              value={formData.location} 
              onChange={e => setFormData({ ...formData, location: e.target.value })} 
              placeholder="주소 직접 입력 또는 GPS 버튼 터치" 
              className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-semibold outline-none focus:border-blue-500" 
            />
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
                placeholder="예: 밸브 손상" 
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-semibold outline-none focus:border-blue-500" 
              />
            </div>
          </div>

          {/* 사진 첨부 3종 */}
          <div className="space-y-3 pt-2 border-t">
            <h3 className="text-xs font-bold text-gray-700">📸 현장 사진 첨부</h3>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="border-2 border-dashed border-slate-200 p-2 rounded-2xl bg-slate-50">
                <span className="text-[11px] font-bold block mb-1">1. 위치도</span>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setMapImage)} className="hidden" id="map-upload" />
                <label htmlFor="map-upload" className="cursor-pointer bg-white border text-xs px-2 py-1.5 rounded-xl font-bold block truncate">
                  {mapImage ? '✅ 등록됨' : '📸 촬영/선택'}
                </label>
              </div>

              <div className="border-2 border-dashed border-slate-200 p-2 rounded-2xl bg-slate-50">
                <span className="text-[11px] font-bold block mb-1">2. 전경사진</span>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setFullImage)} className="hidden" id="full-upload" />
                <label htmlFor="full-upload" className="cursor-pointer bg-white border text-xs px-2 py-1.5 rounded-xl font-bold block truncate">
                  {fullImage ? '✅ 등록됨' : '📸 촬영/선택'}
                </label>
              </div>

              <div className="border-2 border-dashed border-slate-200 p-2 rounded-2xl bg-slate-50">
                <span className="text-[11px] font-bold block mb-1">3. 상세사진</span>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setDetailImage)} className="hidden" id="detail-upload" />
                <label htmlFor="detail-upload" className="cursor-pointer bg-white border text-xs px-2 py-1.5 rounded-xl font-bold block truncate">
                  {detailImage ? '✅ 등록됨' : '📸 촬영/선택'}
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
            <h2 className="text-base font-bold text-slate-900">📊 사업계획 등록 목록 ({items.length}건)</h2>
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