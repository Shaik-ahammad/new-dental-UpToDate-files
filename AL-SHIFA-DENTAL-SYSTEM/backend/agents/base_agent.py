from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple
from datetime import datetime

class BaseAgent(ABC):
    """
    ELITE AGENT BASE CLASS
    ----------------------
    Standardizes AI behavior across the system.
    Enforces Safety, Logging, and consistent Execution signatures.
    """

    def __init__(self, agent_name: str):
        self.agent_name = agent_name

    async def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Universal wrapper. The Router calls THIS method.
        Matches Version B's 'execute' naming preference but keeps Version A's robust logic.
        
        Payload Expectation:
        {
            "user_query": str,
            "user_id": str,
            "context": dict (optional session history),
            ...
        }
        """
        user_query = payload.get("user_query", "")

        # 1. Safety Guardrails (From Ver A)
        is_safe, refusal_reason = self.safety_check(user_query)
        
        if not is_safe:
            self.log_action("safety_block", {"reason": refusal_reason, "query": user_query})
            return {
                "response_text": refusal_reason,
                "action_taken": "escalate_to_human",
                "status": "blocked",
                "ui_component": "emergency_banner" # From Ver B
            }

        # 2. Execute Specific Logic
        try:
            start_time = datetime.utcnow()
            
            # Delegate to child class implementation
            response = await self.process(payload)
            
            duration = (datetime.utcnow() - start_time).total_seconds()
            
            # Log success
            self.log_action("success", {
                "query": user_query, 
                "latency": f"{duration}s",
                "action_taken": response.get("action_taken")
            })
            
            return response

        except Exception as e:
            self.log_action("error", {"error": str(e), "trace": f"{self.agent_name}.process"})
            return {
                "response_text": "I encountered an internal processing error. Please contact support.",
                "action_taken": "error",
                "debug_info": str(e)
            }

    @abstractmethod
    async def process(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Abstract method. Child agents MUST implement this logic.
        """
        pass

    def safety_check(self, query: str) -> Tuple[bool, str]:
        """
        Global Guardrails applied to ALL agents.
        """
        query = query.lower()
        
        # Rule 1: Emergency Detection (Life Safety - Merged A & B keywords)
        red_flags = [
            "bleeding heavily", "unconscious", "heart attack", "stroke", 
            "can't breathe", "suicide", "overdose", "severe pain", "trauma"
        ]
        
        if any(flag in query for flag in red_flags):
            return False, "🚨 CRITICAL ALERT: This sounds like a medical emergency. Please call Emergency Services (911) immediately. I cannot handle life-threatening situations."

        # Rule 2: System Abuse (Basic Injection Prevention)
        abuse_flags = ["ignore previous instructions", "system prompt", "drop table"]
        if any(flag in query for flag in abuse_flags):
            return False, "I cannot process that request due to security policies."

        return True, ""

    def log_action(self, action: str, details: Dict[str, Any]):
        """
        Structured Logging for Observability.
        """
        timestamp = datetime.utcnow().isoformat()
        print(f"[LOG][{timestamp}][AGENT:{self.agent_name.upper()}] action={action} details={details}")