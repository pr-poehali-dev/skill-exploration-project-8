import json
import os
import re
import urllib.error
import urllib.request


def handler(event: dict, context) -> dict:
    """Принимает base64-изображение еды, отправляет в OpenRouter (vision) и возвращает КБЖУ."""

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

    api_key = os.environ.get('OPENROUTER_API_KEY', '')

    prompt = (
        "Analyze this food photo. Return ONLY a raw JSON object, no markdown, no explanation.\n"
        'Required format:\n'
        '{"meal_name":"...","total":{"calories":0,"protein":0,"fat":0,"carbs":0,"fiber":0},'
        '"dishes":[{"name":"...","weight":0,"calories":0,"protein":0,"fat":0,"carbs":0,"fiber":0}],'
        '"confidence":"high","note":null}\n'
        "Rules: packaged products — use standard nutritional data by brand name. "
        "All numbers integers. meal_name and dish names in Russian. "
        "confidence: high/medium/low. note: short Russian comment or null. Return ONLY JSON."
    )

    payload = json.dumps({
        'model': 'meta-llama/llama-4-maverick:free',
        'messages': [{
            'role': 'user',
            'content': [
                {
                    'type': 'image_url',
                    'image_url': {'url': f'data:{media_type};base64,{image_data}'},
                },
                {'type': 'text', 'text': prompt},
            ],
        }],
        'max_tokens': 1000,
        'temperature': 0.1,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://openrouter.ai/api/v1/chat/completions',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
            'HTTP-Referer': 'https://poehali.dev',
            'X-Title': 'Eatwise',
        },
        method='POST',
    )

    try:
        resp_data = urllib.request.urlopen(req).read()
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8', errors='replace')
        return {
            'statusCode': 502,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'API error {e.code}', 'detail': error_body[:500]}),
        }

    resp_json = json.loads(resp_data)

    raw = resp_json.get('choices', [{}])[0].get('message', {}).get('content', '')

    match = re.search(r'\{[\s\S]*\}', raw)
    if not match:
        return {
            'statusCode': 422,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Could not parse response', 'raw': raw[:300]}),
        }

    result = json.loads(match.group(0))

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(result),
    }