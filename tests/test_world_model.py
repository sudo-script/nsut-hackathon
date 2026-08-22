from collector.schema import NetworkEvent, ProcessEvent
from world_model.graph import EventGraph


def test_graph_records_spawn_and_connect() -> None:
    graph = EventGraph()
    parent = ProcessEvent(
        process_id="10",
        parent_process_id="explorer.exe",
        process_name="WINWORD.EXE",
        command_line="WINWORD.EXE invoice.docm",
        user="alice",
        timestamp=1.0,
    )
    child = ProcessEvent(
        process_id="11",
        parent_process_id="10",
        process_name="powershell.exe",
        command_line="powershell.exe -enc SQBFAFgA",
        user="alice",
        timestamp=2.0,
    )
    net = NetworkEvent(
        source_process="powershell.exe",
        destination_ip="203.0.113.77",
        destination_domain="cfg-relay.net",
        port=443,
        connection_frequency=1,
        timestamp=3.0,
        user="alice",
    )
    graph.ingest(parent, 0)
    graph.ingest(child, 1)
    graph.ingest(net, 2)
    assert graph.has_office_to_script()
    assert "cfg-relay.net" in graph.connected_destinations()
    assert graph.reconstruct_paths()
