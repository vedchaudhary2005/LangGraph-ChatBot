import os

from fastapi import (
    HTTPException,
    Request,
)

from clerk_backend_api import (
    authenticate_request,
    AuthenticateRequestOptions,
)




def require_auth(
    request: Request,
) -> str:

    authorized_parties = os.getenv(
        "CLERK_AUTHORIZED_PARTIES",
        "http://localhost:5173",
    )

    # Support comma-separated list of parties
    parties = [
        party.strip()
        for party in authorized_parties.split(",")
        if party.strip()
    ]

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

        reason = (
            request_state.reason.value[0]
            if request_state.reason
            else "unauthorized"
        )

        raise HTTPException(
            status_code=401,
            detail=reason,
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