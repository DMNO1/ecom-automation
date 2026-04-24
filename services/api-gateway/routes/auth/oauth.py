from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Dict, Any
from .providers import get_oauth_provider
from loguru import logger

router = APIRouter()

# TODO: Replace with real database dependency later
async def get_db():
    yield None

@router.get("/authorize/{platform}")
async def authorize_shop(platform: str, shop_id: str, redirect_uri: str):
    """
    Step 1: Get the platform authorization URL and redirect the merchant.
    """
    provider = get_oauth_provider(platform)
    try:
        url = await provider.get_authorization_url(shop_id, redirect_uri)
        return {"status": "success", "authorization_url": url}
    except Exception as e:
        logger.error(f"Error getting authorization URL for {platform}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/callback/{platform}")
async def oauth_callback(
    platform: str,
    code: str,
    state: str, # usually contains shop_id or session id
    redirect_uri: str,
    db: Any = Depends(get_db)
):
    """
    Step 2: Handle the callback from the platform, exchange code for tokens, and store them.
    """
    provider = get_oauth_provider(platform)
    try:
        token_data = await provider.exchange_code(code, redirect_uri)

        # Here we would save to the `shop_auth_tokens` unified table.
        # e.g.,
        # await db.execute("INSERT INTO shop_auth_tokens ...", token_data)

        logger.info(f"Successfully exchanged code for tokens for platform {platform}, shop_id {state}")
        return {
            "status": "success",
            "message": "Authorization successful",
            "shop_id": state,
            "tokens": token_data  # Returning for debug/mock purposes, in real life just return success
        }
    except Exception as e:
        logger.error(f"Error exchanging code for {platform}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refresh/{platform}")
async def refresh_shop_token(platform: str, shop_id: str, refresh_token: str, db: Any = Depends(get_db)):
    """
    Step 3: Refresh an expired access token.
    """
    provider = get_oauth_provider(platform)
    try:
        new_token_data = await provider.refresh_token(refresh_token)

        # Here we would update the `shop_auth_tokens` unified table.
        # e.g.,
        # await db.execute("UPDATE shop_auth_tokens SET ... WHERE shop_id = ...", new_token_data)

        logger.info(f"Successfully refreshed tokens for platform {platform}, shop_id {shop_id}")
        return {
            "status": "success",
            "message": "Token refreshed successfully",
            "tokens": new_token_data
        }
    except Exception as e:
        logger.error(f"Error refreshing token for {platform}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
