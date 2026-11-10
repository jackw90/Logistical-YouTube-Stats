"""Anonymous upload timestamp only; never publish creator ID or channel name."""
import json
import os
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API_KEY = os.environ['YOUTUBE_API_KEY']
CHANNEL_ID = os.environ['MISSING_CREATOR_CHANNEL_ID']

def api(endpoint, **params):
    url = 'https://www.googleapis.com/youtube/v3/' + endpoint + '?' + urllib.parse.urlencode({**params, 'key': API_KEY})
    with urllib.request.urlopen(url, timeout=30) as response:
        return json.load(response)

channel = api('channels', part='contentDetails', id=CHANNEL_ID)
items = channel.get('items', [])
if not items:
    raise RuntimeError('Private creator lookup returned no channel')
uploads = items[0]['contentDetails']['relatedPlaylists']['uploads']
playlist = api('playlistItems', part='contentDetails', playlistId=uploads, maxResults=10)
video_ids = [i['contentDetails']['videoId'] for i in playlist.get('items', [])]
if not video_ids:
    raise RuntimeError('No public uploads found')
videos = api('videos', part='snippet', id=','.join(video_ids))
published = [v['snippet']['publishedAt'] for v in videos.get('items', []) if v.get('snippet', {}).get('publishedAt')]
if not published:
    raise RuntimeError('No public video timestamps found')
(ROOT / 'missing_creator.json').write_text(json.dumps({'last_upload_at': max(published)}, indent=2) + '\n', encoding='utf-8')
print('Anonymous creator timestamp updated')
