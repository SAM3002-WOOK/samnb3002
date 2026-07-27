// @ts-nocheck
'use client';

import { useState, useRef } from 'react';

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

  const [zoomLevel, setZoomLevel] = useState(17);
  const [markerPos, setMarkerPos] = useState({ x: 50, y: 50 }); // 마커 퍼센트 위치
  const [capturedMapImg, setCapturedMapImg] = useState<string | null>(null);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [detailImage, setDetailImage] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // 🔍 지도 확대 / 축소
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 1, 20));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 1, 12));

  // 🔴 지도 터치/클릭 시 동그라미 마커 이동
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    setMarkerPos({ x: xPercent, y: yPercent });
  };

  // 📸 현장 사진 첨부
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

  // 📸 [📸 현재 위치도 캡처하기] 버튼 기능 - 정밀 고화질 Canvas 지도로 캡처 생성
  const handleCaptureMap = () => {
    if (!formData.location) {
      alert('설치장소(주소)를 먼저 입력해 주세요.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 카카오/지오코더 베이스의 고화질 500:1 지도 타일 렌더링
    const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${encodeURIComponent(formData.location)}&zoom=${zoomLevel}&size=800x500&maptype=mapnik`;
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      ctx.drawImage(img, 0, 0, 800, 500);

      // 🔴 지정된 위치에 빨간 동그라미 타겟 그려 넣기
      const targetX = (markerPos.x / 100) * 800;
      const targetY = (markerPos.y / 100) * 500;

      ctx.beginPath();
      ctx.arc(targetX, targetY, 24, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ef4444';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(targetX, targetY, 7, 0, 2 * Math.PI);
      ctx.fillStyle = '#dc2626';
      ctx.fill();

      // 주소 라벨
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(15, 15, 450, 36);
      ctx.font = 'bold 15px "맑은 고딕", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`📍 위치: ${formData.location}`, 25, 39);

      setCapturedMapImg(canvas.toDataURL('image/png'));
      alert('📸 현재 위치도가 성공적으로 캡처되었습니다!');
    };

    img.onerror = () => {
      // 대체 지도 캔버스 생성
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, 800, 500);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 780, 480);

      const targetX = (markerPos.x / 100) * 800;
      const targetY = (markerPos.y / 100) * 500;

      ctx.beginPath();
      ctx.arc(targetX, targetY, 24, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ef4444';
      ctx.stroke();

      ctx.font = 'bold 18px "맑은 고딕", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(`📍 위치: ${formData.location}`, 400, 430);

      setCapturedMapImg(canvas.toDataURL('image/png'));
      alert('📸 위치도가 캡처되었습니다!');
    };

    img.src = staticMapUrl;
  };

  // ➕ 목록 추가
  const handleAddToList = async () => {
    if (!formData.facilityNo || !formData.facilityName || !formData.location) {
      alert('시설번호, 시설명, 설치장소를 입력해주세요.');
      return;
    }

    // 미리 캡처해둔 위치도가 없으면 자동 생성
    let finalMapImg = capturedMapImg;
    if (!finalMapImg) {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 800, 500);
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 780, 480);

        ctx.font = 'bold 18px "맑은 고딕", sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText(`📍 위치: ${formData.location}`, 400, 250);
        finalMapImg = canvas.toDataURL('image/png');
      }
    }

    const newItem = {
      id: items.length + 1,
      ...formData,
      date: new Date().toISOString().split('T')[0],
      mapImage: finalMapImg,
      fullImage,
      detailImage,
    };

    setItems([...items, newItem]);

    setFormData({
      facilityNo: '',
      facilityName: '',
      location: '',
      workName: '밸브 교체',
      reason: '',
      writer: formData.writer,
      remark: '',
    });
    setCapturedMapImg(null);
    setFullImage(null);
    setDetailImage(null);
    alert('목록에 성공적으로 추가되었습니다!');
  };

  // 📊 엑셀 파일 다운로드
  const exportToExcel = async () => {
    if (items.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    setIsExporting(true);

    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();

      // 시트 1: [투자 내역]
      const invSheet = workbook.addWorksheet('투자 내역');
      invSheet.views = [{ showGridLines: true }];

      invSheet.getColumn('A').width = 2.13;
      invSheet.getColumn('B').width = 13.0;
      invSheet.getColumn('C').width = 12.5;
      invSheet.getColumn('D').width = 27.13;
      invSheet.getColumn('E').width = 38.13;
      invSheet.getColumn('F').width = 40.88;

      invSheet.getCell('B2').value = '■ 당사 시설물별 기본 투자 내역 참고 자료';
      invSheet.getCell('B2').font = { name: '맑은 고딕', size: 11 };

      const invHeaders = ['구분', '시설물', '작업명', '세부 내역', '비고'];
      invHeaders.forEach((h, i) => {
        const colLetter = String.fromCharCode(66 + i);
        const cell = invSheet.getCell(`${colLetter}4`);
        cell.value = h;
        cell.font = { name: '맑은 고딕', size: 11, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      invSheet.getRow(4).height = 22.5;

      const invData = [
        [1, '정압기', '도색', '전체 도색', ''],
        [2, '', '', '흡 · 배기 방출관 도색', ''],
        [3, '', '', '출입문 도색', ''],
        [4, '', '', '휠터 1개소 도색', ''],
        [5, '', '', '배관 일부 도색 (50%)', ''],
        [6, '', '', '배관 지지대(서포트) 내화도색', ''],
        [7, '', '', '내부 벽면 도장(바다제외 5면)', ''],
        [8, '', '', '그 외 견적 시행', ''],
        [9, '', '방수', '출입구 2개소 방수', ''],
        [10, '', '', '슬리브 2개소 방수', ''],
        [11, '', '', '그 외 견적 시행', ''],
        [12, '', '전기통신 부품 교체', 'RTU외함 교체', ''],
        [13, '', '', '방폭등 교체', '변경 위치 표기'],
        [14, '', '', '방폭등 위치 변경 (견적시행)', ''],
        [15, '', '', 'MOV, SSV등 전선관 보수 1·2개소', ''],
        [16, '', '사다리 교체', '정압기실 1·2개소', ''],
        [17, '', '', '미끄럼방지 설치', ''],
        [18, '', '기 타', '그 외 특수 공사', ''],
        [19, '밸브', '인상/인하', '시설물 인상, 인하', ''],
        [20, '', '', '철괘 교체', ''],
        [21, '', '', '맨홀 주변 파손', '면적이 넓은 경우 폭 길이 측정 요망'],
        [22, '', '환경정리', '매몰형 이물질 제거', ''],
        [23, '', '', '박스형 이물질 제거', ''],
        [24, '', '철거/교체', '점검곤란 밸브 ', '사유 명확'],
        [25, '', '', '과심도 밸브', '심도 측정 사진 필요'],
        [26, '', '도색', '밸브실 도색', ''],
        [27, '', '', '인입밸브 100A이하 도색', ''],
        [28, '', '', '입상밸브 및 박스포함', ''],
        [29, '', '', '그 외 견적 시행', ''],
        [30, '', '방수', '출입구 1개소 방수', ''],
        [31, '', '', '슬리브 2개소 방수', ''],
        [32, '', '사다리 교체', '사다리 연장', '필요 길이 기입 요망'],
        [33, '', '', '사다리 교체', ''],
        [34, '전기방식', '철거', '부분 철거', ''],
        [35, '', '인상/인하', '시설물 인상, 인하', ''],
        [36, '', '', '철괘 교체', ''],
        [37, '', '', '맨홀 주변 파손', '면적이 넓은 경우 폭 길이 측정 요망'],
        [38, '', '신설', '신규 설치', ''],
        [39, '배관', '라인마크 설치', '검지공형 라인마크 설치', '설치 위치 명확한 사진 및 위치 필요'],
        [40, '', '', '일반 라인마크 설치', ''],
        [41, '', '철거', '미사용 인입 본관/공급관/인입관', '영업팀 문의 후 투자 수립 요망'],
        [42, '사용시설', '입상관 보호대', '50A 이하', ''],
        [43, '', '', '100A', ''],
      ];

      invData.forEach((rVals, idx) => {
        const rNum = idx + 5;
        const row = invSheet.getRow(rNum);
        row.values = ['', rVals[0], rVals[1], rVals[2], rVals[3], rVals[4]];
        row.font = { name: '맑은 고딕', size: 11 };
        row.alignment = { vertical: 'middle', horizontal: 'center' };
        row.height = 17.25;
      });

      const invMerges = [
        'C5:C22', 'D5:D12', 'D13:D15', 'D16:D19', 'D20:D21',
        'C23:C37', 'D23:D25', 'D26:D27', 'D28:D29', 'D30:D33', 'D34:D35', 'D36:D37', 'F36:F37',
        'C38:C42', 'D39:D41',
        'C43:C45', 'D43:D44', 'F43:F44',
        'C46:C47', 'D46:D47'
      ];
      invMerges.forEach(m => invSheet.mergeCells(m));

      for (let r = 4; r <= 47; r++) {
        for (let c = 2; c <= 6; c++) {
          invSheet.getCell(r, c).border = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        }
      }

      // 시트 2: [리스트]
      const listSheet = workbook.addWorksheet('리스트');
      listSheet.views = [{ showGridLines: true }];

      listSheet.getColumn('A').width = 2.75;
      listSheet.getColumn('B').width = 10.38;
      listSheet.getColumn('C').width = 15.25;
      listSheet.getColumn('D').width = 28.25;
      listSheet.getColumn('E').width = 36.88;
      listSheet.getColumn('F').width = 17.38;
      listSheet.getColumn('G').width = 22.38;
      listSheet.getColumn('H').width = 24.88;
      listSheet.getColumn('I').width = 13.0;
      listSheet.getColumn('J').width = 29.25;

      listSheet.getCell('B2').value = '2026년 안전투자 밸브 교체 사업계획 리스트';
      listSheet.getCell('B2').font = { name: '맑은 고딕', size: 14, bold: true };
      listSheet.getCell('B2').alignment = { vertical: 'middle' };
      listSheet.getRow(2).height = 20.25;

      const listHeaders = ['구분', '시설번호', '시설명', '시설위치', '등록일자', '작업명', '사유', '작성자', '비고'];
      listHeaders.forEach((h, i) => {
        const colLetter = String.fromCharCode(66 + i);
        const cell = listSheet.getCell(`${colLetter}4`);
        cell.value = h;
        cell.font = { name: '맑은 고딕', size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      listSheet.getRow(4).height = 17.25;

      items.forEach((item, idx) => {
        const rNum = idx + 5;
        const row = listSheet.getRow(rNum);
        row.values = [
          '',
          idx + 1,
          item.facilityNo,
          item.facilityName,
          item.location,
          item.date,
          item.workName,
          item.reason,
          item.writer,
          item.remark || ''
        ];
        row.font = { name: '맑은 고딕', size: 11 };
        row.alignment = { vertical: 'middle', horizontal: 'center' };
        row.height = 17.25;

        for (let c = 2; c <= 10; c++) {
          listSheet.getCell(rNum, c).border = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        }
      });

      // 시트 3~N: 개별 보고서 ('1', '2'...)
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const reportSheet = workbook.addWorksheet(`${idx + 1}`);
        reportSheet.views = [{ showGridLines: true }];

        reportSheet.getColumn('A').width = 1.75;
        reportSheet.getColumn('B').width = 13.0;
        reportSheet.getColumn('C').width = 13.0;
        reportSheet.getColumn('D').width = 21.63;
        reportSheet.getColumn('E').width = 15.63;
        reportSheet.getColumn('F').width = 15.75;
        reportSheet.getColumn('G').width = 13.0;
        reportSheet.getColumn('H').width = 19.38;

        reportSheet.getRow(1).height = 9.75;
        reportSheet.getRow(2).height = 20.25;
        reportSheet.getRow(3).height = 6.75;
        reportSheet.getRow(4).height = 17.25;
        reportSheet.getRow(5).height = 17.25;
        reportSheet.getRow(36).height = 9.75;
        reportSheet.getRow(37).height = 17.25;
        reportSheet.getRow(38).height = 17.25;

        reportSheet.mergeCells('B2:H2');
        const b2 = reportSheet.getCell('B2');
        b2.value = '위 치 도 및 사 진';
        b2.font = { name: '맑은 고딕', size: 14, bold: true };
        b2.alignment = { horizontal: 'center', vertical: 'middle' };

        reportSheet.mergeCells('B4:C4');
        reportSheet.getCell('B4').value = '시 설 번 호';
        reportSheet.getCell('D4').value = item.facilityNo;
        reportSheet.getCell('E4').value = '설 치 장 소';
        reportSheet.mergeCells('F4:H4');
        reportSheet.getCell('F4').value = item.location;

        reportSheet.mergeCells('B5:C5');
        reportSheet.getCell('B5').value = '작 업 명';
        reportSheet.getCell('D5').value = item.workName;
        reportSheet.getCell('E5').value = '사 유';
        reportSheet.mergeCells('F5:H5');
        reportSheet.getCell('F5').value = item.reason;

        [4, 5].forEach((r) => {
          for (let c = 2; c <= 8; c++) {
            const cell = reportSheet.getCell(r, c);
            cell.font = { name: '맑은 고딕', size: 11 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          }
        });

        // B6:H35 영역 완벽 병합 (위치도 틀)
        reportSheet.mergeCells('B6:H35');

        for (let r = 2; r <= 79; r++) {
          if ([1, 3, 36].includes(r)) continue;
          for (let c = 2; c <= 8; c++) {
            reportSheet.getCell(r, c).border = {
              top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
            };
          }
        }

        // 🌟 캡처된 정밀 지도 및 빨간 동그라미 표기를 B6:H35 영역에 삽입
        if (item.mapImage) {
          const mapImgId = workbook.addImage({
            base64: item.mapImage,
            extension: 'png',
          });
          reportSheet.addImage(mapImgId, {
            tl: { col: 1, row: 5 },  // B6
            br: { col: 8, row: 35 }, // H35
          });
        }

        reportSheet.mergeCells('B37:H38');
        const b37 = reportSheet.getCell('B37');
        b37.value = '현 장 사 진';
        b37.font = { name: '맑은 고딕', size: 14, bold: true };
        b37.alignment = { horizontal: 'center', vertical: 'middle' };

        reportSheet.mergeCells('B39:B59');
        const b39 = reportSheet.getCell('B39');
        b39.value = '전\n\n경\n\n사\n\n진';
        b39.font = { name: '맑은 고딕', size: 11 };
        b39.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

        reportSheet.mergeCells('C39:H59');

        reportSheet.mergeCells('B60:B79');
        const b60 = reportSheet.getCell('B60');
        b60.value = '상\n\n세\n\n사\n\n진';
        b60.font = { name: '맑은 고딕', size: 11 };
        b60.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

        reportSheet.mergeCells('C60:H79');

        if (item.fullImage) {
          const img1 = workbook.addImage({
            base64: item.fullImage,
            extension: 'png',
          });
          reportSheet.addImage(img1, {
            tl: { col: 2, row: 38 },
            br: { col: 8, row: 59 },
          });
        }

        if (item.detailImage) {
          const img2 = workbook.addImage({
            base64: item.detailImage,
            extension: 'png',
          });
          reportSheet.addImage(img2, {
            tl: { col: 2, row: 59 },
            br: { col: 8, row: 79 },
          });
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `안전투자_사업계획_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);

      alert('엑셀 파일이 정상적으로 다운로드되었습니다!');
    } catch {
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
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
                placeholder="예: AD 또는 VPTX0001-1" 
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
            <label className="text-xs font-bold text-gray-600 block mb-1">설치장소 (주소)</label>
            <input 
              type="text" 
              value={formData.location} 
              onChange={e => setFormData({ ...formData, location: e.target.value })} 
              placeholder="예: 공도읍 서동대로 3948 또는 진사리 11" 
              className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-semibold outline-none focus:border-blue-500" 
            />
            <span className="text-[10px] text-blue-600 font-medium mt-1 block">
              💡 지도 위치를 맞추신 후 상단의 <b>[📸 현재 위치도 캡처]</b> 버튼을 누르면 위치도가 적용됩니다.
            </span>
          </div>

          {/* 🗺️ 확대/축소 및 📸 [현재 위치도 캡처] 지원 지도 상자 */}
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-2">
            <div className="flex flex-wrap justify-between items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">🗺️ 터치로 🔴 위치 지정</span>
              <div className="flex items-center gap-1.5">
                <button 
                  type="button" 
                  onClick={handleZoomIn} 
                  className="bg-white border text-xs px-2 py-1 rounded-lg font-bold hover:bg-slate-100 shadow-sm"
                >
                  🔍 [+] 확대
                </button>
                <button 
                  type="button" 
                  onClick={handleZoomOut} 
                  className="bg-white border text-xs px-2 py-1 rounded-lg font-bold hover:bg-slate-100 shadow-sm"
                >
                  🔎 [-] 축소
                </button>
                <button 
                  type="button" 
                  onClick={handleCaptureMap} 
                  className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center gap-1"
                >
                  📸 현재 위치도 캡처
                </button>
              </div>
            </div>

            {/* 지도 박스 */}
            <div 
              onClick={handleMapClick}
              className="relative w-full h-60 rounded-xl overflow-hidden border border-slate-300 cursor-pointer shadow-inner bg-slate-200"
            >
              <iframe
                title="지도 미리보기"
                width="100%"
                height="100%"
                loading="lazy"
                style={{ border: 0, pointerEvents: 'none' }}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(formData.location || '경기도 안성시 서동대로 3948')}&t=&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`}
              />

              {/* 🔴 빨간 동그라미 위치 마커 */}
              <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-150 z-10"
                style={{ left: `${markerPos.x}%`, top: `${markerPos.y}%` }}
              >
                <div className="w-10 h-10 rounded-full bg-red-500/35 border-2 border-red-600 flex items-center justify-center animate-pulse shadow-lg">
                  <div className="w-3 h-3 rounded-full bg-red-600 shadow-md" />
                </div>
              </div>
            </div>

            {capturedMapImg && (
              <span className="text-[11px] font-bold text-emerald-600 block text-right">
                ✅ 위치도 캡처 완료! (엑셀에 자동 저장됩니다)
              </span>
            )}
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

          {/* 요청하신 [비고] 입력칸 추가 */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">비고</label>
            <input 
              type="text" 
              value={formData.remark} 
              onChange={e => setFormData({ ...formData, remark: e.target.value })} 
              placeholder="예: 기타 참고 및 특이사항 입력" 
              className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-semibold outline-none focus:border-blue-500" 
            />
          </div>

          {/* 현장 사진 첨부 2종 */}
          <div className="space-y-3 pt-2 border-t">
            <h3 className="text-xs font-bold text-gray-700">📸 현장 사진 첨부 (2종)</h3>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="border-2 border-dashed border-slate-200 p-3 rounded-2xl bg-slate-50">
                <span className="text-xs font-bold block mb-1.5 text-slate-700">1. 전경 사진</span>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setFullImage)} className="hidden" id="full-upload" />
                <label htmlFor="full-upload" className="cursor-pointer bg-white border text-xs py-2 rounded-xl font-bold block truncate text-blue-600 shadow-sm">
                  {fullImage ? '✅ 촬영/선택 완료' : '📸 사진 촬영/선택'}
                </label>
              </div>

              <div className="border-2 border-dashed border-slate-200 p-3 rounded-2xl bg-slate-50">
                <span className="text-xs font-bold block mb-1.5 text-slate-700">2. 상세 사진</span>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setDetailImage)} className="hidden" id="detail-upload" />
                <label htmlFor="detail-upload" className="cursor-pointer bg-white border text-xs py-2 rounded-xl font-bold block truncate text-blue-600 shadow-sm">
                  {detailImage ? '✅ 촬영/선택 완료' : '📸 사진 촬영/선택'}
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

        {/* 등록 목록 & 엑셀 다운로드 */}
        <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-200 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-base font-bold text-slate-900">📊 등록 목록 ({items.length}건)</h2>
            <button 
              onClick={exportToExcel} 
              disabled={isExporting}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1"
            >
              {isExporting ? '⏳ 엑셀 생성 중...' : '📥 엑셀 다운로드'}
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