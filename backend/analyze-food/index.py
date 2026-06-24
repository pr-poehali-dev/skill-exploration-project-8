import json
import os
import urllib.request
import urllib.error


def handler(event: dict, context) -> dict:
    """Принимает base64-изображение еды, отправляет в Anthropic Claude и возвращает КБЖУ."""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    body = json.loads(event.get('body') or '{}')
    image_data = body.get('data')
    media_type = body.get('media_type', 'image/jpeg')

    if not image_data:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No image data provided'}),
        }

    api_key = os.environ.get('ANTHROPIC_API_KEY', '')

    prompt = """Analyze this food photo. Return ONLY a raw JSON object, no markdown, no explanation, no text before or after the JSON.

Required format:
{"meal_name":"...","total":{"calories":0,"protein":0,"fat":0,"carbs":0,"fiber":0},"dishes":[{"name":"...","weight":0,"calories":0,"protein":0,"fat":0,"carbs":0,"fiber":0}],"confidence":"high","note":null}

Rules:
- If it's a packaged product (candy bar, snack, drink), read the brand name and use standard nutritional data for that product
- Estimate portion weight visually
- All numbers must be integers
- fiber is required (use 0 if none)
- meal_name and dish names in Russian
- confidence: "high" if product is clearly visible, "medium" if estimated, "low" if unclear
- note: short Russian comment if needed, otherwise null
- Return ONLY the JSON, nothing else"""

    payload = json.dumps({
        'model': 'claude-sonnet-4-5',
        'max_tokens': 1000,
        'messages': [{
            'role': 'user',
            'content': [
                {
                    'type': 'image',
                    'source': {
                        'type': 'base64',
                        'media_type': media_type,
                        'data': image_data,
                    },
                },
                {'type': 'text', 'text': prompt},
            ],
        }],
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.anthropic.com/v1/messages',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'x-api-key': api_key,
            'anthropic-version': '2023-06-01',
        },
        method='POST',
    )

    resp_data = urllib.request.urlopen(req).read()
    resp_json = json.loads(resp_data)

    raw = ''.join(
        block.get('text', '') for block in (resp_json.get('content') or [])
    )

    import re
    match = re.search(r'\{[\s\S]*\}', raw)
    if not match:
        return {
            'statusCode': 422,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Could not parse Claude response', 'raw': raw[:300]}),
        }

    result = json.loads(match.group(0))

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(result),
    }
