import logging
import numpy as np

logger = logging.getLogger("EmbeddingService")


class EmbeddingService:
    _model = None

    @classmethod
    def get_model(cls):
        """
        Lazy-loads the SentenceTransformer model to keep startup footprint light.
        """
        if cls._model is None:
            logger.info("Lazy-loading SentenceTransformer model: 'all-MiniLM-L6-v2'")
            from sentence_transformers import SentenceTransformer

            cls._model = SentenceTransformer("all-MiniLM-L6-v2")
        return cls._model

    @classmethod
    def get_embeddings(cls, texts: list[str]) -> np.ndarray:
        """
        Generates high-dimensional semantic vector embeddings for a list of texts.
        """
        if not texts:
            return np.empty((0, 384), dtype=np.float32)

        try:
            model = cls.get_model()
            embeddings = model.encode(texts, show_progress_bar=False)
            return np.array(embeddings, dtype=np.float32)
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {str(e)}")
            raise e

    @classmethod
    def compute_similarity_faiss(
        cls, source_embeddings: np.ndarray, target_embeddings: np.ndarray
    ) -> float:
        """
        Computes the cosine similarity of the mean embeddings of source and target vectors using FAISS.
        """
        if source_embeddings.size == 0 or target_embeddings.size == 0:
            return 0.0

        try:
            import faiss

            # Aggregate individual embeddings to compute semantic overlap
            mean_source = np.mean(source_embeddings, axis=0, keepdims=True)
            mean_target = np.mean(target_embeddings, axis=0, keepdims=True)

            # Normalize vectors to calculate cosine similarity via dot product
            faiss.normalize_L2(mean_source)
            faiss.normalize_L2(mean_target)

            # Calculate dot product
            similarity = float(np.dot(mean_source, mean_target.T)[0][0])
            return max(0.0, min(1.0, similarity))
        except Exception as e:
            logger.error(f"FAISS cosine similarity computation failed: {str(e)}")
            raise e
