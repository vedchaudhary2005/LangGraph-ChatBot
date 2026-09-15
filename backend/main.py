import os
import json

from uuid import uuid4
from typing import TypedDict, Annotated, Optional

from dotenv import load_dotenv

load_dotenv()




from fastapi import FastAPI, Query, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware




from langgraph.graph import StateGraph, END, add_messages



# LANGCHAIN MESSAGES


from langchain_core.messages import (
    HumanMessage,
    AIMessage,
    AIMessageChunk,
    ToolMessage,
)


# GEMINI


from langchain_google_genai import ChatGoogleGenerativeAI



# TAVILY


from langchain_community.tools.tavily_search import (
    TavilySearchResults,
)


# OUR FILES


from auth.clerk import require_auth

from database.db import (
    save_message,
    get_chat_history,
    get_all_user_chats,
)



# STATE


class State(TypedDict):
    messages: Annotated[
        list,
        add_messages,
    ]



# TAVILY SEARCH TOOL


search_tool = TavilySearchResults(
    max_results=4,
)

tools = [
    search_tool,
]



# GEMINI MODEL

llm = ChatGoogleGenerativeAI(
    model="gemini-3.6-flash",
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0,
)



# GEMINI + TOOLS


llm_with_tools = llm.bind_tools(tools)



# MODEL NODE


async def model(state: State):

    result = await llm_with_tools.ainvoke(
        state["messages"]
    )

    return {
        "messages": [result]
    }



# TOOL ROUTER


def tools_router(state: State):

    last_message = state["messages"][-1]

    if (
        hasattr(last_message, "tool_calls")
        and last_message.tool_calls
    ):
        return "tool_node"

    return END



# TOOL NODE


async def tool_node(state: State):

    last_msg = state["messages"][-1]
    tool_calls = getattr(last_msg, "tool_calls", [])

    tool_messages = []

    for tool_call in tool_calls:

        tool_name = tool_call.get("name") if isinstance(tool_call, dict) else getattr(tool_call, "name", None)
        tool_args = tool_call.get("args", {}) if isinstance(tool_call, dict) else getattr(tool_call, "args", {})
        tool_id = tool_call.get("id") if isinstance(tool_call, dict) else getattr(tool_call, "id", None)

     
        # TAVILY SEARCH
   

        if tool_name == search_tool.name or tool_name == "tavily_search_results_json":

            try:
                search_results = await search_tool.ainvoke(
                    tool_args
                )
            except Exception as search_err:
                print(f"[TOOL ERROR] Tavily search execution error: {type(search_err).__name__}: {search_err}")
                search_results = []

            tool_message = ToolMessage(
                content=str(search_results),
                tool_call_id=tool_id,
                name=tool_name,
            )

            tool_messages.append(tool_message)

    return {
        "messages": tool_messages
    }



# BUILD LANGGRAPH


graph_builder = StateGraph(State)

graph_builder.add_node(
    "model",
    model,
)

graph_builder.add_node(
    "tool_node",
    tool_node,
)

graph_builder.set_entry_point("model")

graph_builder.add_conditional_edges(
    "model",
    tools_router,
)

graph_builder.add_edge(
    "tool_node",
    "model",
)

graph = graph_builder.compile()






app = FastAPI()



# CORS


app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)



# SERIALIZE AI MESSAGE CHUNK


def serialise_ai_message_chunk(chunk):

    if isinstance(chunk, AIMessageChunk):

        content = chunk.content

        if isinstance(content, str):
            return content
        elif isinstance(content, list):
            text_parts = []
            for item in content:
                if isinstance(item, str):
                    text_parts.append(item)
                elif isinstance(item, dict) and item.get("type") == "text":
                    text_parts.append(item.get("text", ""))
            return "".join(text_parts)

        return ""

    elif isinstance(chunk, str):
        return chunk

    return ""


# ==
# GENERATE CHAT RESPONSES
# ==

async def generate_chat_responses(
    message: str,
    user_id: str,
    checkpoint_id: Optional[str] = None,
):

    try:
        
        # CREATE OR GET THREAD ID
        

        if not checkpoint_id or not str(checkpoint_id).strip():

            thread_id = str(uuid4())

            checkpoint_data = {
                "type": "checkpoint",
                "checkpoint_id": thread_id,
            }

            yield (
                f"data: {json.dumps(checkpoint_data)}\n\n"
            )

        else:

            thread_id = str(checkpoint_id).strip()

        
        # GET PREVIOUS CHAT HISTORY
        

        history = await get_chat_history(
            thread_id,
            user_id,
        )

        print(f"[CHAT DEBUG] Received checkpoint_id='{checkpoint_id}', resolved thread_id='{thread_id}'")
        print(f"[CHAT DEBUG] History messages count from DB: {len(history)}")

        
        # CONVERT MONGODB HISTORY
        # INTO LANGCHAIN MESSAGES
        

        messages = []

        for item in history:
            role = item.get("role")
            content = item.get("content", "")

            if role == "user":

                messages.append(
                    HumanMessage(
                        content=content
                    )
                )

            elif role == "assistant":

                messages.append(
                    AIMessage(
                        content=content
                    )
                )

        
        # ADD CURRENT USER MESSAGE
        

        messages.append(
            HumanMessage(
                content=message
            )
        )

        
        # SAVE USER MESSAGE
        

        try:
            await save_message(
                thread_id,
                user_id,
                "user",
                message,
            )
        except Exception as db_err:
            print(f"[CHAT ERROR] Failed to save user message to DB: {db_err}")

        
        # RUN LANGGRAPH
        

        print(f"[CHAT DEBUG] Total messages sent to LangGraph: {len(messages)}")

        events = graph.astream_events(
            {
                "messages": messages
            },
            version="v2",
        )

      
        # STORE COMPLETE AI RESPONSE
    

        assistant_response = ""

        
        # STREAM EVENTS
        

        async for event in events:

            event_type = event.get("event")

            # CHAT MODEL STREAM

            if event_type == "on_chat_model_stream":

                data = event.get("data", {})
                chunk = data.get("chunk")

                if chunk is not None:
                    chunk_content = serialise_ai_message_chunk(chunk)

                    if not chunk_content:
                        continue

                    assistant_response += chunk_content

                    content_data = {
                        "type": "content",
                        "content": chunk_content,
                    }

                    yield (
                        f"data: {json.dumps(content_data)}\n\n"
                    )

            # CHAT MODEL END

            elif event_type == "on_chat_model_end":

                data = event.get("data", {})
                output = data.get("output")

                if output:
                    tool_calls = getattr(
                        output,
                        "tool_calls",
                        [],
                    )

                    if not tool_calls and isinstance(output, dict):
                        tool_calls = output.get("tool_calls", [])

                    for call in (tool_calls or []):
                        call_name = call.get("name") if isinstance(call, dict) else getattr(call, "name", None)
                        call_args = call.get("args", {}) if isinstance(call, dict) else getattr(call, "args", {})

                        if call_name == "tavily_search_results_json":

                            query = call_args.get("query", "") if isinstance(call_args, dict) else ""

                            search_data = {
                                "type": "search_start",
                                "query": query,
                            }

                            yield (
                                f"data: {json.dumps(search_data)}\n\n"
                            )

            # TOOL END

            elif (
                event_type == "on_tool_end"
                and event.get("name") == "tavily_search_results_json"
            ):

                data = event.get("data", {})
                output = data.get("output")

                urls = []

                if hasattr(output, "content"):
                    output = output.content

                if isinstance(output, str):
                    try:
                        output = json.loads(output)
                    except Exception:
                        pass

                if isinstance(output, list):

                    for item in output:

                        if (
                            isinstance(item, dict)
                            and "url" in item
                        ):
                            urls.append(item["url"])

                search_results_data = {
                    "type": "search_results",
                    "urls": urls,
                }

                yield (
                    f"data: {json.dumps(search_results_data)}\n\n"
                )

        
        # SAVE FINAL AI RESPONSE
        

        if assistant_response:

            try:
                await save_message(
                    thread_id,
                    user_id,
                    "assistant",
                    assistant_response,
                )
            except Exception as db_err:
                print(f"[CHAT ERROR] Failed to save assistant message to DB: {db_err}")

        
        # END STREAM
        

        yield 'data: {"type":"end"}\n\n'

    except Exception as e:
        print(f"[CHAT ERROR] SSE generator exception: {type(e).__name__}: {str(e)}")

        error_data = {
            "type": "error",
            "message": "An error occurred while generating the response.",
        }

        yield (
            f"data: {json.dumps(error_data)}\n\n"
        )

        yield 'data: {"type":"end"}\n\n'


# ==
# CHAT ENDPOINT
# ==

@app.get("/chat_stream/{message}")
async def chat_stream(
    message: str,

    checkpoint_id: Optional[str] = Query(
        None
    ),

    user_id: str = Depends(
        require_auth
    ),
):

    return StreamingResponse(
        generate_chat_responses(
            message,
            user_id,
            checkpoint_id,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ==
# USER CHATS ENDPOINT
# ==

@app.get("/chats")
async def user_chats(
    user_id: str = Depends(
        require_auth
    ),
):
    """
    Return all saved chat threads for the authenticated user.

    Security: always filters by user_id so a user can only
    retrieve their own conversations.
    """

    chats = await get_all_user_chats(
        user_id,
    )

    return chats


# ==
# CHAT HISTORY ENDPOINT
# ==

@app.get("/chat_history/{checkpoint_id}")
async def chat_history(
    checkpoint_id: str,

    user_id: str = Depends(
        require_auth
    ),
):
    """
    Return the saved messages for a conversation.

    Security: always filters by BOTH thread_id AND user_id so
    a user can never retrieve another user's conversation.
    """

    messages = await get_chat_history(
        checkpoint_id,
        user_id,
    )

    return {
        "checkpoint_id": checkpoint_id,
        "messages": messages,
    }


# ==
# HEALTH CHECK
# ==

@app.get("/")
async def root():

    return {
        "message": "LangGraph Gemini API is running"
    }