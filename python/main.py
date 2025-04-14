import time
import threading
from flask import Flask, jsonify
from flask_cors import CORS
from AppKit import NSWorkspace
from pynput import mouse, keyboard

current_app = None
last_activity_time = time.time()
app_times = {}
is_idle = False


def on_activity(*args):
    global last_activity_time
    last_activity_time = time.time()


mouse_listener = mouse.Listener(on_move=on_activity, on_click=on_activity, on_scroll=on_activity)
keyboard_listener = keyboard.Listener(on_press=on_activity)
mouse_listener.start()
keyboard_listener.start()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "allow_headers": "*", "expose_headers": "*", "methods": "*"}})


@app.route('/status')
def status():
    global current_app, is_idle, app_times
    return jsonify({
        'current_app': current_app,
        'is_idle': is_idle,
        'app_times': app_times
    })


def monitor_activity():
    global current_app, is_idle, app_times
    print("Starting time tracker...")
    try:
        while True:
            time.sleep(1)
            now = time.time()
            active_app = NSWorkspace.sharedWorkspace().activeApplication()
            new_app = active_app['NSApplicationName'] if active_app else None
            if new_app != current_app and new_app:
                if current_app is not None:
                    print(f"Switched to '{new_app}'")
                current_app = new_app
            time_since_activity = now - last_activity_time
            is_idle = time_since_activity > 60 # One minute for now but has to be set by the user
            if not is_idle and current_app:
                app_times[current_app] = app_times.get(current_app, 0) + 1
    except KeyboardInterrupt:
        print("\nTime tracking stopped.")


if __name__ == "__main__":
    monitor_thread = threading.Thread(target=monitor_activity)
    monitor_thread.daemon = True
    monitor_thread.start()
    app.run(port=5001)
else:
    monitor_thread = threading.Thread(target=monitor_activity)
    monitor_thread.daemon = True
    monitor_thread.start()