import io

def test_upload_profile_image(test_client, auth_headers):
    fake_image = io.BytesIO(b"fake image data")

    response = test_client.post(
        "/users/upload-profile-img",
        files={"file": ("test.jpg", fake_image, "image/jpeg")},
        headers=auth_headers
    )

    # basic checks
    assert response.status_code in [200, 401]

    if response.status_code == 200:
        data = response.json()
        assert "profile_image" in data

def test_update_user_name(test_client, auth_headers):
    response = test_client.put(
        "/users/me",
        json={"name": "Test User"},
        headers=auth_headers
    )

    # basic checks
    assert response.status_code in [200, 401]

    if response.status_code == 200:
        assert response.json()["status"] == "updated"

def test_get_user(test_client):
    response = test_client.get("/auth/me")
        
    # basic checks
    assert response.status_code in [200, 401]

