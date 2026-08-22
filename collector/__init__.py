"""Event collection, schemas, normalization, and feature construction."""

from collector.schema import (
    AuthEvent,
    Event,
    FileEvent,
    NetworkEvent,
    ProcessEvent,
    Sequence,
)
from collector.event_normalizer import normalize_event, normalize_sequence
from collector.feature_builder import FeatureBuilder, feature_names

__all__ = [
    "AuthEvent",
    "Event",
    "FileEvent",
    "NetworkEvent",
    "ProcessEvent",
    "Sequence",
    "normalize_event",
    "normalize_sequence",
    "FeatureBuilder",
    "feature_names",
]
