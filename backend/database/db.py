import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient



# LOAD ENVIRONMENT VARIABLES


load_dotenv()

# MONGODB CONNECTION


MONGODB_URL = os.getenv("MONGODB_URL")

MONGODB_DB = os.getenv(
    "MONGODB_DB",
    "langgraph_chat",
)


if not MONGODB_URL:
    raise RuntimeError(
        "MONGODB_URL is not set in .env"
    )


# MONGODB CLIENT


mongo_client = AsyncIOMotorClient(
    MONGODB_URL
)


# DATABASE


db = mongo_client[MONGODB_DB]



# CHAT COLLECTION

chat_collection = db["chats"]



# SAVE MESSAGE


async def save_message(
    thread_id: str,
    user_id: str,
    role: str,
    content: str,
):

    await chat_collection.update_one(
        {
            "thread_id": thread_id,
            "user_id": user_id,
        },
        {
            "$push": {
                "messages": {
                    "role": role,
                    "content": content,
                }
            }
        },
        upsert=True,
    )


# GET CHAT HISTORY


async def get_chat_history(
    thread_id: str,
    user_id: str,
):

    chat = await chat_collection.find_one(
        {
            "thread_id": thread_id,
            "user_id": user_id,
        }
    )

    if not chat:
        return []

    return chat.get(
        "messages",
        []
    )

# GET ALL USER CHATS


async def get_all_user_chats(
    user_id: str,
):

    cursor = chat_collection.find(
        {
            "user_id": user_id,
        }
    )

    chats = await cursor.to_list(length=100)

    result = []
    for doc in chats:
        thread_id = doc.get("thread_id")
        messages = doc.get("messages", [])
        if not thread_id:
            continue

        first_user = next(
            (m["content"] for m in messages if m.get("role") == "user"),
            "New Chat",
        )

        title = (
            first_user[:45] + "…"
            if len(first_user) > 45
            else first_user
        )

        result.append(
            {
                "checkpoint_id": thread_id,
                "title": title,
                "messages": messages,
            }
        )

    return list(reversed(result))
