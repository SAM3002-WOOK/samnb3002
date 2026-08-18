import { NextResponse } from 'next/server';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

import {
  INVESTMENT_ITEMS,
  getInvestmentItemById,
  isValidInvestmentItemId,
} from '@/lib/investment-data';

type AiResult = {
  candidateIds: number[];
  ambiguous: boolean;
  unsupported: boolean;
};

function getRelevantItems(text: string) {
  const lower = text.toLowerCase();

  let category: string | null = null;

  if (text.includes('정압기') || text.includes('정압')) {
    category = '정압기';
  } else if (
    text.includes('밸브') ||
    lower.includes('v/v') ||
    lower.includes('valve')
  ) {
    category = '밸브';
  } else if (
    text.includes('전기방식') ||
    text.includes('전기 방식')
  ) {
    category = '전기방식';
  } else if (
    text.includes('배관') ||
    text.includes('라인마크') ||
    text.includes('라인 마크')
  ) {
    category = '배관';
  } else if (
    text.includes('사용시설') ||
    text.includes('사용 시설') ||
    text.includes('입상관')
  ) {
    category = '사용시설';
  }

  if (!category) {
    return INVESTMENT_ITEMS;
  }

  return INVESTMENT_ITEMS.filter(
    (item) => item.category === category
  );
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'GEMINI_API_KEY가 설정되어 있지 않습니다.',
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const text =
      typeof body?.text === 'string'
        ? body.text.trim()
        : '';

    if (!text) {
      return NextResponse.json(
        {
          success: false,
          error: '현장 작업 내용을 입력해 주세요.',
        },
        { status: 400 }
      );
    }

    if (text.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: '현장 작업 내용은 200자 이내로 입력해 주세요.',
        },
        { status: 400 }
      );
    }

    const relevantItems = getRelevantItems(text);

    const allowedIds = relevantItems.map(
      (item) => item.id
    );

    const standardList = relevantItems
      .map(
        (item) =>
          `${item.id}|${item.category}|${item.workName}|${item.detailWork}`
      )
      .join('\n');

    const prompt = `
현장 작업자의 문장을 회사 표준항목 번호로 분류하세요.

규칙:
- 반드시 제공된 번호만 선택하세요.
- 새로운 항목을 만들지 마세요.
- 단어 일치보다 의미를 기준으로 판단하세요.
- 오타, 약어, 구어체를 이해하세요.
- 명확하면 후보 1개만 반환하세요.
- 애매하면 최대 3개를 반환하고 ambiguous=true로 하세요.
- 판단이 불가능하면 unsupported=true로 하세요.
- 가장 적합한 번호를 candidateIds 첫 번째에 넣으세요.

표준항목:
${standardList}

현장입력:
${text}
`.trim();

    const ai = new GoogleGenAI({
      apiKey,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',

      contents: prompt,

      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
        },

        maxOutputTokens: 80,

        responseMimeType: 'application/json',

        responseJsonSchema: {
          type: 'object',

          properties: {
            candidateIds: {
              type: 'array',

              items: {
                type: 'integer',
                enum: allowedIds,
              },

              minItems: 0,
              maxItems: 3,
            },

            ambiguous: {
              type: 'boolean',
            },

            unsupported: {
              type: 'boolean',
            },
          },

          required: [
            'candidateIds',
            'ambiguous',
            'unsupported',
          ],

          additionalProperties: false,
        },
      },
    });

    if (!response.text) {
      throw new Error('Gemini 응답이 비어 있습니다.');
    }

    const parsed = JSON.parse(
      response.text
    ) as AiResult;

    const rawIds = Array.isArray(parsed.candidateIds)
      ? parsed.candidateIds
      : [];

    const validIds = rawIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id))
      .filter((id) => isValidInvestmentItemId(id))
      .filter((id) => allowedIds.includes(id))
      .filter(
        (id, index, array) =>
          array.indexOf(id) === index
      )
      .slice(0, 3);

    const candidates = validIds
      .map((id) => getInvestmentItemById(id))
      .filter(
        (item): item is NonNullable<typeof item> =>
          Boolean(item)
      );

    if (
      parsed.unsupported ||
      candidates.length === 0
    ) {
      return NextResponse.json({
        success: true,
        unsupported: true,
        ambiguous: true,
        candidates: [],
      });
    }

    return NextResponse.json({
      success: true,
      unsupported: false,
      ambiguous:
        Boolean(parsed.ambiguous) ||
        candidates.length > 1,
      candidates,
    });
  } catch (error) {
    console.error(
      'Gemini classification API error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          'AI 추천을 불러오지 못했습니다. 기존 표준항목을 직접 선택해 주세요.',
      },
      { status: 500 }
    );
  }
}