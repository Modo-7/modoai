import httpx
import json
from typing import AsyncGenerator, Dict, List, Optional
from app.core.config import settings


class AIService:
    def __init__(self):
        self.provider = settings.MODEL_PROVIDER
        
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        stream: bool = False,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        if self.provider == "huggingface":
            async for chunk in self._huggingface_generate(messages, stream, temperature, max_tokens):
                yield chunk
        elif self.provider == "ollama":
            async for chunk in self._ollama_generate(messages, stream, temperature, max_tokens):
                yield chunk
        else:
            raise ValueError(f"Unknown model provider: {self.provider}")
    
    async def _huggingface_generate(
        self,
        messages: List[Dict[str, str]],
        stream: bool,
        temperature: Optional[float],
        max_tokens: Optional[int]
    ) -> AsyncGenerator[str, None]:
        url = f"{settings.HF_API_URL}/{settings.HF_MODEL}"
        headers = {}
        
        if settings.HF_API_KEY:
            headers["Authorization"] = f"Bearer {settings.HF_API_KEY}"
        
        # Convert messages to prompt format
        prompt = self._format_messages_to_prompt(messages)
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": max_tokens or settings.MAX_TOKENS,
                "temperature": temperature or settings.TEMPERATURE,
                "top_p": settings.TOP_P,
                "return_full_text": False,
                "stream": stream
            }
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            if stream:
                async with client.stream("POST", url, json=payload, headers=headers) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                if line.startswith("data: "):
                                    line = line[6:]
                                if line == "[DONE]":
                                    break
                                data = json.loads(line)
                                if isinstance(data, list) and len(data) > 0:
                                    if "generated_text" in data[0]:
                                        yield data[0]["generated_text"]
                                elif "token" in data:
                                    yield data["token"]["text"]
                            except json.JSONDecodeError:
                                continue
            else:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    if "generated_text" in result[0]:
                        yield result[0]["generated_text"]
                elif "generated_text" in result:
                    yield result["generated_text"]
    
    async def _ollama_generate(
        self,
        messages: List[Dict[str, str]],
        stream: bool,
        temperature: Optional[float],
        max_tokens: Optional[int]
    ) -> AsyncGenerator[str, None]:
        url = f"{settings.OLLAMA_BASE_URL}/api/generate"
        
        payload = {
            "model": settings.OLLAMA_MODEL,
            "prompt": self._format_messages_to_prompt(messages),
            "stream": stream,
            "options": {
                "temperature": temperature or settings.TEMPERATURE,
                "num_predict": max_tokens or settings.MAX_TOKENS,
                "top_p": settings.TOP_P
            }
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            if stream:
                async with client.stream("POST", url, json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                if "response" in data:
                                    yield data["response"]
                                if data.get("done"):
                                    break
                            except json.JSONDecodeError:
                                continue
            else:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                result = response.json()
                if "response" in result:
                    yield result["response"]
    
    def _format_messages_to_prompt(self, messages: List[Dict[str, str]]) -> str:
        """Format chat messages into a single prompt string"""
        prompt = ""
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                prompt += f"System: {content}\n\n"
            elif role == "user":
                prompt += f"User: {content}\n"
            elif role == "assistant":
                prompt += f"Assistant: {content}\n"
        prompt += "Assistant:"
        return prompt


ai_service = AIService()
