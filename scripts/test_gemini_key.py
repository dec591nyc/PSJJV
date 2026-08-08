#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Google Gemini API 活體檢測與真偽驗證腳本
用法: python scripts/test_gemini_key.py
"""

import os
import sys
import json
import urllib.request
import urllib.error

def load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
    if not os.path.exists(env_path):
        print(f"❌ 找不到根目錄 .env 檔案: {env_path}")
        return {}
    
    env_vars = {}
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                env_vars[key.strip()] = val.strip().strip('"').strip("'")
    return env_vars

def main():
    print("=" * 60)
    print("🔍 台灣治安分析平台 - Google Gemini API 活體連線檢驗工具")
    print("=" * 60)
    
    env = load_env()
    api_key = env.get('GEMINI_API_KEY') or os.getenv('GEMINI_API_KEY') or ''
    model = env.get('GEMINI_MODEL', 'gemini-3.6-flash')

    if not api_key:
        print("\n🔴 【檢測結果：未配置金鑰】")
        print("   根目錄 .env 中的 GEMINI_API_KEY 欄位為空！")
        print("   請開啟 .env 填入您的金鑰，例如：")
        print('   GEMINI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX"\n')
        sys.exit(1)

    masked_key = api_key[:6] + "..." + api_key[-4:] if len(api_key) > 10 else "***"
    print(f"\n1. 讀取到金鑰: {masked_key} (長度: {len(api_key)} 字元)")
    print(f"2. 目標測試模型: {model}")
    print(f"3. 正在向 Google 官方伺服器 (generativelanguage.googleapis.com) 發送測試請求...")

    # Test URL
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": "請以繁體中文回覆這句話：『Google Gemini API 連線驗證成功，目前已具備即時治安情報研判能力。』"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 100
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )

    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            status_code = response.getcode()
            res_data = json.loads(response.read().decode('utf-8'))
            
            candidate_text = res_data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
            
            print("-" * 60)
            print(f"🟢 【驗證成功！Google 伺服器回應 HTTP {status_code} OK】")
            print(f"✨ 模型真實生成內容：\n   \"{candidate_text.strip()}\"")
            print("-" * 60)
            print("🎉 恭喜！您的 GEMINI_API_KEY 完全正確且具備調用權限！")
            print("   現在重新整理瀏覽器 http://localhost:3000，即可享受真實的大模型情報推論！\n")

    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8', errors='ignore')
        print("-" * 60)
        print(f"❌ 【驗證失敗：Google 官方拒絕連線 (HTTP {e.code})】")
        print(f"   原因回傳: {error_body[:300]}")
        print("-" * 60)
        print("💡 常見排查原因：")
        print("   1. 金鑰可能複製不完整或前後包含多餘空格。")
        print("   2. 若金鑰非 AIzaSy 開頭，請至 https://aistudio.google.com/ 建立免費金鑰。")
        print("   3. 若使用的是特定限制專案，請確認已啟用 Generative Language API。\n")
        sys.exit(2)
    except Exception as e:
        print(f"❌ 網路連線錯誤: {e}")
        sys.exit(3)

if __name__ == '__main__':
    main()
