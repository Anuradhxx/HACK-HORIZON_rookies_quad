import requests

weather_api_key = "4771e87380b84e32a28100300251104"

def get_weather_info(lat, lon):
    url = f"http://api.weatherapi.com/v1/current.json?key={weather_api_key}&q={lat},{lon}"
    r = requests.get(url)
    d = r.json()
    if r.status_code != 200 or "error" in d:
        raise Exception(d.get("error", {}).get("message", "WeatherAPI error"))
    return {
        "weather_desc": d["current"]["condition"]["text"],
        "temperature": d["current"]["temp_c"],
        "humidity": d["current"]["humidity"],
        "location": d["location"]["name"]
    }

def get_reforestation_trees(lat, lon):
    try:
        w = get_weather_info(lat, lon)
    except Exception as e:
        print(e)
        return '''- Neem (Azadirachta indica)
- Indian Banyan (Ficus benghalensis)
- Rain Tree (Samanea saman)
- Indian Beech (Pongamia pinnata)
- Peepal (Ficus religiosa)
- Flame of the Forest (Butea monosperma)'''

    prompt = f"""
You are an expert forest planner.

List native or well-suited trees for reforestation based on:
- Location: {w['location']}
- Weather: {w['weather_desc']}
- Temperature: {w['temperature']}°C
- Humidity: {w['humidity']}%
- Latitude: {lat}
- Longitude: {lon}

Only give a bullet-point list of tree names. No explanation.
""".strip()

    payload = {
        "prompt": "You are an expert forest planner.",
        "messages": [],
        "input": prompt
    }

    headers = {
        "Content-Type": "application/json",
        "Origin": "https://gptlite.vercel.app",
        "Referer": "https://gptlite.vercel.app/chat"
    }

    try:
        r = requests.post("https://gptlite.vercel.app/api/chat", json=payload, headers=headers)
        return r.text.strip()
    except Exception as e:
        print(e)
        return '''- Neem (Azadirachta indica)
- Indian Banyan (Ficus benghalensis)
- Rain Tree (Samanea saman)
- Indian Beech (Pongamia pinnata)
- Peepal (Ficus religiosa)
- Flame of the Forest (Butea monosperma)'''


