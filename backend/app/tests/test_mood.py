def test_get_mood_stats(test_client, auth_headers):
    response = test_client.get(
        "/mood/stats",
        headers=auth_headers
    )

    # basic checks
    assert response.status_code in [200, 401]

    if response.status_code == 200:
        data = response.json()
        assert "total_syncs" in data
        assert "current_streak" in data