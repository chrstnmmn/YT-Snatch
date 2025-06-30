import sys
import yt_dlp
import os
import datetime
import threading
import time

print("Python script started", file=sys.stderr)

class DownloadController:
    def __init__(self):
        self._paused = False
        self._canceled = False
        self._lock = threading.Lock()
    
    def pause(self):
        with self._lock:
            self._paused = True
            print("\n⏸ Download paused", flush=True)
    
    def resume(self):
        with self._lock:
            self._paused = False
            print("\n▶ Download resumed", flush=True)
    
    def cancel(self):
        with self._lock:
            self._canceled = True
            print("\n❌ Download cancelled", flush=True)
    
    def should_pause(self):
        with self._lock:
            return self._paused
    
    def should_cancel(self):
        with self._lock:
            return self._canceled

controller = DownloadController()

def command_listener():
    """Thread to handle Electron commands"""
    while True:
        cmd = sys.stdin.readline().strip()
        if cmd == 'pause':
            controller.pause()
        elif cmd == 'resume':
            controller.resume()
        elif cmd == 'cancel':
            controller.cancel()
            break
        elif cmd == 'quit':
            break

def progress_hook(d):
    # Handle pause state
    while controller.should_pause() and not controller.should_cancel():
        time.sleep(0.5)
    
    if controller.should_cancel():
        raise yt_dlp.DownloadCancelled()
    
    # Format progress information for Electron UI
    if d['status'] == 'downloading':
        percent = d.get('_percent_str', '0%').strip()
        total = d.get('_total_bytes_str', '?').strip()
        speed = d.get('_speed_str', '?').strip()
        eta = d.get('_eta_str', '?').strip()
        
        print(
            f"[download] {percent} of {total} at {speed} ETA {eta}",
            flush=True
        )
    elif d['status'] == 'finished':
        print(f"\n✅ Download complete: {d.get('filename', 'unknown file')}", flush=True)

def download_video(url, quality, download_folder):
    print(f"Download started: {url}", flush=True)
    os.makedirs(download_folder, exist_ok=True)
    
    # Start command listener thread
    threading.Thread(target=command_listener, daemon=True).start()

    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")

    ydl_opts = {
        'format': {
            'low': 'worst',
            'medium': 'bestvideo[height<=720]+bestaudio/best[height<=720]',
            'high': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
            'highest': 'bestvideo*+bestaudio/best'
        }.get(quality, 'highest'),
        'merge_output_format': 'mp4',
        'outtmpl': os.path.join(download_folder, f'%(title)s_{timestamp}.%(ext)s'),
        'progress_hooks': [progress_hook],
        'extract_flat': False,
        'noprogress': False,
        'quiet': False,
        'continuedl': True,
        'socket_timeout': 30,
        'retries': 3,
        'fragment_retries': 3,
        'skip_unavailable_fragments': True
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print(f"Downloading: {url} at {quality} quality...", flush=True)
            ydl.download([url])
    except yt_dlp.DownloadCancelled:
        print("\n❌ Download cancelled by user", flush=True)
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Download failed: {str(e)}", flush=True)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python script.py <URL> <quality> <folder>", file=sys.stderr)
        sys.exit(1)

    video_url = sys.argv[1]
    quality = sys.argv[2].lower()
    download_folder = sys.argv[3]

    if not video_url.startswith(("http://", "https://")):
        print("Error: URL must start with http:// or https://", file=sys.stderr)
        sys.exit(1)

    download_video(video_url, quality, download_folder)
    
# DO NOT REMOVE
# SAMPLE VIDEO: https://www.youtube.com/watch?v=WO2b03Zdu4Q
# SHORTEST VIDEO: https://www.youtube.com/watch?v=7-qGKqveZaM
# FRAGMENTATION TEST: https://www.youtube.com/watch?v=14mI0ONbhwE
