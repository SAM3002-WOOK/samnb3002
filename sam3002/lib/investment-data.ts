// lib/investment-data.ts

/**
 * 삼천리 안전관리 투자 표준 데이터
 *
 * 공식 표준표의 구분번호 1~43을 그대로 ID로 사용합니다.
 *
 * AI 역할:
 * 현장 자연어를 분석하여 1~43 중 가장 적합한 itemId를 추천
 *
 * 프로그램 역할:
 * itemId를 기준으로 실제 시설물 / 작업명 / 세부내역을 조회
 */

export type InvestmentItem = {
  readonly id: number;
  readonly category: string;
  readonly workName: string;
  readonly detailWork: string;
};


// ============================================================
// 1. 삼천리 공식 투자 표준 데이터 1~43
// ============================================================

export const INVESTMENT_ITEMS = [
  // ----------------------------------------------------------
  // 정압기
  // ----------------------------------------------------------

  {
    id: 1,
    category: '정압기',
    workName: '도색',
    detailWork: '전체 도색',
  },

  {
    id: 2,
    category: '정압기',
    workName: '도색',
    detailWork: '흡 · 배기 방출관 도색',
  },

  {
    id: 3,
    category: '정압기',
    workName: '도색',
    detailWork: '출입문 도색',
  },

  {
    id: 4,
    category: '정압기',
    workName: '도색',
    detailWork: '휠터 1개소 도색',
  },

  {
    id: 5,
    category: '정압기',
    workName: '도색',
    detailWork: '배관 일부 도색 (50%)',
  },

  {
    id: 6,
    category: '정압기',
    workName: '도색',
    detailWork: '배관 지지대(서포트) 내화도색',
  },

  {
    id: 7,
    category: '정압기',
    workName: '도색',
    detailWork: '내부 벽면 도장(바닥제외 5면)',
  },

  {
    id: 8,
    category: '정압기',
    workName: '도색',
    detailWork: '그 외 견적 시행',
  },

  {
    id: 9,
    category: '정압기',
    workName: '방수',
    detailWork: '출입구 2개소 방수',
  },

  {
    id: 10,
    category: '정압기',
    workName: '방수',
    detailWork: '슬리브 2개소 방수',
  },

  {
    id: 11,
    category: '정압기',
    workName: '방수',
    detailWork: '그 외 견적 시행',
  },

  {
    id: 12,
    category: '정압기',
    workName: '전기통신 부품 교체',
    detailWork: 'RTU외함 교체',
  },

  {
    id: 13,
    category: '정압기',
    workName: '전기통신 부품 교체',
    detailWork: '방폭등 교체',
  },

  {
    id: 14,
    category: '정압기',
    workName: '전기통신 부품 교체',
    detailWork: '방폭등 위치 변경 (견적시행)',
  },

  {
    id: 15,
    category: '정압기',
    workName: '전기통신 부품 교체',
    detailWork: 'MOV, SSV등 전선관 보수 1·2개소',
  },

  {
    id: 16,
    category: '정압기',
    workName: '사다리 교체',
    detailWork: '정압기실 1·2개소',
  },

  {
    id: 17,
    category: '정압기',
    workName: '사다리 교체',
    detailWork: '미끄럼방지 설치',
  },

  {
    id: 18,
    category: '정압기',
    workName: '기타',
    detailWork: '그 외 특수 공사',
  },


  // ----------------------------------------------------------
  // 밸브
  // ----------------------------------------------------------

  {
    id: 19,
    category: '밸브',
    workName: '인상/인하',
    detailWork: '시설물 인상, 인하',
  },

  {
    id: 20,
    category: '밸브',
    workName: '인상/인하',
    detailWork: '철괘 교체',
  },

  {
    id: 21,
    category: '밸브',
    workName: '인상/인하',
    detailWork: '맨홀 주변 파손',
  },

  {
    id: 22,
    category: '밸브',
    workName: '환경정리',
    detailWork: '매몰형 이물질 제거',
  },

  {
    id: 23,
    category: '밸브',
    workName: '환경정리',
    detailWork: '박스형 이물질 제거',
  },

  {
    id: 24,
    category: '밸브',
    workName: '철거/교체',
    detailWork: '점검곤란 밸브',
  },

  {
    id: 25,
    category: '밸브',
    workName: '철거/교체',
    detailWork: '과심도 밸브',
  },

  {
    id: 26,
    category: '밸브',
    workName: '도색',
    detailWork: '밸브실 도색',
  },

  {
    id: 27,
    category: '밸브',
    workName: '도색',
    detailWork: '인입밸브 100A이하 도색',
  },

  {
    id: 28,
    category: '밸브',
    workName: '도색',
    detailWork: '입상밸브 및 박스포함',
  },

  {
    id: 29,
    category: '밸브',
    workName: '도색',
    detailWork: '그 외 견적 시행',
  },

  {
    id: 30,
    category: '밸브',
    workName: '방수',
    detailWork: '출입구 1개소 방수',
  },

  {
    id: 31,
    category: '밸브',
    workName: '방수',
    detailWork: '슬리브 2개소 방수',
  },

  {
    id: 32,
    category: '밸브',
    workName: '사다리 교체',
    detailWork: '사다리 연장',
  },

  {
    id: 33,
    category: '밸브',
    workName: '사다리 교체',
    detailWork: '사다리 교체',
  },


  // ----------------------------------------------------------
  // 전기방식
  // ----------------------------------------------------------

  {
    id: 34,
    category: '전기방식',
    workName: '철거',
    detailWork: '부분 철거',
  },

  {
    id: 35,
    category: '전기방식',
    workName: '인상/인하',
    detailWork: '시설물 인상, 인하',
  },

  {
    id: 36,
    category: '전기방식',
    workName: '인상/인하',
    detailWork: '철괘 교체',
  },

  {
    id: 37,
    category: '전기방식',
    workName: '인상/인하',
    detailWork: '맨홀 주변 파손',
  },

  {
    id: 38,
    category: '전기방식',
    workName: '신설',
    detailWork: '신규 설치',
  },


  // ----------------------------------------------------------
  // 배관
  // ----------------------------------------------------------

  {
    id: 39,
    category: '배관',
    workName: '라인마크 설치',
    detailWork: '검지공형 라인마크 설치',
  },

  {
    id: 40,
    category: '배관',
    workName: '라인마크 설치',
    detailWork: '일반 라인마크 설치',
  },

  {
    id: 41,
    category: '배관',
    workName: '철거',
    detailWork: '미사용 인입 본관/공급관/인입관',
  },


  // ----------------------------------------------------------
  // 사용시설
  // ----------------------------------------------------------

  {
    id: 42,
    category: '사용시설',
    workName: '입상관 보호대',
    detailWork: '50A 이하',
  },

  {
    id: 43,
    category: '사용시설',
    workName: '입상관 보호대',
    detailWork: '100A',
  },

] as const satisfies readonly InvestmentItem[];


// ============================================================
// 2. ID 타입
// ============================================================

export type InvestmentItemId =
  (typeof INVESTMENT_ITEMS)[number]['id'];


// ============================================================
// 3. 기존 3단 드롭다운용 데이터 자동 생성
// ============================================================
//
// 결과:
//
// {
//   정압기: {
//     도색: [
//       '전체 도색',
//       '흡 · 배기 방출관 도색',
//       ...
//     ],
//     방수: [...]
//   },
//   밸브: {...}
// }
//
// 기존 page.tsx의 INVESTMENT_DATA와 같은 형태입니다.
// ============================================================

export const INVESTMENT_DATA =
  INVESTMENT_ITEMS.reduce<Record<string, Record<string, string[]>>>(
    (result, item) => {

      if (!result[item.category]) {
        result[item.category] = {};
      }

      if (!result[item.category][item.workName]) {
        result[item.category][item.workName] = [];
      }

      result[item.category][item.workName].push(item.detailWork);

      return result;
    },
    {}
  );


// ============================================================
// 4. itemId → 실제 표준 데이터 조회
// ============================================================

export function getInvestmentItemById(
  id: number
): InvestmentItem | undefined {

  return INVESTMENT_ITEMS.find(
    (item) => item.id === id
  );
}


// ============================================================
// 5. AI가 반환한 ID가 실제 1~43 표준번호인지 검증
// ============================================================

export function isValidInvestmentItemId(
  id: number
): id is InvestmentItemId {

  return INVESTMENT_ITEMS.some(
    (item) => item.id === id
  );
}


// ============================================================
// 6. 시설물 / 작업명 / 세부내역 → 표준번호 조회
// ============================================================

export function getInvestmentItemIdByPath(
  category: string,
  workName: string,
  detailWork: string
): number | null {

  const item = INVESTMENT_ITEMS.find(
    (item) =>
      item.category === category &&
      item.workName === workName &&
      item.detailWork === detailWork
  );

  return item?.id ?? null;
}


// ============================================================
// 7. AI 프롬프트에 전달할 43개 표준 목록
// ============================================================
//
// 예:
//
// 1 | 정압기 > 도색 > 전체 도색
// 2 | 정압기 > 도색 > 흡 · 배기 방출관 도색
// ...
// 21 | 밸브 > 인상/인하 > 맨홀 주변 파손
//
// Gemini는 이 목록을 보고 1~43 중 하나를 추천합니다.
// ============================================================

export function getStandardPathPromptText(): string {

  return INVESTMENT_ITEMS
    .map(
      (item) =>
        `${item.id} | ${item.category} > ${item.workName} > ${item.detailWork}`
    )
    .join('\n');
}


// ============================================================
// 8. 시설물 목록
// ============================================================

export const INVESTMENT_CATEGORIES =
  Object.keys(INVESTMENT_DATA);