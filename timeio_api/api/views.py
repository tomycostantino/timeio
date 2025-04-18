from rest_framework import generics
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.views import APIView
from .models import Session
from .serializers import SessionSerializer
from .time_tracker import get_tracker
from django.utils import timezone


class SessionListCreateView(generics.ListCreateAPIView):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer

    def post(self, request, *args, **kwargs):
        action = request.data.get('action')
        ongoing_session = Session.objects.filter(time_end__isnull=True).first()

        if action == 'start':
            if ongoing_session:
                raise ValidationError("Cannot start a new session while another session is active.")

            response = super().post(request, *args, **kwargs)
            session_id = response.data.get('id')
            tracker = get_tracker()
            tracker.start(session_id)
            return response

        elif action == 'stop':
            if not ongoing_session:
                raise ValidationError("Cannot stop a session when no session is active.")

            tracker = get_tracker()
            tracker.stop()

            ongoing_session.time_end = timezone.now()
            ongoing_session.time_total = ongoing_session.time_end - ongoing_session.time_start
            ongoing_session.save()

            serializer = self.get_serializer(ongoing_session)
            return Response(serializer.data)

        else:
            raise ValidationError("Invalid action. Must be 'start' or 'stop'.")


class SessionStatusView(APIView):
    def get(self, request, session_id, *args, **kwargs):
        try:
            session = Session.objects.get(id=session_id)
        except Session.DoesNotExist:
            raise NotFound(f"Session with id {session_id} not found.")

        app_usages = session.app_usages.all()

        app_times = {}
        # This should be calculated at DB level
        for usage in app_usages:
            usage_data = usage.app_usage
            for app_name, seconds in usage_data.items():
                app_times[app_name] = app_times.get(app_name, 0) + seconds

        serializer = SessionSerializer(session)

        response_data = serializer.data
        response_data['app_usages'] = app_times

        return Response(response_data)
