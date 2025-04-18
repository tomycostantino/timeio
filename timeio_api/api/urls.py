from django.urls import path
from . import views

urlpatterns = [
    path('session', views.SessionListCreateView.as_view(), name='session-list-create'),
    path('session/<uuid:session_id>/status', views.SessionStatusView.as_view(), name='session-status'),
]
