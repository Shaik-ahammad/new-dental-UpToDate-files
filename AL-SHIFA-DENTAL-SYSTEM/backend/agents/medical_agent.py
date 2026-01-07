from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

# --- PROJECT IMPORTS ---
from agents.base_agent import BaseAgent
from vectordb.client import vector_db

# ==========================================================
# 1. INPUT SCHEMA
# ==========================================================
class MedicalInput(BaseModel):
    user_query: str
    role: str = "patient"
    intent: Optional[str] = None # triage | info

# ==========================================================
# 2. THE AGENT CLASS
# ==========================================================
class MedicalAgent(BaseAgent):
    """
    ELITE MEDICAL AGENT (The Triage Nurse)
    --------------------------------------
    - First line of defense for general queries.
    - Maps symptoms -> Dental Specialists.
    - Provides definitions via Vector Search (RAG).
    """

    def __init__(self):
        super().__init__("medical")
        
        # 1. SPECIALIST MAPPING (Deterministic Routing)
        # Fast, rule-based triage for common scenarios
        self.specialist_map = {
            "root canal": "Endodontist",
            "nerve": "Endodontist",
            "sensitivity": "Endodontist",
            "cavity": "Restorative Dentist",
            "filling": "Restorative Dentist",
            "chip": "Restorative Dentist",
            "implant": "Prosthodontist",
            "denture": "Prosthodontist",
            "crown": "Prosthodontist",
            "braces": "Orthodontist",
            "aligner": "Orthodontist",
            "gap": "Orthodontist",
            "clean": "Hygienist",
            "scale": "Hygienist",
            "gum": "Periodontist",
            "bleed": "Periodontist",
            "loose": "Periodontist",
            "child": "Pediatric Dentist",
            "baby": "Pediatric Dentist",
            "wisdom": "Oral Surgeon",
            "extraction": "Oral Surgeon",
            "jaw": "Oral Surgeon",
            "whitening": "Cosmetic Dentist",
            "veneer": "Cosmetic Dentist"
        }

    async def process(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main Execution Logic.
        Overrides BaseAgent.process().
        """
        # 1. Validate Input
        try:
            if isinstance(payload, dict):
                data = MedicalInput(**payload)
            else:
                data = payload
        except Exception as e:
            return {"response_text": f"Input error: {str(e)}", "action_taken": "error"}

        query = data.user_query.lower()

        # 2. TRIAGE LOGIC (Find the Specialist)
        detected_specialist = "General Dentist" # Default
        detected_issue = None
        
        for keyword, specialist in self.specialist_map.items():
            if keyword in query:
                detected_issue = keyword
                detected_specialist = specialist
                break
        
        # 3. CONTEXT RETRIEVAL (Vector RAG)
        # We try to get a definition from the vector DB. 
        # If not found (or DB empty in MVP), we fall back to a generic message.
        context_info = ""
        if detected_issue:
            try:
                # Query the 'clinical_guidelines' collection
                docs = vector_db.query("clinical_guidelines", f"definition of {detected_issue}", n_results=1)
                if docs:
                    context_info = docs[0]
            except Exception:
                pass # Fail silently on RAG, proceed with triage

        # 4. CONSTRUCT RESPONSE
        if detected_issue:
            response_text = (
                f"Based on your mention of **'{detected_issue}'**, I recommend seeing a **{detected_specialist}**.\n\n"
            )
            
            if context_info:
                response_text += f"ℹ️ *Info:* {context_info}\n\n"
            
            response_text += f"Would you like me to check availability for a {detected_specialist}?"
            
            return {
                "response_text": response_text,
                "action_taken": "suggest_specialist",
                "data": {
                    "suggested_specialist": detected_specialist,
                    "detected_issue": detected_issue
                }
            }
        else:
            return {
                "response_text": (
                    "I'm not 100% sure which specialist you need based on that description. "
                    "For general concerns, a **General Dentist** is the best starting point.\n\n"
                    "Shall I look for general checkup slots?"
                ),
                "action_taken": "suggest_general",
                "data": {
                    "suggested_specialist": "General Dentist"
                }
            }