import os

from fastapi import (
    HTTPException,
    Request,
)

from clerk_backend_api import (
    authenticate_request,
    AuthenticateRequestOptions,
)




def get_authorized_parties() -> list:
    raw_parties = os.getenv("CLERK_AUTHORIZED_PARTIES", "")
    frontend_url = os.getenv("FRONTEND_URL", "")

    combined = f"{raw_parties},{frontend_url}"
    parties = set()

    for item in combined.split(","):
        cleaned = item.strip().rstrip("/")
        if cleaned:
            parties.add(cleaned)
            parties.add(f"{cleaned}/")

    if not parties:
        parties.add("http://localhost:5173")
        parties.add("http://localhost:5173/")

    return list(parties)


def require_auth(
    request: Request,
) -> str:

    parties = get_authorized_parties()

    request_state = authenticate_request(
        request,
        AuthenticateRequestOptions(
            secret_key=os.getenv(
                "CLERK_SECRET_KEY"
            ),
            authorized_parties=parties,
            accepts_token=[
                "session_token"
            ],
        )
    )

    if not request_state.is_signed_in:
        reason_str = "unauthorized"

        if request_state.reason:
            if hasattr(request_state.reason, "value"):
                val = request_state.reason.value
                if isinstance(val, (list, tuple)):
                    reason_str = str(val[0]) if len(val) > 0 else "unauthorized"
                else:
                    reason_str = str(val)
            else:
                reason_str = str(request_state.reason)

        origin = request.headers.get("origin", "")
        referer = request.headers.get("referer", "")
        print(
            f"[AUTH DEBUG] path={request.url.path} method={request.method} "
            f"origin={origin} referer={referer} authorized_parties={parties} "
            f"is_signed_in=False reason={reason_str}"
        )

        raise HTTPException(
            status_code=401,
            detail=reason_str,
        )

    user_id = request_state.payload.get(
        "sub"
    )

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="User ID not found",
        )

    return user_id