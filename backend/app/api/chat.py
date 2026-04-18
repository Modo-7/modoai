from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.api.deps import get_db_session
from app.core.security import get_current_user
from app.services.ai_service import ai_service
from app.models.user import User
from app.models.conversation import Conversation, Message
from pydantic import BaseModel
import json

router = APIRouter(prefix="/chat", tags=["chat"])


class MessageRequest(BaseModel):
    conversation_id: Optional[str] = None
    content: str
    stream: bool = True
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    conversation_id: str
    created_at: str


class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str


@router.post("/completions")
async def chat_completion(
    request: MessageRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    user_id = current_user["user_id"]
    
    # Get or create conversation
    if request.conversation_id:
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == request.conversation_id,
                Conversation.user_id == user_id
            )
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(user_id=user_id, title=request.content[:50])
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
    
    # Save user message
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.content
    )
    db.add(user_message)
    await db.commit()
    
    # Get conversation history
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()
    
    # Format messages for AI
    chat_messages = [
        {"role": "system", "content": "You are an expert coding assistant. Provide accurate, efficient, and well-structured code solutions. Explain your reasoning clearly."}
    ]
    for msg in messages:
        chat_messages.append({"role": msg.role, "content": msg.content})
    
    if request.stream:
        async def generate():
            full_response = ""
            async for chunk in ai_service.generate_response(
                chat_messages,
                stream=True,
                temperature=request.temperature,
                max_tokens=request.max_tokens
            ):
                full_response += chunk
                yield f"data: {json.dumps({'content': chunk})}\n\n"
            
            # Save assistant message
            assistant_message = Message(
                conversation_id=conversation.id,
                role="assistant",
                content=full_response
            )
            db.add(assistant_message)
            await db.commit()
            
            yield f"data: {json.dumps({'done': True, 'conversation_id': conversation.id})}\n\n"
        
        return StreamingResponse(generate(), media_type="text/event-stream")
    else:
        full_response = ""
        async for chunk in ai_service.generate_response(
            chat_messages,
            stream=False,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        ):
            full_response += chunk
        
        # Save assistant message
        assistant_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=full_response
        )
        db.add(assistant_message)
        await db.commit()
        
        return {
            "content": full_response,
            "conversation_id": conversation.id
        }


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    user_id = current_user["user_id"]
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
    )
    conversations = result.scalars().all()
    return conversations


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    user_id = current_user["user_id"]
    
    # Verify conversation belongs to user
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get messages
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()
    return messages


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    user_id = current_user["user_id"]
    
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    await db.delete(conversation)
    await db.commit()
    
    return {"message": "Conversation deleted"}
