
import json
import os
from datetime import datetime, timezone
from urllib.parse import urlencode
from urllib.request import urlopen

API_KEY = os.environ["YOUTUBE_API_KEY"]
CHANNEL_HANDLE = "Logistical"

params = urlencode({
    "part": "snippet,statistics",
    "forHandle": CHANNEL_HANDLE,
    "key": API_KEY
})

url = f"https://www.googleapis.com/youtube/v3/channels?{params}"

with urlopen(url, timeout=30) as response:
    data = json.load(response)

if not data.get("items"):
    raise RuntimeError("YouTube channel not found")

channel = data["items"][0]
stats = channel["statistics"]

result = {
    "channel": channel["snippet"]["title"],
    "channel_id": channel["id"],
    "subscribers": int(stats["subscriberCount"]),
    "total_views": int(stats["viewCount"]),
    "video_count": int(stats["videoCount"]),
    "last_updated": datetime.now(timezone.utc).isoformat()
}

with open("stats.json", "w", encoding="utf-8") as file:
    json.dump(result, file, indent=2)

print(json.dumps(result, indent=2))
