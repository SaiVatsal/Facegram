import os
import math
import subprocess
import numpy as np
from PIL import Image, ImageDraw

WIDTH = 540
HEIGHT = 960
FPS = 24
DURATION = 3.5
TOTAL_FRAMES = int(FPS * DURATION)

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'assets', 'reels')
os.makedirs(OUTPUT_DIR, exist_ok=True)

def render_reel_frames(reel_idx):
    """Yield PIL images for each frame of reel_idx."""
    t_vals = np.linspace(0, 1, TOTAL_FRAMES, endpoint=False)
    
    for i, t in enumerate(t_vals):
        phase = t * 2 * math.pi
        img = Image.new('RGB', (WIDTH, HEIGHT), color=(15, 17, 26))
        draw = ImageDraw.Draw(img)
        
        if reel_idx == 0:
            # 1. Mountain Sunrise
            sky_top = (35, 15, 65)
            sky_mid = (195, 75, 45)
            sky_bot = (255, 190, 80)
            for y_step in range(0, HEIGHT, 4):
                ratio = y_step / HEIGHT
                if ratio < 0.6:
                    r1 = ratio / 0.6
                    r = int(sky_top[0] * (1 - r1) + sky_mid[0] * r1)
                    g = int(sky_top[1] * (1 - r1) + sky_mid[1] * r1)
                    b = int(sky_top[2] * (1 - r1) + sky_mid[2] * r1)
                else:
                    r1 = (ratio - 0.6) / 0.4
                    r = int(sky_mid[0] * (1 - r1) + sky_bot[0] * r1)
                    g = int(sky_mid[1] * (1 - r1) + sky_bot[1] * r1)
                    b = int(sky_mid[2] * (1 - r1) + sky_bot[2] * r1)
                draw.rectangle([(0, y_step), (WIDTH, y_step + 4)], fill=(r, g, b))
                
            sun_y = 520 - math.sin(phase * 0.5) * 30
            sun_r = 70 + math.sin(phase) * 4
            for cr in range(int(sun_r + 60), int(sun_r), -8):
                draw.ellipse([(WIDTH // 2 - cr, sun_y - cr), (WIDTH // 2 + cr, sun_y + cr)], fill=(255, 230, 160))
            draw.ellipse([(WIDTH // 2 - sun_r, sun_y - sun_r), (WIDTH // 2 + sun_r, sun_y + sun_r)], fill=(255, 248, 220))
            
            for layer, (col, baseY, amp) in enumerate([
                ((90, 35, 60), 580, 50),
                ((55, 20, 45), 670, 70),
                ((25, 10, 30), 780, 90)
            ]):
                pts = [(0, HEIGHT)]
                for x in range(0, WIDTH + 20, 20):
                    y = baseY + math.sin(x * 0.012 + layer * 2 + math.sin(phase) * 0.1) * amp
                    pts.append((x, y))
                pts.append((WIDTH, HEIGHT))
                draw.polygon(pts, fill=col)

        elif reel_idx == 1:
            # 2. Synthwave Neon Grid
            draw.rectangle([(0, 0), (WIDTH, HEIGHT)], fill=(12, 10, 28))
            horizon = 440
            sun_cx = WIDTH // 2
            sun_cy = horizon - 20
            sun_radius = 110
            for r in range(sun_radius + 40, sun_radius, -5):
                draw.ellipse([(sun_cx - r, sun_cy - r), (sun_cx + r, sun_cy + r)], fill=(80, 10, 60))
            for y in range(sun_cy - sun_radius, sun_cy + sun_radius):
                dy = y - sun_cy
                dx_max = math.sqrt(max(0, sun_radius**2 - dy**2))
                if (y - int(phase * 20)) % 18 < 6 and y > sun_cy - 20:
                    continue
                ratio = (y - (sun_cy - sun_radius)) / (sun_radius * 2)
                r_c = int(255 * (1 - ratio * 0.2))
                g_c = int(210 * ratio)
                b_c = int(80 * (1 - ratio))
                draw.line([(sun_cx - dx_max, y), (sun_cx + dx_max, y)], fill=(r_c, g_c, b_c))

            grid_speed = (phase / (2 * math.pi)) % 1.0
            for vx in range(-WIDTH, WIDTH * 2, 60):
                draw.line([(sun_cx, horizon), (vx, HEIGHT)], fill=(220, 40, 160), width=2)
            for gz in range(1, 16):
                z = (gz - grid_speed) / 15.0
                if z <= 0: continue
                hy = horizon + (HEIGHT - horizon) * (z ** 1.8)
                bright = int(255 * z)
                draw.line([(0, hy), (WIDTH, hy)], fill=(0, bright, min(255, int(bright * 1.3))), width=2)

        elif reel_idx == 2:
            # 3. Pacific Ocean Swell
            for y in range(0, HEIGHT, 4):
                v = y / HEIGHT
                r = int(10 + 20 * v)
                g = int(60 + 130 * v)
                b = int(120 + 90 * v)
                draw.rectangle([(0, y), (WIDTH, y + 4)], fill=(r, g, b))
                
            for w in range(8):
                wave_y = 180 + w * 90
                pts = [(0, HEIGHT)]
                for x in range(0, WIDTH + 10, 10):
                    y_off = (math.sin(x * 0.015 + phase + w * 0.8) * 35 +
                             math.cos(x * 0.028 - phase * 1.2 + w) * 20)
                    pts.append((x, wave_y + y_off))
                pts.append((WIDTH, HEIGHT))
                col = (int(30 + w * 18), int(120 + w * 15), int(180 + w * 8))
                draw.polygon(pts, fill=col)
                crest_pts = pts[1:-1]
                for p_idx in range(len(crest_pts) - 1):
                    draw.line([crest_pts[p_idx], crest_pts[p_idx + 1]], fill=(180, 245, 255), width=3)

        elif reel_idx == 3:
            # 4. Coffee & Latte Art
            draw.rectangle([(0, 0), (WIDTH, HEIGHT)], fill=(28, 20, 18))
            cup_cx, cup_cy = WIDTH // 2, HEIGHT // 2
            cup_r = 180
            draw.ellipse([(cup_cx - cup_r - 20, cup_cy - cup_r - 20), (cup_cx + cup_r + 20, cup_cy + cup_r + 20)], fill=(235, 230, 225))
            draw.ellipse([(cup_cx - cup_r, cup_cy - cup_r), (cup_cx + cup_r, cup_cy + cup_r)], fill=(75, 40, 25))
            
            rot = phase * 0.8
            for petal in range(12):
                p_angle = rot + petal * (2 * math.pi / 12)
                rad = 30 + (petal % 3) * 35 + math.sin(phase + petal) * 10
                px = cup_cx + math.cos(p_angle) * rad
                py = cup_cy + math.sin(p_angle) * rad
                draw.ellipse([(px - 22, py - 22), (px + 22, py + 22)], fill=(245, 225, 200))
            heart_scale = 1.0 + math.sin(phase) * 0.08
            draw.ellipse([(cup_cx - 30 * heart_scale, cup_cy - 30 * heart_scale),
                          (cup_cx + 30 * heart_scale, cup_cy + 30 * heart_scale)], fill=(255, 245, 235))

        elif reel_idx == 4:
            # 5. Iridescent Chrome Flow
            for y in range(0, HEIGHT, 5):
                grad = y / HEIGHT
                draw.rectangle([(0, y), (WIDTH, y + 5)], fill=(int(20 + 30 * grad), int(15 + 25 * grad), int(45 + 35 * grad)))
            
            cx, cy = WIDTH // 2, HEIGHT // 2
            for b in range(5):
                blob_angle = phase + b * (2 * math.pi / 5)
                blob_x = cx + math.cos(blob_angle) * (110 + math.sin(phase * 2 + b) * 30)
                blob_y = cy + math.sin(blob_angle) * (150 + math.cos(phase * 2 + b) * 40)
                blob_r = 65 + math.sin(phase * 3 + b) * 15
                
                for r_step in range(int(blob_r), 0, -6):
                    norm = r_step / blob_r
                    cr = int(127 + 127 * math.sin(phase + norm * 5 + b))
                    cg = int(127 + 127 * math.sin(phase + norm * 5 + b + 2))
                    cb = int(127 + 127 * math.sin(phase + norm * 5 + b + 4))
                    draw.ellipse([(blob_x - r_step, blob_y - r_step), (blob_x + r_step, blob_y + r_step)], fill=(cr, cg, cb))

        elif reel_idx == 5:
            # 6. Arctic Aurora Night
            draw.rectangle([(0, 0), (WIDTH, HEIGHT)], fill=(8, 12, 28))
            np.random.seed(42)
            star_x = np.random.randint(0, WIDTH, 120)
            star_y = np.random.randint(0, HEIGHT // 2 + 100, 120)
            star_b = np.random.rand(120)
            for sx, sy, sb in zip(star_x, star_y, star_b):
                twinkle = int(180 + 75 * math.sin(phase * 2 + sb * 10))
                draw.point((sx, sy), fill=(twinkle, twinkle, twinkle))

            for curtain in range(4):
                pts = []
                c_phase = phase + curtain * 1.5
                c_y = 220 + curtain * 70
                for x in range(0, WIDTH + 20, 15):
                    wave = (math.sin(x * 0.012 + c_phase) * 60 +
                            math.cos(x * 0.024 - c_phase * 0.8) * 30)
                    pts.append((x, c_y + wave))
                for px, py in pts:
                    col = (int(50 + 40 * math.sin(c_phase)), int(220 + 35 * math.cos(c_phase)), int(180 + 75 * math.sin(c_phase + 1)))
                    draw.line([(px, py - 90), (px, py + 120)], fill=col, width=6)

        elif reel_idx == 6:
            # 7. Urban Architecture Glass Reflection
            for y in range(0, HEIGHT, 4):
                v = y / HEIGHT
                draw.rectangle([(0, y), (WIDTH, y + 4)], fill=(int(250 - 150 * v), int(130 - 70 * v), int(90 + 30 * v)))
            
            cols = [
                (40, 140, (30, 35, 55)),
                (160, 260, (20, 25, 45)),
                (280, 380, (40, 45, 65)),
                (400, 500, (25, 30, 50))
            ]
            flare_y = 200 + math.sin(phase) * 150
            for left, right, base_c in cols:
                draw.rectangle([(left, 240), (right, HEIGHT)], fill=base_c)
                for wy in range(260, HEIGHT - 20, 35):
                    for wx in range(left + 15, right - 15, 25):
                        dist = abs(wy - flare_y)
                        intensity = max(0, 1 - dist / 200)
                        wr = int(base_c[0] * (1 - intensity) + 255 * intensity)
                        wg = int(base_c[1] * (1 - intensity) + 210 * intensity)
                        wb = int(base_c[2] * (1 - intensity) + 120 * intensity)
                        draw.rectangle([(wx, wy), (wx + 16, wy + 20)], fill=(wr, wg, wb))

        elif reel_idx == 7:
            # 8. Sakura Blossom Petals
            for y in range(0, HEIGHT, 4):
                v = y / HEIGHT
                draw.rectangle([(0, y), (WIDTH, y + 4)], fill=(int(255 - 20 * v), int(220 - 30 * v), int(230 - 15 * v)))
            
            for p_i in range(35):
                seed = p_i * 73
                base_x = (seed * 17) % WIDTH
                speed_y = 1.0 + (seed % 5) * 0.2
                curr_y = (seed * 23 + (phase / (2 * math.pi)) * HEIGHT * speed_y) % (HEIGHT + 40) - 20
                sway = math.sin(phase * 1.5 + seed) * 35
                curr_x = (base_x + sway) % WIDTH
                
                pr_w, pr_h = 16, 26
                draw.ellipse([(curr_x - pr_w, curr_y - pr_h), (curr_x + pr_w, curr_y + pr_h)], fill=(255, 175, 195))
                draw.ellipse([(curr_x - pr_w + 3, curr_y - pr_h + 4), (curr_x + pr_w - 3, curr_y + pr_h - 4)], fill=(255, 205, 220))

        elif reel_idx == 8:
            # 9. Kinetic Studio Typography & Bauhaus
            draw.rectangle([(0, 0), (WIDTH, HEIGHT)], fill=(240, 238, 233))
            
            cx, cy = WIDTH // 2, HEIGHT // 2
            for ring_idx in range(6):
                r_radius = 50 + ring_idx * 55
                r_spin = phase * (1 if ring_idx % 2 == 0 else -1) * (0.8 + ring_idx * 0.2)
                start_deg = math.degrees(r_spin)
                end_deg = start_deg + 160
                col = (20, 20, 25) if ring_idx % 2 == 0 else (235, 60, 45)
                draw.arc([(cx - r_radius, cy - r_radius), (cx + r_radius, cy + r_radius)],
                         start=int(start_deg), end=int(end_deg), fill=col, width=12)

            badge_size = int(60 + math.sin(phase * 2) * 10)
            draw.rectangle([(cx - badge_size, cy - badge_size), (cx + badge_size, cy + badge_size)], fill=(20, 30, 210))
            draw.ellipse([(cx - badge_size // 2, cy - badge_size // 2), (cx + badge_size // 2, cy + badge_size // 2)], fill=(255, 215, 0))

        elif reel_idx == 9:
            # 10. Neon Audio Equalizer Bars
            draw.rectangle([(0, 0), (WIDTH, HEIGHT)], fill=(10, 10, 18))
            
            num_bars = 18
            bar_w = 20
            spacing = 8
            total_w = num_bars * (bar_w + spacing) - spacing
            start_x = (WIDTH - total_w) // 2
            base_y = 600
            
            for b in range(num_bars):
                bx = start_x + b * (bar_w + spacing)
                b_height = int(90 + 190 * abs(math.sin(phase * 2.5 + b * 0.45)))
                
                for seg in range(0, b_height, 6):
                    seg_ratio = seg / 280
                    r = int(0 * (1 - seg_ratio) + 255 * seg_ratio)
                    g = int(240 * (1 - seg_ratio) + 60 * seg_ratio)
                    b_col = int(255 * (1 - seg_ratio) + 200 * seg_ratio)
                    draw.rectangle([(bx, base_y - seg), (bx + bar_w, base_y - seg + 4)], fill=(r, g, b_col))
                
                for seg in range(0, b_height // 3, 6):
                    r_col = (0, int(150 * (1 - seg / 100)), int(180 * (1 - seg / 100)))
                    draw.rectangle([(bx, base_y + 10 + seg), (bx + bar_w, base_y + 14 + seg)], fill=r_col)

        elif reel_idx == 10:
            # 11. Sunset Highway Cruise
            for y in range(0, HEIGHT, 4):
                v = y / HEIGHT
                r = int(255 - 130 * v)
                g = int(140 - 80 * v)
                b = int(70 + 70 * v)
                draw.rectangle([(0, y), (WIDTH, y + 4)], fill=(r, g, b))
                
            horizon_y = 480
            for x in range(0, WIDTH, 10):
                my = horizon_y - int(math.sin(x * 0.015) * 35 + math.cos(x * 0.035) * 20)
                draw.line([(x, my), (x, horizon_y)], fill=(70, 30, 50), width=10)
                
            draw.polygon([(WIDTH // 2 - 20, horizon_y), (WIDTH // 2 + 20, horizon_y),
                          (WIDTH + 140, HEIGHT), (-140, HEIGHT)], fill=(35, 38, 46))
            
            road_speed = (phase / (2 * math.pi)) % 1.0
            for dash in range(1, 10):
                d_prog = (dash - road_speed) / 9.0
                if d_prog <= 0: continue
                dy = horizon_y + (HEIGHT - horizon_y) * (d_prog ** 2)
                dw = max(3, int(14 * d_prog))
                dh = max(4, int(28 * d_prog))
                draw.rectangle([(WIDTH // 2 - dw // 2, dy), (WIDTH // 2 + dw // 2, dy + dh)], fill=(255, 210, 30))

        else:
            # 12. Cozy Rainy Night Window Bokeh
            draw.rectangle([(0, 0), (WIDTH, HEIGHT)], fill=(12, 14, 24))
            
            np.random.seed(99)
            bokeh_x = np.random.randint(40, WIDTH - 40, 30)
            bokeh_y = np.random.randint(100, HEIGHT - 100, 30)
            bokeh_r = np.random.randint(25, 65, 30)
            bokeh_c = [(255, 160, 60), (255, 70, 70), (70, 200, 255), (255, 230, 120)]
            
            for bx, by, br, b_idx in zip(bokeh_x, bokeh_y, bokeh_r, range(30)):
                pulsing = br + int(math.sin(phase + b_idx) * 6)
                col = bokeh_c[b_idx % len(bokeh_c)]
                draw.ellipse([(bx - pulsing, by - pulsing), (bx + pulsing, by + pulsing)], fill=col)

            glass = Image.new('RGBA', (WIDTH, HEIGHT), (10, 15, 30, 160))
            img.paste(glass, (0, 0), glass)
            draw = ImageDraw.Draw(img)

            for r_idx in range(40):
                rx = (r_idx * 47) % WIDTH
                ry_speed = 1.2 + (r_idx % 4) * 0.3
                ry = (r_idx * 61 + (phase / (2 * math.pi)) * HEIGHT * ry_speed) % (HEIGHT + 60) - 30
                streak_len = 15 + (r_idx % 5) * 8
                draw.line([(rx, ry), (rx, ry + streak_len)], fill=(200, 230, 255), width=2)
                draw.ellipse([(rx - 3, ry + streak_len - 3), (rx + 3, ry + streak_len + 3)], fill=(220, 240, 255))

        yield img

REELS_META = [
    {'filename': 'reel_sunrise.mp4', 'freqs': (130.81, 196.00, 261.63)},
    {'filename': 'reel_neon_grid.mp4', 'freqs': (146.83, 220.00, 293.66)},
    {'filename': 'reel_ocean_swell.mp4', 'freqs': (164.81, 246.94, 329.63)},
    {'filename': 'reel_coffee_art.mp4', 'freqs': (174.61, 261.63, 349.23)},
    {'filename': 'reel_abstract_flow.mp4', 'freqs': (196.00, 293.66, 392.00)},
    {'filename': 'reel_aurora.mp4', 'freqs': (220.00, 329.63, 440.00)},
    {'filename': 'reel_urban_vibes.mp4', 'freqs': (130.81, 164.81, 196.00)},
    {'filename': 'reel_sakura_bloom.mp4', 'freqs': (146.83, 174.61, 220.00)},
    {'filename': 'reel_kinetic_studio.mp4', 'freqs': (164.81, 196.00, 246.94)},
    {'filename': 'reel_soundwaves.mp4', 'freqs': (174.61, 220.00, 261.63)},
    {'filename': 'reel_sunset_highway.mp4', 'freqs': (196.00, 246.94, 293.66)},
    {'filename': 'reel_lofi_rain.mp4', 'freqs': (220.00, 261.63, 329.63)}
]

def main():
    print(f"Generating {len(REELS_META)} reels in {OUTPUT_DIR}...", flush=True)
    for idx, meta in enumerate(REELS_META):
        out_path = os.path.join(OUTPUT_DIR, meta['filename'])
        print(f"[{idx+1}/{len(REELS_META)}] Rendering frames for {meta['filename']}...", flush=True)
        
        frames_bytes = bytearray()
        for frame in render_reel_frames(idx):
            frames_bytes.extend(frame.tobytes())
            
        f1, f2, f3 = meta['freqs']
        audio_src = f"aevalsrc=0.15*sin(2*PI*{f1}*t)+0.10*sin(2*PI*{f2}*t)+0.08*sin(2*PI*{f3}*t):d={DURATION}"
        
        cmd = [
            'ffmpeg', '-y',
            '-f', 'rawvideo',
            '-vcodec', 'rawvideo',
            '-s', f"{WIDTH}x{HEIGHT}",
            '-pix_fmt', 'rgb24',
            '-r', str(FPS),
            '-i', '-',
            '-f', 'lavfi',
            '-i', audio_src,
            '-af', f"afade=t=in:ss=0:d=0.3,afade=t=out:st={DURATION-0.3}:d=0.3",
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-preset', 'ultrafast',
            '-crf', '24',
            '-c:a', 'aac',
            '-b:a', '64k',
            '-shortest',
            out_path
        ]
        
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        proc.communicate(input=bytes(frames_bytes))
        
        if os.path.exists(out_path):
            size_kb = os.path.getsize(out_path) / 1024
            print(f"   -> Done: {meta['filename']} ({size_kb:.1f} KB)", flush=True)
        else:
            print(f"   -> Failed: {meta['filename']}", flush=True)

    print("All reels generated successfully!", flush=True)

if __name__ == '__main__':
    main()
