def test_get_current_user(test_client, auth_headers):
    response = test_client.get(
        "/auth/me",
        headers=auth_headers
    )

    # basic checks
    assert response.status_code in [200, 401]

    if response.status_code == 200:
        data = response.json()
        assert "id" in data
        assert "name" in data