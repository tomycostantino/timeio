import sys
import time
import json
import threading
from AppKit import NSWorkspace

stop_event = threading.Event()
tracker_instance = None

class TimeTracker:
    def __init__(self, idle_time=60):
        self._idle_time = idle_time
        self._monitoring_thread = None
        self._running = False
        self._app_usage = {}
        self._current_app = None
        self._lock = threading.Lock()

    def start_tracking(self):
        if self._running:
            return

        self._running = True
        stop_event.clear()
        self._monitoring_thread = threading.Thread(target=self._monitor, daemon=True)
        self._monitoring_thread.start()

    def stop_tracking(self):
        if not self._running:
            return
        self._running = False
        stop_event.set()

    def reset_tracking(self):
        self._running = False
        self._app_usage = {}
        self._current_app = None
        if not stop_event.is_set():
            stop_event.set()

    def get_status(self):
        with self._lock:
            return dict(self._app_usage)

    def _monitor(self):
        while self._running and not stop_event.is_set():
            active_app_name = None
            try:
                active_app = NSWorkspace.sharedWorkspace().activeApplication()
                active_app_name = active_app['NSApplicationName'] if active_app else None
            except Exception as e:
                print(f"Error getting active application: {e}", flush=True)

            with self._lock:
                if active_app_name and active_app_name != self._current_app:
                    self._current_app = active_app_name

                if self._current_app:
                    self._app_usage[self._current_app] = self._app_usage.get(self._current_app, 0) + 1

            time.sleep(1)


if __name__ == "__main__":
    tracker_instance = TimeTracker()

    try:
        while True:
            line = sys.stdin.readline()
            if not line:
                break

            command = line.strip()

            if command == "start":
                tracker_instance.start_tracking()
                print(json.dumps({"status": "started"}), flush=True)
            elif command == "stop":
                tracker_instance.stop_tracking()
                print(json.dumps({"status": "stopped"}), flush=True)
            elif command == "reset":
                tracker_instance.reset_tracking()
                print(json.dumps({"status": "stop"}), flush=True)
            elif command == "status":
                current_status = tracker_instance.get_status()
                print(json.dumps({"usage_data": current_status}), flush=True)
            else:
                print(json.dumps({"status": "error", "message": f"Unknown command: {command}"}), flush=True)

    except Exception as e:
        print(json.dumps({"status": "error", "message": f"Python script error: {e}"}), flush=True)
    finally:
        tracker_instance.stop_tracking()
        sys.stdout.flush()