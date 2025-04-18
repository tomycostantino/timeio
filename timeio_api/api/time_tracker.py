from threading import Thread
from AppKit import NSWorkspace
from pynput import keyboard, mouse
import time

from .models import AppUsage

tracker = None

class TimeTracker:
    def __init__(self, idle_time = 60):
        self._idle_time = idle_time         # How long without activity to consider idle
        self._last_store_time = None        # Last time stored in db
        self._last_activity_time = None     # Last captured event
        self._monitoring_thread = None      # It runs as a thread
        self._session_id = None
        self._mouse_listener = mouse.Listener(on_move=self._on_activity, on_click=self._on_activity, on_scroll=self._on_activity)
        self._keyboard_listener = keyboard.Listener(on_press=self._on_activity)
        self._running = False
        self._app_usage = {}
        self._current_app = None
        self._is_idle = False

        self._mouse_listener.start()
        self._keyboard_listener.start()

    def _on_activity(self, *args):
        self._last_activity_time = time.time()

    def update_idle_time(self, idle_time):
        self._idle_time = idle_time

    def start(self, session_id):
        self._session_id = session_id
        self._running = True
        self._last_activity_time = time.time()
        self._monitoring_thread = Thread(target=self._monitor, daemon=True)
        self._monitoring_thread.start()

    def stop(self):
        self._running = False
        self._cleanup()

    def status(self):
        return self._app_usage

    def _monitor(self):
        self._last_store_time = time.time()
        while self._running:
            active_app = NSWorkspace.sharedWorkspace().activeApplication()
            active_app = active_app['NSApplicationName'] if active_app else None
            if active_app != self._current_app and active_app:
                self._current_app = active_app

            now = time.time()
            if now - self._last_activity_time > self._idle_time:
                self._is_idle = True

            if now - self._last_store_time > 60:
                # Store every minute
                self._store_usage()

            if not self._is_idle and self._current_app:
                self._app_usage[self._current_app] = self._app_usage.get(self._current_app, 0) + 1

            time.sleep(1)

    def _store_usage(self):
        if self._session_id and self._app_usage:
            app_usage = AppUsage(
                session_id=self._session_id
            )
            app_usage.app_usage = self._app_usage
            app_usage.save()
            self._app_usage = {}

    def _cleanup(self):
        self._store_usage()
        self._session_id = None
        self._keyboard_listener.stop()
        self._mouse_listener.stop()
        self._last_store_time = None
        self._last_activity_time = None
        self._current_app = None


def get_tracker():
    global tracker
    if tracker is None:
        tracker = TimeTracker()
    return tracker

def create_tracker(idle_time):
    global tracker
    tracker = TimeTracker(idle_time)
    return tracker
