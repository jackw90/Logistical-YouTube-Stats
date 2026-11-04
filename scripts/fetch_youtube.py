
import json
import os
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

API_KEY = os.environ["YOUTUBE_API_KEY"]

# Display order also determines the ESP32 button order.
CHANNELS = [
    ("Logistical", "Logistical"),
    ("Kokoplays MB", "KokoplaysMB"),
    ("FallenShogun Gaming", "FallenShogun"),
    ("VonGalactic", "VonGalactic"),
    ("Spektator", "Spektator"),
]


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def fetch_channel(display_name, handle):
    params = urlencode({
        "part": "snippet,statistics",
        "forHandle": handle,
        "key": API_KEY,
    })

    url = "https://www.googleapis.com/youtube/v3/channels?" + params

    try:
        with urlopen(url, timeout=30) as response:
            data = json.load(response)
    except HTTPError as error:
        details = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"YouTube API error for @{handle}: "
            f"HTTP {error.code}\n{details}"
        ) from error
    except URLError as error:
        raise RuntimeError(
            f"Network error for @{handle}: {error}"
        ) from error

    if not data.get("items"):
        raise RuntimeError(
            f"YouTube channel not found: @{handle}"
        )

    channel = data["items"][0]
    snippet = channel["snippet"]
    stats = channel["statistics"]

    thumbnails = snippet.get("thumbnails", {})
    avatar = (
        thumbnails.get("high", {}).get("url")
        or thumbnails.get("medium", {}).get("url")
        or thumbnails.get("default", {}).get("url")
        or ""
    )

    return {
        "channel": snippet.get("title", display_name),
        "channel_id": channel["id"],
        "subscribers": (
            int(stats["subscriberCount"])
            if "subscriberCount" in stats else None
        ),
        "total_views": int(stats.get("viewCount", 0)),
        "video_count": int(stats.get("videoCount", 0)),
        "avatar": avatar,
        "last_updated": utc_now(),
    }


def write_json(filename, content):
    with open(filename, "w", encoding="utf-8") as file:
        json.dump(content, file, indent=2, ensure_ascii=False)
        file.write("\n")


def main():
    results = []

    for display_name, handle in CHANNELS:
        channel = fetch_channel(display_name, handle)
        results.append(channel)

        print(
            f"{channel['channel']}: "
            f"{channel['subscribers']} subscribers, "
            f"{channel['total_views']} views"
        )

    updated = utc_now()

    # Keep the original single-channel feed for older ESP32 code.
    logistical = results[0]

    legacy = {
        "channel": logistical["channel"],
        "channel_id": logistical["channel_id"],
        "subscribers": logistical["subscribers"],
        "total_views": logistical["total_views"],
        "video_count": logistical["video_count"],
        "last_updated": updated,
    }

    combined = {
        "last_updated": updated,
        "channels": results,
    }

    # Only write after every channel has fetched successfully.
    write_json("stats.json", legacy)
    write_json("channels.json", combined)

    print("Updated stats.json and channels.json")
    print(f"Channels fetched: {len(results)}")


if __name__ == "__main__":
    main()
