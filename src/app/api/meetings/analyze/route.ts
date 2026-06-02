import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { notes, members, meetingDate } = await req.json();

  if (!notes?.trim()) {
    return NextResponse.json({ error: "회의록 내용이 없습니다" }, { status: 400 });
  }

  const memberList = members?.length
    ? members.map((m: { name: string; role: string }) => `${m.name}(${m.role})`).join(", ")
    : "팀원 정보 없음";

  const prompt = `당신은 회의록을 분석해서 액션아이템을 추출하는 전문가입니다.

## 팀원 정보
${memberList}

## 회의 날짜
${meetingDate}

## 회의록/메모
${notes}

## 지시사항
위 회의록을 분석해서 각 팀원이 해야 할 액션아이템을 추출해주세요.

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "actions": [
    {
      "assignee": "팀원 이름 (반드시 팀원 정보에 있는 이름 중 하나)",
      "content": "구체적인 액션아이템",
      "dueDate": "YYYY-MM-DD 형식 또는 null (회의록에 날짜 언급 없으면 null)"
    }
  ],
  "summary": "회의 핵심 내용 1-2줄 요약"
}

규칙:
- assignee는 반드시 위 팀원 이름 중 하나여야 합니다
- 팀원이 명시되지 않은 경우 역할(BM, 마케터 등)로 유추하세요
- 액션아이템은 구체적이고 실행 가능하게 작성하세요
- 중복 없이 핵심만 추출하세요`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(text.trim());
    return NextResponse.json(parsed);
  } catch {
    // JSON 파싱 실패 시 텍스트에서 추출 시도
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }
    return NextResponse.json({ error: "분석 실패", raw: text }, { status: 500 });
  }
}
