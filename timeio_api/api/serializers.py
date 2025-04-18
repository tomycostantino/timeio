from rest_framework import serializers
from .models import Session, AppUsage


class AppUsageSerializer(serializers.ModelSerializer):
    app_usage = serializers.JSONField()

    class Meta:
        model = AppUsage
        fields = ('id', 'app_usage', 'timestamp')


class SessionSerializer(serializers.ModelSerializer):
    app_usages = AppUsageSerializer(many=True, read_only=True)

    class Meta:
        model = Session
        fields = ('id', 'time_start', 'time_end', 'time_total', 'idle_time', 'app_usages')
        extra_kwargs = {
            'time_start': { 'read_only': True },
            'time_end': { 'read_only': True },
            'time_total': { 'read_only': True }
        }
