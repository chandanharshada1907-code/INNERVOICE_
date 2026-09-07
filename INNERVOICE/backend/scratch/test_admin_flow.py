import urllib.request
import json
import base64

url = 'http://localhost:5000/api/auth/login'
payload = json.dumps({'email': 'chandanharshada1907@gmail.com', 'password': 'harshada1907'}).encode('utf-8')

req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        res_body = response.read().decode('utf-8')
        data = json.loads(res_body)
        print("LOGIN RESPONSE:")
        print(json.dumps(data, indent=2))
        
        token = data.get('token')
        if token:
            parts = token.split('.')
            payload_str = base64.b64decode(parts[1] + '==').decode('utf-8')
            print("\nDECODED JWT PAYLOAD:")
            print(payload_str)
            
            # Test admin stats API
            req_stats = urllib.request.Request('http://localhost:5000/api/admin/stats', headers={'Authorization': f'Bearer {token}'})
            with urllib.request.urlopen(req_stats) as res_stats:
                stats_data = json.loads(res_stats.read().decode('utf-8'))
                print("\nADMIN STATS API RESPONSE:")
                print(json.dumps(stats_data, indent=2))

except Exception as e:
    print("ERROR:", e)
