# OpenRouter 모델 가격 정리

> 데이터 출처: `https://openrouter.ai/api/v1/models`  
> 기준일: 2026-10-20  
> 단위: 100만 토큰(1M tokens) 기준 USD  
> API 원본은 **토큰당** 가격이므로 아래 값은 `× 1,000,000` 환산값입니다.

---

## 1. DeepSeek 모델

| 모델 ID | Input | Output | Cache Read | 비고 |
|---|---:|---:|---:|---|
| `deepseek/deepseek-v4.1-flash` | **$0.0328** | **$0.08** | **$0.0016** | OpenRouter 저가 라우트, 시간대 구분 없음 |
| `deepseek/deepseek-v4.1-flash:batch` | $0.05 | $0.15 | $0.004 | 배치용 |
| `deepseek/deepseek-v4.1-flash-1017` | $0.15 / **$0.30** | $0.60 / **$1.20** | $0.003 / **$0.006** | 공식 DeepSeek 시간대 할인 반영 (굵은 값 = peak) |
| `deepseek/deepseek-v4-pro` | $0.4308 | $0.8616 | $0.0359 | |
| `deepseek/deepseek-v4-pro-0813` | $0.66 | $1.98 | $0.022 | dated 공식 버전 |
| `deepseek/deepseek-v4-flash` | $0.091 | $0.182 | $0.0182 | |
| `deepseek/deepseek-v4-flash-0731` | $0.15 | $0.15 | $0.042 | |
| `deepseek/deepseek-chat-v3.1` | $0.25 | $0.95 | $0.13 | |
| `deepseek/deepseek-r1-0528` | $0.50 | $2.15 | $0.35 | |

### DeepSeek peak/off-peak 시간대 (OpenRouter `v4.1-flash-1017` 기준)

- **Peak**: 월~금 UTC 01:00–04:00, 06:00–10:00
- **Off-peak**: 그 외 시간, 주말 및 중국 공휴일 전체
- `deepseek/deepseek-v4.1-flash` (날짜 없는 버전)은 OpenRouter가 별도로 낮춘 가격으로, **공식 DeepSeek 직접 API 가격이 아님**.

---

## 2. 주요 경쟁 모델

| 모델 ID | Input | Output | Cache Read | 기타 주요 항목 |
|---|---:|---:|---:|---|
| `openai/gpt-6-astra` | $10.00 | $50.00 | $1.00 | cache write $12.5; 272K+ 입력 시 2배 |
| `openai/gpt-6.1-sol` | $2.00 | $10.00 | $0.10 | |
| `openai/gpt-6-luna` | $0.10 | $0.50 | $0.01 | |
| `anthropic/claude-opus-4.8` | $5.00 | $25.00 | $0.50 | cache write $6.25; 1h write $10 |
| `google/gemini-2.5-pro` | $1.25 | $10.00 | $0.125 | cache write $0.375; 200K+ 입력 시 2배 |
| `google/gemini-2.5-flash` | $0.30 | $2.50 | $0.03 | |
| `qwen/qwen3.7-max` | $1.475 | $4.425 | $0.295 | cache write $1.844 |
| `qwen/qwen3.7-flash` | $0.03 | $0.13 | $0.006 | 긴 문맥 시 가격 상승 |
| `moonshotai/kimi-k2.6` | $0.65 | $3.41 | $0.15 | |
| `meta-llama/llama-4-maverick` | $0.1875 | $0.6525 | $0.05 | |

---

## 3. API 응답 구조 예시

```json
{
  "data": [
    {
      "id": "deepseek/deepseek-v4.1-flash",
      "context_length": 1048576,
      "pricing": {
        "prompt": "0.0000000328",
        "completion": "0.00000008",
        "input_cache_read": "0.0000000016"
      }
    }
  ]
}
```

- `prompt`: 입력 토큰 가격
- `completion`: 출력 토큰 가격
- `input_cache_read`: 캐시에서 읽은 입력 가격
- `input_cache_write`: 캐시에 쓴 입력 가격 (일부 모델)
- `web_search`, `image`, `audio`: 추가 기능별 가격 (멀티모달/검색 모델)
- `overrides`: 시간대, 최소 프롬프트 길이 등 조걶별 가격

---

## 4. 직접 조회 방법

```bash
# 전체 모델
 curl -s https://openrouter.ai/api/v1/models | jq

# DeepSeek 모델만
 curl -s https://openrouter.ai/api/v1/models | \
   jq '.data[] | select(.id | startswith("deepseek/")) | {id, pricing, context_length}'
```

---

## 5. 주의사항

- OpenRouter는 **라우팅/리셀러 플랫폼**이므로 동일 모델이라도 공급자에 따라 가격이 다를 수 있음.
- `deepseek/deepseek-v4.1-flash`의 $0.0328/$0.08은 **OpenRouter 특별 라우트/프로모션 가격**일 가능성이 높음. 공식 DeepSeek API 직접 가격과 다름.
- 실제 과금은 선택된 provider, rate limit, 캐시 히트율, peak/off-peak, 추가 기능 사용 여부에 따라 달라질 수 있음.
