import urllib.request
import json
import os

def load_key():
    with open('.env', 'r', encoding='utf-8') as f:
        for l in f:
            if l.startswith('GEMINI_API_KEY='):
                return l.split('=', 1)[1].strip().strip('"').strip("'")
    return ''

key = load_key()
url = f'https://generativelanguage.googleapis.com/v1beta/models?key={key}'
try:
    with urllib.request.urlopen(url, timeout=10) as res:
        data = json.loads(res.read().decode())
        models = [m['name'] for m in data.get('models', []) if 'generateContent' in m.get('supportedGenerationMethods', [])]
        print('Available Google Models for this key:')
        for m in models:
            print(' -', m)
except Exception as e:
    print('Failed to list models:', e)
