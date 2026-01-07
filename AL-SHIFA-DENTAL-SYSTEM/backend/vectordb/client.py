import chromadb
from chromadb.config import Settings
import os

class VectorDBClient:
    """
    Central VectorDB Client (ChromaDB).
    Handles Long-Term Memory: Patient History & Clinical Guidelines.
    """
    def __init__(self):
        # Ensure persistence directory exists
        db_path = "./chroma_db"
        if not os.path.exists(db_path):
            os.makedirs(db_path)

        # Use PersistentClient (From Ver B) for data retention
        self.client = chromadb.PersistentClient(path=db_path)
        
        # Initialize Collections (Auto-create if missing)
        self.patient_history = self.client.get_or_create_collection("patient_history")
        self.clinical_guidelines = self.client.get_or_create_collection("clinical_guidelines")
        
    def add_document(self, collection_name: str, doc_id: str, text: str, metadata: dict):
        """
        Helper to add or update a document in vector store.
        """
        collection = self.client.get_collection(collection_name)
        collection.upsert(
            ids=[doc_id],
            documents=[text],
            metadatas=[metadata]
        )
        
    def query(self, collection_name: str, query_text: str, n_results=3):
        """
        Semantic Search Helper.
        """
        collection = self.client.get_collection(collection_name)
        results = collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        if results['documents']:
            return results['documents'][0] # Return list of matched strings
        return []

# Singleton Instance for import
vector_db = VectorDBClient()