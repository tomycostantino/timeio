from django.db import models
import uuid
import json


class Session(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    time_start = models.DateTimeField(auto_now_add=True)
    time_end = models.DateTimeField(null=True, blank=True)
    time_total = models.DurationField(null=True, blank=True)
    idle_time = models.IntegerField(null=False, blank=False)

    def __str__(self):
        return f"Session {self.id} - {self.time_start.strftime('%Y-%m-%d %H:%M')}"

class AppUsage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='app_usages')
    app_usage_json = models.TextField()  # Store JSON as text in SQLite
    timestamp = models.DateTimeField(auto_now_add=True)

    @property
    def app_usage(self):
        return json.loads(self.app_usage_json)

    @app_usage.setter
    def app_usage(self, value):
        self.app_usage_json = json.dumps(value)

    def __str__(self):
        return f"AppUsage {self.id} - {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"