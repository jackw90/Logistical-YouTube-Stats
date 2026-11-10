import io, json, os, colorsys, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
feed = json.loads((ROOT / 'channels.json').read_text(encoding='utf-8'))
now = datetime.now(timezone.utc)
day = now.strftime('%Y-%m-%d')
path = ROOT / 'history.json'
history = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'timezone':'UTC','snapshots':[]}
entries = []
for c in feed['channels']:
    entries.append({'channel_id':c['channel_id'],'channel':c['channel'],'views':int(c['total_views']),'subscribers':int(c['subscribers'])})
# One snapshot per UTC day; reruns refresh the latest daily baseline.
snapshot = {'date':day,'recorded_at':now.isoformat(),'channels':entries}
history['snapshots'] = [s for s in history.get('snapshots',[]) if s['date'] != day] + [snapshot]
history['snapshots'].sort(key=lambda s:s['date'])
path.write_text(json.dumps(history,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

palette_path = ROOT / 'channel_colors.json'
palette = {}
if palette_path.exists():
    palette = json.loads(palette_path.read_text(encoding='utf-8'))
for c in feed['channels']:
    key = c['channel_id']
    avatar = c.get('avatar','')
    if not avatar.startswith('https://'):
        continue
    # Only refresh a palette if its avatar URL changed.
    if palette.get(key,{}).get('avatar') == avatar:
        continue
    try:
        req = urllib.request.Request(avatar,headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req,timeout=12) as response:
            raw = response.read(2_000_000)
        img = Image.open(io.BytesIO(raw)).convert('RGB')
        img.thumbnail((80,80))
        samples = []
        for r,g,b in img.getdata():
            h,s,v = colorsys.rgb_to_hsv(r/255,g/255,b/255)
            if s >= .23 and .18 <= v <= .93:
                samples.append((r,g,b))
        if not samples:
            samples = list(img.getdata())
        # Quantize and select a frequent saturated colour, avoiding near-white/black.
        counts = {}
        for r,g,b in samples:
            rgb = (round(r/24)*24,round(g/24)*24,round(b/24)*24)
            counts[rgb] = counts.get(rgb,0)+1
        def score(item):
            rgb,n = item
            _,sat,val=colorsys.rgb_to_hsv(*(min(255,x)/255 for x in rgb))
            return n*(.5+sat)*(.4+val)
        rgb = max(counts.items(),key=score)[0]
        rgb = tuple(min(255,max(0,x)) for x in rgb)
        color = '#'+''.join(f'{x:02x}' for x in rgb)
        palette[key]={'channel':c['channel'],'avatar':avatar,'primary':color}
    except Exception as e:
        print(f'Could not extract {c["channel"]} avatar colour: {e}')
palette_path.write_text(json.dumps(palette,indent=2)+'\n',encoding='utf-8')
print('History and avatar colours updated:',day)
