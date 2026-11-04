import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

API_KEY = os.environ['YOUTUBE_API_KEY']
CHANNEL_HANDLES = ['Logistical', 'KokoplaysMB', 'FallenShogun', 'VonGalactic']


def fetch_channel(handle):
    params = urlencode({'part': 'snippet,statistics', 'forHandle': handle, 'key': API_KEY})
    url = f'https://www.googleapis.com/youtube/v3/channels?{params}'
    try:
        with urlopen(url, timeout=30) as response:
            data = json.load(response)
    except HTTPError as error:
        print(f'YouTube API error for @{handle}: {error.code}')
        print(error.read().decode('utf-8', errors='replace'))
        raise
    except URLError as error:
        raise RuntimeError(f'Network error fetching @{handle}: {error}') from error

    if not data.get('items'):
        raise RuntimeError(f'YouTube channel @{handle} not found. Check its exact handle.')

    channel = data['items'][0]
    stats = channel['statistics']
    return {
        'channel': channel['snippet']['title'],
        'channel_id': channel['id'],
        'subscribers': int(stats['subscriberCount']) if 'subscriberCount' in stats else None,
        'total_views': int(stats['viewCount']),
        'video_count': int(stats['videoCount']),
        'last_updated': datetime.now(timezone.utc).isoformat(),
    }


def write_json(path, content):
    Path(path).write_text(json.dumps(content, indent=2) + '\n', encoding='utf-8')


def main():
    channels = [fetch_channel(handle) for handle in CHANNEL_HANDLES]
    write_json('stats.json', channels[0])
    write_json('channels.json', {'last_updated': datetime.now(timezone.utc).isoformat(), 'channels': channels})
    for channel in channels:
        print(f"{channel['channel']}: {channel['subscribers']} subscribers, {channel['total_views']} views")
    print('Updated stats.json and channels.json')


if __name__ == '__main__':
    main()
