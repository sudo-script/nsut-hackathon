from collector.event_normalizer import normalize_event, normalize_sequence


def test_normalize_process_event() -> None:
    event = normalize_event(
        {
            "type": "process",
            "pid": "44",
            "ppid": "1",
            "name": "powershell.exe",
            "cmdline": "powershell.exe -File health.ps1",
            "user": "admin.lee",
            "timestamp": 10,
        }
    )
    assert event.process_name == "powershell.exe"
    assert event.parent_process_id == "1"


def test_normalize_sequence_roundtrip() -> None:
    sequence = normalize_sequence(
        {
            "sequence_id": "s1",
            "label": "malicious",
            "family": "demo",
            "first_malicious_index": 1,
            "events": [
                {
                    "event_type": "network",
                    "source_process": "powershell.exe",
                    "destination_ip": "185.22.61.14",
                    "destination_domain": "cdn-update-check.xyz",
                    "port": 443,
                    "connection_frequency": 2,
                    "timestamp": 11,
                }
            ],
        }
    )
    assert sequence.is_malicious
    assert sequence.events[0].destination_domain == "cdn-update-check.xyz"
