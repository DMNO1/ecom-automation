import pytest
from datetime import datetime, timedelta
import hashlib
import time

from models import DouyinConfig
from auth import DouyinAuthManager, init_auth_manager, get_auth_manager

@pytest.fixture
def config():
    return DouyinConfig(
        app_key="test_app_key",
        app_secret="test_app_secret"
    )

@pytest.fixture
def auth_manager(config):
    return DouyinAuthManager(config)

def test_generate_sign(auth_manager, config):
    params = {
        "param1": "value1",
        "param2": "value2",
        "sign": "should_be_filtered_out",
        "null_param": None
    }

    # Expected param_str: param1value1param2value2test_app_secret
    expected_str = "param1value1param2value2" + config.app_secret
    expected_sign = hashlib.md5(expected_str.encode("utf-8")).hexdigest()

    sign = auth_manager._generate_sign(params)
    assert sign == expected_sign

def test_add_common_params(auth_manager, config):
    params = {
        "param1": "value1"
    }

    result = auth_manager._add_common_params(params)

    assert result["app_key"] == config.app_key
    assert "timestamp" in result
    assert result["v"] == "2"
    assert result["format"] == "json"
    assert "sign" in result

    # Verify the sign matches
    expected_sign = auth_manager._generate_sign(result)
    assert result["sign"] == expected_sign


import respx
import httpx

@pytest.mark.asyncio
async def test_get_access_token_success(auth_manager, config):
    auth_code = "test_code"
    expected_response = {
        "code": 0,
        "message": "success",
        "data": {
            "access_token": "new_access_token",
            "refresh_token": "new_refresh_token",
            "expires_in": 7200,
            "shop_id": "shop_123"
        }
    }

    with respx.mock:
        route = respx.post(f"{auth_manager.BASE_URL}{auth_manager.TOKEN_URL}").respond(
            status_code=200, json=expected_response
        )

        result = await auth_manager.get_access_token(auth_code)

        assert route.called
        assert result == expected_response["data"]
        assert config.access_token == "new_access_token"
        assert config.refresh_token == "new_refresh_token"
        assert config.shop_id == "shop_123"
        assert config.token_expires_at is not None
        # Verify expiration is around 7200 seconds from now
        expires_diff = config.token_expires_at - datetime.now()
        assert 7100 < expires_diff.total_seconds() < 7300

@pytest.mark.asyncio
async def test_get_access_token_failure(auth_manager):
    auth_code = "test_code"
    expected_response = {
        "code": 1,
        "message": "invalid code"
    }

    with respx.mock:
        route = respx.post(f"{auth_manager.BASE_URL}{auth_manager.TOKEN_URL}").respond(
            status_code=200, json=expected_response
        )

        with pytest.raises(Exception, match="获取token失败: invalid code"):
            await auth_manager.get_access_token(auth_code)

        assert route.called

@pytest.mark.asyncio
async def test_get_access_token_http_error(auth_manager):
    auth_code = "test_code"

    with respx.mock:
        route = respx.post(f"{auth_manager.BASE_URL}{auth_manager.TOKEN_URL}").respond(
            status_code=500
        )

        with pytest.raises(httpx.HTTPStatusError):
            await auth_manager.get_access_token(auth_code)

        assert route.called

@pytest.mark.asyncio
async def test_refresh_access_token_success(auth_manager, config):
    config.refresh_token = "old_refresh_token"
    expected_response = {
        "code": 0,
        "message": "success",
        "data": {
            "access_token": "new_access_token_2",
            "refresh_token": "new_refresh_token_2",
            "expires_in": 7200
        }
    }

    with respx.mock:
        route = respx.post(f"{auth_manager.BASE_URL}{auth_manager.REFRESH_TOKEN_URL}").respond(
            status_code=200, json=expected_response
        )

        result = await auth_manager.refresh_access_token()

        assert route.called
        assert result == expected_response["data"]
        assert config.access_token == "new_access_token_2"
        assert config.refresh_token == "new_refresh_token_2"
        assert config.token_expires_at is not None

@pytest.mark.asyncio
async def test_refresh_access_token_no_token(auth_manager, config):
    config.refresh_token = None

    with pytest.raises(Exception, match="没有refresh_token，无法刷新"):
        await auth_manager.refresh_access_token()

@pytest.mark.asyncio
async def test_refresh_access_token_failure(auth_manager, config):
    config.refresh_token = "old_refresh_token"
    expected_response = {
        "code": 1,
        "message": "invalid refresh token"
    }

    with respx.mock:
        route = respx.post(f"{auth_manager.BASE_URL}{auth_manager.REFRESH_TOKEN_URL}").respond(
            status_code=200, json=expected_response
        )

        with pytest.raises(Exception, match="刷新token失败: invalid refresh token"):
            await auth_manager.refresh_access_token()

        assert route.called


@pytest.mark.asyncio
async def test_ensure_valid_token_valid(auth_manager, config):
    config.access_token = "valid_token"
    # Set expiration to far in the future
    config.token_expires_at = datetime.now() + timedelta(hours=1)

    token = await auth_manager.ensure_valid_token()
    assert token == "valid_token"

@pytest.mark.asyncio
async def test_ensure_valid_token_missing(auth_manager, config):
    config.access_token = None

    with pytest.raises(Exception, match="没有access_token，请先进行授权"):
        await auth_manager.ensure_valid_token()

@pytest.mark.asyncio
async def test_ensure_valid_token_near_expiration(auth_manager, config):
    config.access_token = "old_token"
    config.refresh_token = "valid_refresh_token"
    # Set expiration to 4 minutes from now (triggering < 5 min condition)
    config.token_expires_at = datetime.now() + timedelta(minutes=4)

    expected_response = {
        "code": 0,
        "message": "success",
        "data": {
            "access_token": "new_refreshed_token",
            "refresh_token": "new_refresh_token",
            "expires_in": 7200
        }
    }

    with respx.mock:
        route = respx.post(f"{auth_manager.BASE_URL}{auth_manager.REFRESH_TOKEN_URL}").respond(
            status_code=200, json=expected_response
        )

        token = await auth_manager.ensure_valid_token()

        assert route.called
        # The token returned should actually be the updated access token in the config
        assert token == "new_refreshed_token"
        assert config.access_token == "new_refreshed_token"

def test_get_auth_url(auth_manager, config):
    redirect_uri = "https://example.com/callback"
    state = "test_state"

    url = auth_manager.get_auth_url(redirect_uri, state)

    assert url.startswith("https://fxg.jinritemai.com/ffa/mshopauth/authpage?")
    assert f"app_key={config.app_key}" in url
    assert f"redirect_uri={redirect_uri}" in url
    assert f"state={state}" in url
    assert "response_type=code" in url

def test_init_and_get_auth_manager(config):
    # Reset globals before test
    import auth
    auth._config = None
    auth._auth_manager = None

    # Check it raises before init
    with pytest.raises(Exception, match="授权管理器未初始化"):
        get_auth_manager()

    # Init and check
    manager = init_auth_manager(config)
    assert manager is not None
    assert isinstance(manager, DouyinAuthManager)

    # Get and check it's the same
    manager_again = get_auth_manager()
    assert manager_again is manager
